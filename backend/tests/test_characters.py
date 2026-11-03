import json
from contextlib import closing
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.app.core import database
from backend.app.api.characters import router


class CharacterDeletionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'studio.db'
        self.db_patch = patch.object(database, 'DB_PATH', self.path)
        self.db_patch.start()
        self.addCleanup(self.db_patch.stop)
        database.init_db()
        app = FastAPI()
        app.include_router(router, prefix='/api')
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def test_delete_preserves_project_history_and_restore_retains_profile(self):
        original = self.client.get('/api/characters').json()[0]
        cid = original['id']
        with closing(sqlite3.connect(self.path)) as conn, conn:
            conn.execute('INSERT INTO projects (id,name,created_at,updated_at,selected_characters) VALUES (?,?,?,?,?)',
                         ('existing', 'Saved story', '2026-11-02', '2026-11-02', json.dumps([cid])))
        removed = self.client.delete('/api/characters/' + cid)
        self.assertEqual(removed.status_code, 200)
        self.assertTrue(removed.json()['restorable'])
        self.assertNotIn(cid, [item['id'] for item in self.client.get('/api/characters').json()])
        database.init_db()  # Restart must preserve deletion.
        self.assertNotIn(cid, [item['id'] for item in self.client.get('/api/characters').json()])
        with closing(sqlite3.connect(self.path)) as conn, conn:
            self.assertIsNotNone(conn.execute('SELECT deleted_at FROM characters WHERE id=?', (cid,)).fetchone()[0])
            self.assertEqual(json.loads(conn.execute('SELECT selected_characters FROM projects WHERE id=?', ('existing',)).fetchone()[0]), [cid])
        restored = self.client.post('/api/characters/' + cid + '/restore')
        self.assertEqual(restored.status_code, 200)
        for key in ['id', 'name_kh', 'name_en', 'avatar_url', 'default_voice', 'description', 'created_at']:
            self.assertEqual(restored.json()[key], original[key])
        self.assertIn(cid, [item['id'] for item in self.client.get('/api/characters').json()])

    def test_deleted_entire_library_stays_empty_after_restart(self):
        for character in self.client.get('/api/characters').json():
            self.assertEqual(self.client.delete('/api/characters/' + character['id']).status_code, 200)
        database.init_db()
        self.assertEqual(self.client.get('/api/characters').json(), [])

    def test_missing_and_duplicate_actions_do_not_touch_other_characters(self):
        original = self.client.get('/api/characters').json()
        self.assertEqual(self.client.delete('/api/characters/missing').status_code, 404)
        self.assertEqual(self.client.post('/api/characters/missing/restore').status_code, 404)
        cid = original[0]['id']
        self.assertEqual(self.client.post('/api/characters/' + cid + '/restore').status_code, 404)
        self.client.delete('/api/characters/' + cid)
        self.assertEqual(self.client.delete('/api/characters/' + cid).status_code, 404)
        self.assertEqual(len(self.client.get('/api/characters').json()), len(original) - 1)

    def test_migrates_existing_schema_without_losing_existing_characters(self):
        old_path = Path(self.temp.name) / 'old.db'
        with closing(sqlite3.connect(old_path)) as conn, conn:
            conn.execute('CREATE TABLE characters (id TEXT PRIMARY KEY,name_kh TEXT NOT NULL,name_en TEXT NOT NULL,category TEXT NOT NULL,avatar_url TEXT,default_voice TEXT,description TEXT,created_at TEXT NOT NULL)')
            conn.execute('INSERT INTO characters VALUES (?,?,?,?,?,?,?,?)', ('saved', 'តួអង្គ', 'Saved', 'child', '/saved.png', 'voice', 'Keep me', '2026-11-01'))
        with patch.object(database, 'DB_PATH', old_path):
            database.init_db()
            database.init_db()
            saved = self.client.get('/api/characters').json()
            self.assertEqual(len(saved), 1)
            self.assertEqual(saved[0]['id'], 'saved')
            self.assertEqual(saved[0]['description'], 'Keep me')
            self.assertEqual(self.client.delete('/api/characters/saved').status_code, 200)


if __name__ == '__main__':
    unittest.main()
