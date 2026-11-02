import unittest
import subprocess
from pathlib import Path
from backend.app.core.config import FFMPEG_PATH, GENERATED_DIR, EXPORTS_DIR
from backend.app.services.video_service import (
    detect_silence,
    trim_video,
    merge_videos,
    convert_aspect_ratio,
    remove_silence_from_video
)
from backend.app.core.ffmpeg_runner import probe_video

class TestPhase2VideoEditing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Generate a 6-second video with 2s sound, 2s silence, 2s sound
        cls.test_video = GENERATED_DIR / "test_silence_probe.mp4"
        cmd = [
            FFMPEG_PATH,
            "-y",
            "-f", "lavfi",
            "-i", "testsrc=duration=6:size=640x360:rate=25",
            "-f", "lavfi",
            # Audio: 2s 440Hz tone, 2s silence, 2s 440Hz tone
            "-i", "aevalsrc=sin(2*PI*440*t)*between(t\\,0\\,2)+sin(2*PI*440*t)*between(t\\,4\\,6):s=44100:d=6",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            str(cls.test_video)
        ]
        subprocess.run(cmd, capture_output=True, check=True)

    def test_01_probe_metadata(self):
        meta = probe_video(self.test_video)
        self.assertAlmostEqual(meta["duration"], 6.0, delta=0.5)
        self.assertEqual(meta["width"], 640)
        self.assertEqual(meta["height"], 360)
        self.assertEqual(meta["aspect_ratio"], "16:9")

    def test_02_silence_detection(self):
        data = detect_silence(self.test_video, noise_db=-30, min_duration=0.5)
        self.assertIn("silence_intervals", data)
        self.assertIn("speaking_intervals", data)
        # Should detect silence around 2.0 to 4.0s
        self.assertGreaterEqual(len(data["silence_intervals"]), 1)
        self.assertGreaterEqual(len(data["speaking_intervals"]), 1)

    def test_03_trim_video(self):
        out_trim = EXPORTS_DIR / "unit_test_trim.mp4"
        trim_video(self.test_video, start_time=1.0, end_time=3.5, output_path=out_trim)
        self.assertTrue(out_trim.exists())
        meta = probe_video(out_trim)
        self.assertAlmostEqual(meta["duration"], 2.5, delta=0.5)

    def test_04_merge_videos(self):
        # Trim two small clips and merge them
        clip1 = EXPORTS_DIR / "unit_clip1.mp4"
        clip2 = EXPORTS_DIR / "unit_clip2.mp4"
        trim_video(self.test_video, 0.0, 1.5, clip1)
        trim_video(self.test_video, 4.0, 5.5, clip2)

        merged = EXPORTS_DIR / "unit_merged.mp4"
        merge_videos([clip1, clip2], merged)
        self.assertTrue(merged.exists())
        meta = probe_video(merged)
        self.assertAlmostEqual(meta["duration"], 3.0, delta=0.5)

    def test_05_aspect_ratio_9_16(self):
        exported_tiktok = convert_aspect_ratio(self.test_video, aspect_ratio="9:16")
        self.assertTrue(exported_tiktok.exists())
        meta = probe_video(exported_tiktok)
        self.assertEqual(meta["width"], 1080)
        self.assertEqual(meta["height"], 1920)
        self.assertEqual(meta["aspect_ratio"], "9:16")

if __name__ == "__main__":
    unittest.main()
