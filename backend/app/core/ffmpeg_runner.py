import subprocess
import json
import os
from pathlib import Path
from backend.app.core.config import FFMPEG_PATH

def get_ffmpeg_version():
    try:
        res = subprocess.run([FFMPEG_PATH, "-version"], capture_output=True, text=True, check=True)
        first_line = res.stdout.splitlines()[0] if res.stdout else "FFmpeg available"
        return first_line
    except Exception as e:
        return f"Unavailable: {str(e)}"

def probe_video(file_path: Path):
    """
    Extracts video metadata using ffmpeg -i
    """
    try:
        # Run ffmpeg -i to get stream info from stderr
        cmd = [FFMPEG_PATH, "-i", str(file_path)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        stderr = res.stderr

        duration_sec = 0.0
        width = 1920
        height = 1080
        fps = 30.0

        for line in stderr.splitlines():
            line_clean = line.strip()
            if "Duration:" in line_clean:
                # e.g. Duration: 00:00:30.50, start: 0.000000, bitrate: 1200 kb/s
                parts = line_clean.split("Duration:")[1].split(",")[0].strip()
                h, m, s = parts.split(":")
                duration_sec = float(h)*3600 + float(m)*60 + float(s)
            if "Video:" in line_clean:
                # Find resolution e.g. 1920x1080
                import re
                match = re.search(r"(\d{3,4})x(\d{3,4})", line_clean)
                if match:
                    width = int(match.group(1))
                    height = int(match.group(2))
                fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", line_clean)
                if fps_match:
                    fps = float(fps_match.group(1))

        aspect_ratio = "16:9"
        if width > 0 and height > 0:
            ratio = width / height
            if abs(ratio - 16/9) < 0.15:
                aspect_ratio = "16:9"
            elif abs(ratio - 9/16) < 0.15:
                aspect_ratio = "9:16"
            elif abs(ratio - 1.0) < 0.15:
                aspect_ratio = "1:1"

        return {
            "duration": round(duration_sec, 2),
            "width": width,
            "height": height,
            "fps": fps,
            "aspect_ratio": aspect_ratio,
            "format": file_path.suffix.lstrip(".").lower()
        }
    except Exception as e:
        return {
            "duration": 0.0,
            "width": 1920,
            "height": 1080,
            "fps": 30.0,
            "aspect_ratio": "16:9",
            "format": file_path.suffix.lstrip(".").lower(),
            "error": str(e)
        }
