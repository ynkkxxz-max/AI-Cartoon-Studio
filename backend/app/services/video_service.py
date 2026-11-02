import os
import re
import subprocess
import uuid
import shutil
from pathlib import Path
from typing import List, Dict, Any, Tuple
from backend.app.core.config import FFMPEG_PATH, UPLOADS_DIR, GENERATED_DIR, EXPORTS_DIR
from backend.app.core.ffmpeg_runner import probe_video

def create_sample_preview_video() -> Path:
    sample_path = GENERATED_DIR / "preview_sample.mp4"
    if sample_path.exists() and sample_path.stat().st_size > 1000:
        return sample_path

    cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "lavfi",
        "-i", "testsrc=duration=10:size=1280x720:rate=25",
        "-f", "lavfi",
        "-i", "sine=frequency=440:duration=10",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(sample_path)
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True)
    except Exception as e:
        print(f"Failed to generate synthetic preview: {e}")
    return sample_path

def save_uploaded_file(file_obj, filename: str) -> Path:
    clean_name = f"{uuid.uuid4().hex[:8]}_{Path(filename).name}"
    dest_path = UPLOADS_DIR / clean_name
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file_obj, f)
    return dest_path

def detect_silence(input_path: Path, noise_db: int = -30, min_duration: float = 0.5) -> Dict[str, Any]:
    """
    Detects silent dead-air segments using FFmpeg silencedetect audio filter
    """
    cmd = [
        FFMPEG_PATH,
        "-i", str(input_path),
        "-af", f"silencedetect=noise={noise_db}dB:d={min_duration}",
        "-f", "null",
        "-"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    stderr = res.stderr

    metadata = probe_video(input_path)
    total_duration = metadata.get("duration", 0.0)

    silence_starts = []
    silence_intervals = []

    for line in stderr.splitlines():
        if "silence_start:" in line:
            m = re.search(r"silence_start:\s*(\d+(?:\.\d+)?)", line)
            if m:
                silence_starts.append(float(m.group(1)))
        elif "silence_end:" in line:
            m = re.search(r"silence_end:\s*(\d+(?:\.\d+)?)\s*\|\s*silence_duration:\s*(\d+(?:\.\d+)?)", line)
            if m and silence_starts:
                start = silence_starts.pop(0)
                end = float(m.group(1))
                dur = float(m.group(2))
                silence_intervals.append({
                    "start": round(start, 2),
                    "end": round(end, 2),
                    "duration": round(dur, 2)
                })

    # If an unmatched silence_start exists (silent until end of video)
    if silence_starts and total_duration > silence_starts[0]:
        start = silence_starts[0]
        silence_intervals.append({
            "start": round(start, 2),
            "end": round(total_duration, 2),
            "duration": round(total_duration - start, 2)
        })

    # Calculate speaking (active) intervals
    speaking_intervals = []
    current_time = 0.0
    for s in silence_intervals:
        if s["start"] > current_time + 0.1:
            speaking_intervals.append({
                "start": round(current_time, 2),
                "end": round(s["start"], 2),
                "duration": round(s["start"] - current_time, 2)
            })
        current_time = s["end"]

    if total_duration > current_time + 0.1:
        speaking_intervals.append({
            "start": round(current_time, 2),
            "end": round(total_duration, 2),
            "duration": round(total_duration - current_time, 2)
        })

    total_silence = sum(s["duration"] for s in silence_intervals)

    return {
        "video_duration": total_duration,
        "silence_intervals": silence_intervals,
        "speaking_intervals": speaking_intervals,
        "total_silence_seconds": round(total_silence, 2),
        "silence_count": len(silence_intervals)
    }

def trim_video(input_path: Path, start_time: float, end_time: float, output_path: Path = None) -> Path:
    """
    Trims video between start_time and end_time with sample accuracy
    """
    if output_path is None:
        out_id = uuid.uuid4().hex[:8]
        output_path = EXPORTS_DIR / f"trim_{out_id}.mp4"

    duration = max(0.1, end_time - start_time)

    cmd = [
        FFMPEG_PATH,
        "-y",
        "-ss", str(start_time),
        "-i", str(input_path),
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(output_path)
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return output_path

def merge_videos(clip_paths: List[Path], output_path: Path = None) -> Path:
    """
    Merges multiple video clips into one continuous video
    """
    if not clip_paths:
        raise ValueError("At least one video clip is required to merge.")

    if len(clip_paths) == 1:
        return clip_paths[0]

    if output_path is None:
        out_id = uuid.uuid4().hex[:8]
        output_path = EXPORTS_DIR / f"merged_{out_id}.mp4"

    # Create concat demuxer file
    concat_txt = GENERATED_DIR / f"concat_{uuid.uuid4().hex[:8]}.txt"
    with open(concat_txt, "w", encoding="utf-8") as f:
        for p in clip_paths:
            # Escape path for ffmpeg concat demuxer
            safe_path = str(p.resolve()).replace("\\", "/")
            f.write(f"file '{safe_path}'\n")

    cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_txt),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(output_path)
    ]
    try:
        subprocess.run(cmd, capture_output=True, check=True)
    finally:
        if concat_txt.exists():
            concat_txt.unlink()

    return output_path

def remove_silence_from_video(input_path: Path) -> Tuple[Path, Dict[str, Any]]:
    """
    Detects silence and merges only the active speaking portions together
    """
    data = detect_silence(input_path)
    speaking_intervals = data["speaking_intervals"]

    if not speaking_intervals or len(speaking_intervals) == 0:
        # No speaking detected or no silence found, return original
        return input_path, data

    trimmed_clips = []
    temp_dir = GENERATED_DIR / f"silence_cut_{uuid.uuid4().hex[:8]}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        for i, seg in enumerate(speaking_intervals):
            clip_file = temp_dir / f"seg_{i:03d}.mp4"
            trim_video(input_path, seg["start"], seg["end"], clip_file)
            trimmed_clips.append(clip_file)

        out_id = uuid.uuid4().hex[:8]
        final_output = EXPORTS_DIR / f"silence_removed_{out_id}.mp4"
        merge_videos(trimmed_clips, final_output)
        return final_output, data
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

def convert_aspect_ratio(input_path: Path, aspect_ratio: str, quality: str = "1080p") -> Path:
    out_id = uuid.uuid4().hex[:8]
    out_file = EXPORTS_DIR / f"export_{out_id}_{aspect_ratio.replace(':', '_')}.mp4"

    if aspect_ratio == "9:16":
        vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
    elif aspect_ratio == "1:1":
        vf = "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black"
    else:
        vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"

    cmd = [
        FFMPEG_PATH,
        "-y",
        "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(out_file)
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return out_file
