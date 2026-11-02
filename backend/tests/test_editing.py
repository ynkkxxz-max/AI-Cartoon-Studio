"""Run from the project root: python -m unittest discover -s backend/tests -v."""
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.app.api.editing import router
from backend.app.api import video_editor
from backend.app.services import editing_service as engine
from backend.app.services import video_service


class EditingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        cls.uploads = cls.root / "uploads"
        cls.exports = cls.root / "exports"
        cls.uploads.mkdir()
        cls.exports.mkdir()
        cls.patch_uploads = patch.object(engine, "UPLOADS_DIR", cls.uploads)
        cls.patch_exports = patch.object(engine, "EXPORTS_DIR", cls.exports)
        cls.patch_uploads.start()
        cls.patch_exports.start()
        for module, attr, value in [
            (video_editor, "UPLOADS_DIR", cls.uploads),
            (video_editor, "EXPORTS_DIR", cls.exports),
            (video_service, "UPLOADS_DIR", cls.uploads),
        ]:
            storage_patch = patch.object(module, attr, value)
            storage_patch.start()
            cls.addClassCleanup(storage_patch.stop)
        cls.addClassCleanup(cls.temp.cleanup)
        cls.addClassCleanup(cls.patch_uploads.stop)
        cls.addClassCleanup(cls.patch_exports.stop)
        cls.fixture("tone", "160x90", audio="aevalsrc=if(between(t\\,0.5\\,1.5)+between(t\\,2.5\\,3.5)\\,0.25*sin(2*PI*440*t)\\,0):s=48000:d=4")
        cls.fixture("silent", "120x160", color="blue")
        cls.fixture("mute", "160x90", audio="anullsrc=r=48000:cl=stereo")
        (cls.uploads / "corrupt.mp4").write_bytes(b"not video")
        app = FastAPI()
        # Production order: legacy upload/stream endpoints, then timeline endpoints.
        app.include_router(video_editor.router, prefix="/api")
        app.include_router(router, prefix="/api")
        cls.app = app
        cls.client = TestClient(app)
        cls.addClassCleanup(cls.client.close)

    @classmethod
    def fixture(cls, name, size, color="red", audio=None):
        args = [engine.FFMPEG_PATH, "-hide_banner", "-nostdin", "-y", "-f", "lavfi", "-i", f"color=c={color}:s={size}:r=30:d=4"]
        if audio:
            args.extend(["-f", "lavfi", "-i", audio])
        args.extend(["-t", "4", "-c:v", "libx264", "-threads", "2", "-pix_fmt", "yuv420p", "-c:a", "aac", str(cls.uploads / f"{name}.mp4")])
        result = subprocess.run(args, capture_output=True, timeout=30, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if result.returncode:
            raise RuntimeError(result.stderr.decode(errors="replace"))

    def post(self, endpoint, data):
        return self.client.post("/api/editor/timeline/" + endpoint, json=data)

    def test_silence_at_start_middle_and_end(self):
        result = self.post("silence", {"video_id": "tone", "min_silence": 0.2})
        self.assertEqual(result.status_code, 200, result.text)
        data = result.json()
        self.assertEqual(len(data["silence_segments"]), 3)
        self.assertEqual(len(data["keep_segments"]), 2)
        for segment, expected in zip(data["keep_segments"], [(0.5, 1.5), (2.5, 3.5)]):
            self.assertAlmostEqual(segment["start_time"], expected[0], delta=0.05)
            self.assertAlmostEqual(segment["end_time"], expected[1], delta=0.05)

    def test_all_silent_audio_and_missing_audio_are_distinct(self):
        mute = self.post("silence", {"video_id": "mute"}).json()
        self.assertTrue(mute["has_audio"])
        self.assertEqual(mute["keep_segments"], [])
        silent = self.post("silence", {"video_id": "silent"}).json()
        self.assertFalse(silent["has_audio"])
        self.assertEqual(silent["silence_segments"], [])
        self.assertEqual(silent["keep_segments"], [{"start_time": 0, "end_time": 4}])

    def test_trim_real_duration_and_preserve_source(self):
        source = self.uploads / "tone.mp4"
        before = source.read_bytes()
        result = self.post("trim", {"video_id": "tone", "start_time": 0.5, "end_time": 1.5})
        self.assertEqual(result.status_code, 200, result.text)
        data = result.json()
        self.assertAlmostEqual(data["duration"], 1, delta=0.08)
        self.assertTrue(data["has_audio"])
        self.assertEqual((data["width"], data["height"]), (160, 90))
        self.assertEqual(source.read_bytes(), before)
        # Export IDs can be used as inputs for a subsequent operation.
        again = self.post("trim", {"video_id": data["video_id"], "start_time": 0, "end_time": 0.5})
        self.assertEqual(again.status_code, 200, again.text)

    def test_trim_video_without_audio(self):
        result = self.post("trim", {"video_id": "silent", "start_time": 1, "end_time": 2})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertFalse(result.json()["has_audio"])

    def test_merge_mixed_dimensions_and_missing_audio(self):
        clips = [{"video_id": "tone", "start_time": 0.5, "end_time": 1.5},
                 {"video_id": "silent", "start_time": 0, "end_time": 1}]
        for transition, expected in [(0, 2), (0.25, 1.75)]:
            with self.subTest(transition=transition):
                result = self.post("merge", {"clips": clips, "transition_seconds": transition})
                self.assertEqual(result.status_code, 200, result.text)
                data = result.json()
                self.assertAlmostEqual(data["duration"], expected, delta=0.1)
                self.assertEqual((data["width"], data["height"]), (160, 90))
                self.assertTrue(data["has_audio"])
                # Decode actual frames to verify order, rather than only checking the container.
                output = self.exports / data["filename"]
                for time, channel in [(0.2, 0), (expected - 0.2, 2)]:
                    decoded = subprocess.run([engine.FFMPEG_PATH, "-v", "error", "-ss", str(time), "-i", str(output),
                        "-frames:v", "1", "-vf", "scale=1:1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                        capture_output=True, timeout=30, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
                    self.assertEqual(decoded.returncode, 0)
                    self.assertEqual(len(decoded.stdout), 3)
                    self.assertGreater(decoded.stdout[channel], 100)

    def test_three_clip_crossfade(self):
        result = self.post("merge", {"clips": [
            {"video_id": video_id, "end_time": 1} for video_id in ["tone", "silent", "tone"]]})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertAlmostEqual(result.json()["duration"], 2.5, delta=0.1)

    def test_bad_ids_ranges_corrupt_media_and_transition(self):
        before = set(self.exports.iterdir())
        for data, status in [
            ({"video_id": "../tone", "start_time": 0, "end_time": 1}, 422),
            ({"video_id": "*", "start_time": 0, "end_time": 1}, 404),
            ({"video_id": "absent", "start_time": 0, "end_time": 1}, 404),
            ({"video_id": "tone", "start_time": 2, "end_time": 1}, 422),
            ({"video_id": "tone", "start_time": 0, "end_time": 5}, 422),
            ({"video_id": "corrupt", "start_time": 0, "end_time": 1}, 422),
            ({"video_id": "tone", "start_time": -1, "end_time": 1}, 422),
        ]:
            self.assertEqual(self.post("trim", data).status_code, status, data)
        clips = [{"video_id": "tone", "end_time": 0.2}] * 2
        self.assertEqual(self.post("merge", {"clips": clips}).status_code, 422)
        self.assertEqual(self.post("merge", {"clips": clips[:1]}).status_code, 422)
        self.assertEqual(self.post("silence", {"video_id": "tone", "noise_db": -100}).status_code, 422)
        self.assertEqual(set(self.exports.iterdir()), before)

    def test_encoder_failure_removes_partial_export(self):
        before = set(self.exports.iterdir())
        real_run = engine._run
        def fail_encode(args, timeout=600):
            if "-c:v" in args:
                Path(args[-1]).write_bytes(b"partial")
                return subprocess.CompletedProcess(args, 1, "", "test failure")
            return real_run(args, timeout)
        with patch.object(engine, "_run", side_effect=fail_encode):
            result = self.post("trim", {"video_id": "tone", "start_time": 0, "end_time": 1})
        self.assertEqual(result.status_code, 503)
        self.assertEqual(set(self.exports.iterdir()), before)

    def test_router_paths_are_unique_and_merge_uses_timeline_payload(self):
        pairs = [(method, route.path) for route in self.app.routes for method in (getattr(route, "methods", None) or [])]
        self.assertEqual(len(pairs), len(set(pairs)))
        wrong = self.post("merge", {"video_ids": ["tone", "silent"]})
        self.assertEqual(wrong.status_code, 422)

    def test_upload_metadata_trim_convert_download_chain(self):
        original = (self.uploads / "tone.mp4").read_bytes()
        # Include punctuation and Khmer; the preview URL must encode its filename.
        uploaded = self.client.post('/api/editor/upload', files={
            'file': ('វីដេអូ #1.mp4', original, 'video/mp4')})
        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        video_id = uploaded.json()['video_id']
        from urllib.parse import quote
        media = self.client.get('/api/editor/timeline/media/' + quote(video_id, safe=''))
        self.assertEqual(media.status_code, 200, media.text)
        data = media.json()
        self.assertEqual((data['width'], data['height'], data['has_audio']), (160, 90, True))
        self.assertIn('%23', data['stream_url'])
        preview = self.client.get(data['stream_url'], headers={'Range': 'bytes=0-99'})
        self.assertEqual(preview.status_code, 206)
        self.assertEqual(preview.content, original[:100])
        trimmed = self.post('trim', {'video_id': video_id, 'start_time': 0.2, 'end_time': 0.3})
        self.assertEqual(trimmed.status_code, 200, trimmed.text)
        converted = self.post('convert', {'video_id': trimmed.json()['video_id'], 'aspect_ratio': '1:1'})
        self.assertEqual(converted.status_code, 200, converted.text)
        result = converted.json()
        self.assertEqual((result['width'], result['height']), (1080, 1080))
        self.assertTrue(result['has_audio'])
        downloaded = self.client.get(result['export_url'])
        self.assertEqual(downloaded.status_code, 200)
        self.assertEqual(downloaded.content, (self.exports / result['filename']).read_bytes())
        reused = self.client.get('/api/editor/timeline/media/' + result['video_id'])
        self.assertEqual(reused.status_code, 200)
        self.assertEqual((self.uploads / 'tone.mp4').read_bytes(), original)

    def test_corrupt_upload_is_rejected_by_timeline_metadata(self):
        uploaded = self.client.post('/api/editor/upload', files={'file': ('broken.mp4', b'bad media', 'video/mp4')})
        self.assertEqual(uploaded.status_code, 200)  # Existing legacy upload is permissive.
        media = self.client.get('/api/editor/timeline/media/' + uploaded.json()['video_id'])
        self.assertEqual(media.status_code, 422, media.text)

    def test_conversion_preserves_orientation_and_no_audio(self):
        trimmed = self.post('trim', {'video_id': 'silent', 'start_time': 0, 'end_time': 0.2}).json()
        for aspect, size in [('9:16', (1080, 1920)), ('16:9', (1920, 1080))]:
            converted = self.post('convert', {'video_id': trimmed['video_id'], 'aspect_ratio': aspect})
            self.assertEqual(converted.status_code, 200, converted.text)
            data = converted.json()
            self.assertEqual((data['width'], data['height']), size)
            self.assertFalse(data['has_audio'])
        self.assertEqual(self.post('convert', {'video_id': 'silent', 'aspect_ratio': '4:3'}).status_code, 422)


if __name__ == "__main__":
    unittest.main()
