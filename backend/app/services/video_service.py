import os
import subprocess
import uuid
import shutil
from pathlib import Path
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
