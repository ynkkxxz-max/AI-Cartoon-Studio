"""
Unit & Integration Tests for AI Story Engine (Phase 3)
"""
import unittest
import json
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import get_db_connection

class TestStoryEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_generate_story_script_persisted(self):
        """Test generating a structured screenplay and verifying SQLite persistence"""
        payload = {
            "prompt": "The Sacred Temple of Angkor and the Flying Griffin",
            "genre": "Fantasy Adventure",
            "target_duration": "5-20 minutes",
            "characters": ["char_boy", "char_girl"],
            "languages": ["km", "en", "zh"]
        }
        res = self.client.post("/api/stories/generate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("id", data)
        self.assertIn("project_id", data)
        self.assertEqual(data["scene_count"], 4)
        self.assertEqual(len(data["scenes"]), 4)

        # Check Scene 1 structured fields
        scene1 = data["scenes"][0]
        self.assertEqual(scene1["scene_number"], 1)
        self.assertIn("camera_shot", scene1)
        self.assertIn("visual_prompt", scene1)
        self.assertIn("dialogue", scene1)
        self.assertTrue(len(scene1["dialogue"]["km"]) > 0)
        self.assertTrue(len(scene1["dialogue"]["en"]) > 0)
        self.assertTrue(len(scene1["dialogue"]["zh"]) > 0)

        # Verify database record in story_scripts table
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM story_scripts WHERE id = ?", (data["id"],))
        row = cursor.fetchone()
        conn.close()

        self.assertIsNotNone(row)
        self.assertEqual(row["project_id"], data["project_id"])
        self.assertEqual(row["version"], 1)

    def test_get_story_script(self):
        """Test retrieving the active story script for a project"""
        # First generate
        payload = {
            "prompt": "Legend of the Water Dragon",
            "genre": "Fantasy",
            "target_duration": "5-20 minutes"
        }
        gen_res = self.client.post("/api/stories/generate", json=payload)
        self.assertEqual(gen_res.status_code, 200)
        proj_id = gen_res.json()["project_id"]

        # Then fetch
        get_res = self.client.get(f"/api/stories/{proj_id}")
        self.assertEqual(get_res.status_code, 200)
        script_data = get_res.json()
        self.assertEqual(script_data["project_id"], proj_id)
        self.assertEqual(len(script_data["scenes"]), 4)

    def test_update_scene_creates_new_version(self):
        """Test updating a scene's camera shot and dialogue, creating version 2"""
        gen_res = self.client.post("/api/stories/generate", json={
            "prompt": "Expedition to Mount Meru",
            "genre": "Adventure"
        })
        proj_id = gen_res.json()["project_id"]

        # Update Scene 1
        update_payload = {
            "camera_shot": "Drone Shot swooping down from clouds",
            "dialogue": {
                "km": "ប្លង់ទី ១ (កែសម្រួល): ពួកយើងបានទៅដល់កំពូលភ្នំព្រះសុមេរុហើយ!",
                "en": "Scene 1 (Edited): We have reached the legendary summit of Mount Meru!",
                "zh": "第 1 幕 (修改): 我们终于登上了须弥山的顶峰！"
            }
        }
        update_res = self.client.put(f"/api/stories/{proj_id}/scenes/1", json=update_payload)
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.json()

        # Version must increment
        self.assertEqual(updated_data["version"], 2)
        scene1 = updated_data["scenes"][0]
        self.assertEqual(scene1["camera_shot"], "Drone Shot swooping down from clouds")
        self.assertIn("កំពូលភ្នំព្រះសុមេរុ", scene1["dialogue"]["km"])

        # Check that both versions exist in database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM story_scripts WHERE project_id = ?", (proj_id,))
        count = cursor.fetchone()["count"]
        conn.close()
        self.assertEqual(count, 2)

    def test_genre_contextual_expansion(self):
        """Test that comedy prompt generates comedic situation scenes"""
        res = self.client.post("/api/stories/generate", json={
            "prompt": "Funny Monkey Baking a Giant Messy Cake",
            "genre": "Comedy"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["genre"], "Comedy")
        self.assertIn("Bakery", data["scenes"][0]["location"])

if __name__ == "__main__":
    unittest.main()
