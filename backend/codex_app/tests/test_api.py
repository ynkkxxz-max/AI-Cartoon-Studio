import os
import tempfile
import unittest
import sys
import subprocess
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

# Keep importing the module from creating a database in the source checkout.
os.environ.setdefault('AI_STUDIO_DATA_DIR', str(Path(tempfile.gettempdir()) / 'ai-studio-import-test'))
from codex_app.main import create_app, discover_ffmpeg


class StudioTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.client = TestClient(create_app(self.root, upload_limit=128))

    def tearDown(self):
        self.client.close()
        self.temp.cleanup()

    def project(self, name='Khmer story'):
        response = self.client.post('/api/projects', json={'name': name})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_persistence_versions_and_restore(self):
        p = self.project()
        path = '/api/projects/' + p['id']
        changed = self.client.patch(path, json={'name': 'Edited', 'languages': ['km']}).json()
        self.assertEqual(changed['version'], 2)
        second_client = TestClient(create_app(self.root))
        self.assertEqual(second_client.get(path).json()['name'], 'Edited')
        second_client.close()
        restored = self.client.post(path + '/versions/1/restore').json()
        self.assertEqual((restored['name'], restored['version']), ('Khmer story', 3))
        versions = self.client.get(path + '/versions').json()['items']
        self.assertEqual([v['version'] for v in versions], [3, 2, 1])
        self.assertEqual(versions[1]['snapshot']['name'], 'Edited')

    def test_rejects_invalid_fields_and_foreign_browser_origin(self):
        self.assertEqual(self.client.post('/api/projects', json={'name': '   '}).status_code, 422)
        self.assertEqual(self.client.post('/api/projects', json={'name': 'x', 'languages': ['fr']}).status_code, 422)
        self.assertEqual(self.client.get('/api/projects', headers={'Origin': 'https://evil.invalid'}).status_code, 403)
        p = self.project()
        self.assertEqual(self.client.patch('/api/projects/' + p['id'], json={'name': None}).status_code, 422)

    def test_upload_validation_scoping_and_filename_safety(self):
        p = self.project()
        q = self.project('Other')
        path = '/api/projects/' + p['id'] + '/media'
        sample = b'\x00\x00\x00\x18ftypisom' + b'\x00' * 20
        with patch('codex_app.main.shutil.which', return_value=None), patch('codex_app.main.discover_ffmpeg', return_value=None):
            response = self.client.post(path, files={'file': ('../../outside.mp4', sample, 'video/mp4')})
        self.assertEqual(response.status_code, 201, response.text)
        media = response.json()
        self.assertEqual(media['original_name'], 'outside.mp4')
        self.assertEqual(media['status'], 'container_validated_metadata_unavailable')
        self.assertIsNone(media['metadata'])
        self.assertEqual(self.client.get(media['url']).content, sample)
        other_url = '/api/projects/' + q['id'] + '/media/' + media['id'] + '/content'
        self.assertEqual(self.client.get(other_url).status_code, 404)
        self.assertFalse((self.root / 'outside.mp4').exists())
        self.assertEqual(self.client.post(path, files={'file': ('bad.mp4', b'not a video')}).status_code, 415)
        self.assertEqual(self.client.post(path, files={'file': ('bad.exe', sample)}).status_code, 415)
        self.assertEqual(self.client.post(path, files={'file': ('large.mp4', sample + b'x' * 128)}).status_code, 413)
        self.assertEqual(len(list((self.root / 'uploads' / p['id']).iterdir())), 1)
        self.assertEqual(self.client.post('/api/projects/missing/media', files={'file': ('a.mp4', sample)}).status_code, 404)

    def test_archival_keeps_files_and_hides_project(self):
        p = self.project()
        folder = self.root / 'uploads' / p['id']
        folder.mkdir()
        (folder / 'private.dat').write_bytes(b'keep')
        path = '/api/projects/' + p['id']
        self.assertTrue(self.client.delete(path).json()['files_preserved'])
        self.assertEqual(self.client.get(path).status_code, 404)
        self.assertEqual(self.client.get('/api/projects').json(), [])
        self.assertTrue((folder / 'private.dat').exists())

    def test_oversized_request_rejected_before_multipart_parser(self):
        p = self.project()
        response = self.client.post('/api/projects/' + p['id'] + '/media', content=b'x', headers={'Content-Length': '99999999', 'Content-Type': 'multipart/form-data; boundary=test'})
        self.assertEqual(response.status_code, 413)
        self.assertFalse((self.root / 'uploads' / p['id']).exists())

    def test_character_profiles_and_unavailable_jobs(self):
        response = self.client.post('/api/characters', json={'name': 'Dara', 'kind': 'child', 'voice_profile': {'language': 'km'}})
        self.assertEqual(response.status_code, 201)
        cid = response.json()['id']
        self.assertEqual(self.client.get('/api/characters').json()[0]['voice_profile']['language'], 'km')
        updated = self.client.patch('/api/characters/' + cid, json={'name': 'Dara II', 'kind': 'child'}).json()
        self.assertEqual(updated['name'], 'Dara II')
        p = self.project()
        response = self.client.post('/api/projects/' + p['id'] + '/jobs', json={'kind': 'cartoon'})
        self.assertEqual(response.status_code, 503)
        self.assertIn('No job was started', response.json()['detail'])
        self.assertEqual(self.client.get('/api/projects/' + p['id'] + '/jobs').json(), {'items': []})
        self.assertFalse(self.client.get('/api/health').json()['capabilities']['video_generation'])
        self.assertEqual(self.client.get('/api/dashboard').json()['project_count'], 1)
        self.assertEqual(self.client.delete('/api/characters/' + cid).status_code, 200)
        self.assertEqual(self.client.get('/api/characters').json(), [])

    def test_antigravity_contract_and_local_origin(self):
        response = self.client.post('/api/projects', json={'name': 'Adventure', 'type': 'cartoon', 'duration_preset': '5-20 minutes', 'selected_characters': ['char_boy_01'], 'style': '3D Cartoon (Pixar-like)'}, headers={'Origin': 'http://localhost:5173'})
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()['selected_characters'], ['char_boy_01'])
        self.assertEqual(response.json()['duration_preset'], '5-20 minutes')
        self.assertIsInstance(self.client.get('/api/projects').json(), list)
        status = self.client.get('/api/system/status').json()
        self.assertGreater(status['storage_total_bytes'], 0)
        self.assertTrue(0 <= status['storage_pct'] <= 100)
        self.assertEqual(self.client.get('/api/voices/catalog').json(), [])
        self.assertEqual(self.client.post('/api/voices/preview', json={'text': 'hello'}).status_code, 503)
        self.assertEqual(self.client.post('/api/editor/process', json={'video_id': 'x'}).status_code, 503)
        self.assertEqual(self.client.get('/api/projects', headers={'Host': 'evil.invalid'}).status_code, 403)
        character = self.client.post('/api/characters', json={'name_en': 'Maya', 'name_kh': 'ម៉ាយ៉ា', 'category': 'child_girl', 'avatar_url': '/assets/maya.jpg'}).json()
        self.assertEqual(character['name'], 'Maya')

    def test_real_ffmpeg_upload_metadata_and_preview(self):
        binary = discover_ffmpeg()
        if not binary:
            self.skipTest('FFmpeg not installed')
        fixture = self.root / 'fixture.mp4'
        subprocess.run([binary, '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=160x90:r=10', '-t', '0.3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(fixture)], capture_output=True, check=True, timeout=30, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        with TestClient(create_app(self.root, upload_limit=1024 * 1024)) as client:
            response = client.post('/api/editor/upload', files={'file': ('camera.mp4', fixture.read_bytes(), 'video/mp4')})
            self.assertEqual(response.status_code, 200, response.text)
            media = response.json()
            self.assertEqual((media['width'], media['height'], media['fps']), (160, 90, 10.0))
            self.assertTrue(0 < media['duration_seconds'] < 1)
            self.assertEqual(media['metadata_source'], 'ffmpeg-stderr' if not __import__('shutil').which('ffprobe') else 'ffprobe')
            preview = client.get(media['preview_url'])
            self.assertEqual(preview.content, fixture.read_bytes())
            project = client.get('/api/projects/' + media['project_id']).json()
            self.assertEqual(project['type'], 'video_editor')
            bad = client.post('/api/editor/upload', files={'file': ('bad.mp4', b'bad')})
            self.assertEqual(bad.status_code, 415)
            self.assertEqual(len(client.get('/api/projects').json()), 1)


if __name__ == '__main__':
    unittest.main()
