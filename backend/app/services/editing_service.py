"""Local, synchronous FFmpeg editing. Source files are never modified."""
import math
import re
import subprocess
import uuid
from pathlib import Path

from backend.app.core.config import EXPORTS_DIR, FFMPEG_PATH, UPLOADS_DIR


class EditingError(Exception):
    pass


def _run(args, timeout=600):
    try:
        result = subprocess.run(
            [FFMPEG_PATH, "-hide_banner", "-nostdin", *args],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=timeout, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise EditingError("FFmpeg could not finish the operation") from exc
    return result


def resolve_video(video_id: str) -> Path:
    # Exact stems, rather than user-controlled glob patterns or filesystem paths.
    if not video_id or len(video_id) > 240 or any(c in video_id for c in '/\\:\x00') or video_id in {".", ".."}:
        raise ValueError("Invalid video_id")
    for folder in (UPLOADS_DIR, EXPORTS_DIR):
        for path in folder.iterdir():
            if (path.stem == video_id and path.suffix.lower() in {".mp4", ".mov", ".avi", ".mkv", ".webm"}
                    and path.is_file() and path.resolve().parent == folder.resolve()):
                return path
    raise FileNotFoundError("Source video not found")


def inspect_video(path: Path) -> dict:
    result = _run(["-i", str(path)], timeout=30)
    duration = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    video = next((line for line in result.stderr.splitlines() if "Video:" in line), "")
    dimensions = re.search(r"\b(\d{2,5})x(\d{2,5})\b", video)
    if not duration or not dimensions:
        raise ValueError("Source must contain a readable video stream and duration")
    seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
    if not math.isfinite(seconds) or seconds <= 0:
        raise ValueError("Source has an invalid duration")
    return {"duration": seconds, "width": int(dimensions[1]), "height": int(dimensions[2]),
            "has_audio": any("Audio:" in line for line in result.stderr.splitlines())}


def _segment(start, end):
    return {"start_time": round(start, 6), "end_time": round(end, 6)}


def detect_silence(path: Path, noise_db=-30.0, min_silence=0.5) -> dict:
    info = inspect_video(path)
    duration = info["duration"]
    silences = []
    if info["has_audio"]:
        result = _run(["-i", str(path), "-map", "0:a:0", "-af",
                       f"silencedetect=noise={noise_db}dB:d={min_silence}", "-vn", "-f", "null", "-"])
        if result.returncode:
            raise EditingError("FFmpeg could not analyze this audio stream")
        start = None
        for event in re.finditer(r"silence_(start|end):\s*(-?\d+(?:\.\d+)?)", result.stderr):
            value = min(duration, max(0.0, float(event[2])))
            if event[1] == "start":
                start = value
            elif start is not None:
                if value > start:
                    silences.append(_segment(start, value))
                start = None
        if start is not None and duration > start:
            silences.append(_segment(start, duration))
    keep = []
    cursor = 0.0
    for silence in silences:
        if silence["start_time"] > cursor:
            keep.append(_segment(cursor, silence["start_time"]))
        cursor = silence["end_time"]
    if cursor < duration:
        keep.append(_segment(cursor, duration))
    return {**info, "noise_db": noise_db, "min_silence": min_silence,
            "silence_segments": silences, "keep_segments": keep,
            "analysis": "audio_amplitude" if info["has_audio"] else "no_audio_stream"}


def _range(info, start, end):
    end = info["duration"] if end is None else end
    if not (math.isfinite(start) and math.isfinite(end) and 0 <= start < end <= info["duration"]):
        raise ValueError("Clip range must satisfy 0 <= start_time < end_time <= source duration")
    if end - start < 0.1 - 1e-9:
        raise ValueError("Each clip must be at least 0.1 seconds long")
    return start, end


def _export(args, operation):
    output = EXPORTS_DIR / f"{operation}_{uuid.uuid4().hex}.mp4"
    try:
        result = _run(["-y", *args, "-c:v", "libx264", "-threads", "2", "-preset", "veryfast",
                       "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
                       "-movflags", "+faststart", str(output)])
        if result.returncode or not output.exists():
            raise EditingError("FFmpeg could not encode the requested clips")
        info = inspect_video(output)
        return {"status": "completed", "video_id": output.stem, "filename": output.name,
                "export_url": f"/api/editor/export-download/{output.name}",
                "stream_url": f"/api/editor/stream/{output.name}", **info}
    except Exception:
        output.unlink(missing_ok=True)
        raise


def trim_video(path: Path, start_time: float, end_time: float) -> dict:
    start, end = _range(inspect_video(path), start_time, end_time)
    return _export(["-i", str(path), "-ss", str(start), "-t", str(end - start),
                    "-map", "0:v:0", "-map", "0:a:0?", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1"], "trim")


def convert_video(path: Path, aspect_ratio: str) -> dict:
    inspect_video(path)
    sizes = {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080)}
    if aspect_ratio not in sizes:
        raise ValueError("Unsupported aspect ratio")
    width, height = sizes[aspect_ratio]
    vf = (f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
          f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1")
    return _export(["-i", str(path), "-map", "0:v:0", "-map", "0:a:0?", "-vf", vf], "convert")


def merge_videos(clips: list[dict], transition_seconds=0.25) -> dict:
    sources = []
    for clip in clips:
        path = resolve_video(clip["video_id"])
        info = inspect_video(path)
        start, end = _range(info, clip.get("start_time", 0), clip.get("end_time"))
        sources.append((path, info, start, end))
    if sum(end - start for _, _, start, end in sources) > 1800:
        raise ValueError("A merge may contain at most 30 minutes of source footage")
    if transition_seconds and any(end - start <= 2 * transition_seconds for _, _, start, end in sources):
        raise ValueError("Each clip must be longer than twice transition_seconds")
    first = sources[0][1]
    max_width, max_height = (1920, 1080) if first["width"] >= first["height"] else (1080, 1920)
    factor = min(1.0, max_width / first["width"], max_height / first["height"])
    width = max(2, int(first["width"] * factor) // 2 * 2)
    height = max(2, int(first["height"] * factor) // 2 * 2)
    inputs, filters = [], []
    durations = []
    for i, (path, info, start, end) in enumerate(sources):
        inputs.extend(["-i", str(path)])
        length = end - start
        durations.append(length)
        filters.append(f"[{i}:v:0]trim=start={start}:end={end},setpts=PTS-STARTPTS,"
                       f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
                       f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,"
                       f"format=yuv420p,settb=AVTB[v{i}]")
        if info["has_audio"]:
            filters.append(f"[{i}:a:0]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,"
                           f"aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
                           f"apad,atrim=duration={length}[a{i}]")
        else:
            filters.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={length},asetpts=PTS-STARTPTS[a{i}]")
    if not transition_seconds:
        labels = "".join(f"[v{i}][a{i}]" for i in range(len(sources)))
        filters.append(f"{labels}concat=n={len(sources)}:v=1:a=1[outv][outa]")
    else:
        video, audio, elapsed = "v0", "a0", durations[0]
        for i in range(1, len(sources)):
            filters.append(f"[{video}][v{i}]xfade=transition=fade:duration={transition_seconds}:"
                           f"offset={elapsed - transition_seconds}[xv{i}]")
            filters.append(f"[{audio}][a{i}]acrossfade=d={transition_seconds}:c1=tri:c2=tri[xa{i}]")
            video, audio = f"xv{i}", f"xa{i}"
            elapsed += durations[i] - transition_seconds
        filters.extend([f"[{video}]null[outv]", f"[{audio}]anull[outa]"])
    return _export([*inputs, "-filter_complex_threads", "1", "-filter_complex", ";".join(filters),
                    "-map", "[outv]", "-map", "[outa]"], "merge")
