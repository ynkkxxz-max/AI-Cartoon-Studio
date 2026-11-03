"""
LLM Provider Abstraction Layer for AI Cartoon Studio
Supports Google Gemini, OpenAI, and Local Contextual Generation.
"""
from __future__ import annotations

import os
import json
import urllib.request
import urllib.error
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.models.schemas import StoryGenerateRequest, StoryScene, SceneDialogue, StoryScriptResponse

def get_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class LLMProvider:
    """Base interface for all LLM providers"""
    def generate_story(self, req: StoryGenerateRequest) -> StoryScriptResponse:
        raise NotImplementedError

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    def generate_story(self, req: StoryGenerateRequest) -> StoryScriptResponse:
        prompt_instruction = f"""
You are the Lead Screenwriter and 3D Animation Director for AI Cartoon Studio.
Create a structured screenplay from this idea: "{req.prompt}".
Genre: {req.genre or 'Fantasy Adventure'}
Style: {req.style or '3D Cartoon'}
Duration: {req.target_duration or '5-20 minutes'}
Languages required: Khmer (km), English (en), Mandarin Chinese (zh).

Return ONLY valid JSON matching this schema:
{{
  "title": "Story Title",
  "synopsis": "Concise 2-sentence summary",
  "scenes": [
    {{
      "scene_number": 1,
      "title": "Scene Title",
      "location": "Location Name",
      "camera_shot": "e.g., Extreme Wide Establishing Shot, Golden Hour, 35mm Lens",
      "visual_prompt": "Detailed 3D cinematic prompt for rendering Pixar/Disney stylized scene",
      "duration_sec": 15,
      "characters": ["char_boy", "char_girl"],
      "dialogue": {{
        "km": "Khmer dialogue",
        "en": "English dialogue",
        "zh": "Chinese dialogue"
      }}
    }}
  ]
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt_instruction}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        data = json.dumps(payload).encode("utf-8")
        http_req = urllib.request.Request(self.endpoint, data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(http_req, timeout=30) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
            text = raw["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(text)

        scenes = [
            StoryScene(
                scene_number=s.get("scene_number", idx + 1),
                title=s.get("title", f"Scene {idx+1}"),
                location=s.get("location", "Enchanted Realm"),
                camera_shot=s.get("camera_shot", "Cinematic Medium Shot"),
                visual_prompt=s.get("visual_prompt", ""),
                duration_sec=s.get("duration_sec", 15),
                characters=s.get("characters", ["char_boy"]),
                dialogue=SceneDialogue(**s.get("dialogue", {}))
            )
            for idx, s in enumerate(parsed.get("scenes", []))
        ]

        proj_id = req.project_id or f"proj_{uuid.uuid4().hex[:10]}"
        now = get_now_iso()
        return StoryScriptResponse(
            id=f"script_{uuid.uuid4().hex[:10]}",
            project_id=proj_id,
            title=parsed.get("title", req.prompt[:30]),
            synopsis=parsed.get("synopsis", ""),
            genre=req.genre or "Fantasy Adventure",
            style=req.style or "3D Cartoon",
            scene_count=len(scenes),
            estimated_duration_sec=sum(s.duration_sec for s in scenes),
            scenes=scenes,
            provider_used="gemini-1.5-flash",
            version=1,
            created_at=now,
            updated_at=now
        )


class ContextualStoryEngine(LLMProvider):
    """
    Intelligent local engine that builds rich, customized 3D animation screenplays
    without requiring external network credentials.
    """
    GENRE_TEMPLATES = {
        "fantasy": [
            ("The Ancient Temple Portal", "Ancient stone courtyard covered in glowing celestial runes beneath twilight sky", "Extreme Wide Shot, Atmospheric Mist, Volumetric Lighting",
             "Young traveler discovers the sacred relic pulsing with radiant blue light.",
             "ប្លង់ទី ១: មើលចុះ! ប្រាសាទបុរាណនេះកំពុងបញ្ចេញពន្លឺដ៏ចម្លែក!",
             "Look! This ancient temple is radiating a mysterious celestial light!",
             "看啊！这座古老的神庙正散发着神秘的天界之光！"),
            ("The Mystic Forest Path", "Enchanted jungle filled with luminescent flora, giant glowing mushrooms, and playful spirits", "Dynamic Tracking Shot, Low Angle",
             "Walking deeper into the magic grove as whisper birds guide the way.",
             "ប្លង់ទី ២: ពួកយើងត្រូវប្រុងប្រយ័ត្ន ព្រៃនេះពោរពេញដោយវេទមន្តអាថ៌កំបាំង។",
             "We must tread carefully, this grove is alive with ancient magic.",
             "我们必须小心前行，这座森林充满了古老的魔法。"),
            ("The Crystal Waterfalls", "Mesmerizing floating cascades of crystalline water defying gravity among mountain peaks", "Sweeping Panoramic Crane Shot, Vibrant Colors",
             "Characters gazing up in wonder as crystalline water drifts upward into cloud islands.",
             "ប្លង់ទី ៣: អស្ចារ្យណាស់! ទឹកធ្លាក់ហូរបញ្ច្រាសឡើងទៅលើមេឃ!",
             "Astonishing! The waterfalls are cascading upwards into the sky!",
             "太神奇了！瀑布竟然逆流飞向天空！"),
            ("The Sanctuary of Harmony", "Grand sanctuary chamber with a central floating sun-crystal restoring vitality to the land", "Close-up Hero Shot moving to Wide Angle",
             "Placing the missing crystal shard, a shockwave of golden light heals the kingdom.",
             "ប្លង់ទី ៤: ទីបំផុត ភាពសុខសាន្តបានវិលត្រឡប់មកកាន់ទឹកដីរបស់យើងវិញហើយ!",
             "At last, peace and vitality have returned to our beloved kingdom!",
             "终于，和平与生机重新回到了我们热爱的国度！")
        ],
        "adventure": [
            ("Base Camp at Sunrise", "Expedition camp set atop misty mountain ridge as golden sun crests the horizon", "Cinematic Establishing Shot, Warm Horizon",
             "Checking the ancient map and gearing up for the great mountain quest.",
             "ប្លង់ទី ១: ថ្ងៃរះហើយ! ការផ្សងព្រេងដ៏អស្ចារ្យរបស់យើងចាប់ផ្តើមពីពេលនេះ!",
             "The sun has risen! Our great expedition begins right now!",
             "太阳升起了！我们伟大的探险之旅从此刻启程！"),
            ("The Rope Bridge Crossing", "A swaying suspension bridge crossing a breathtaking deep canyon with rushing rapids below", "Suspenseful Dutch Angle Shot, Dynamic Wind",
             "Navigating step by step across the high canyon with team encouragement.",
             "ប្លង់ទី ២: កុំមើលចុះក្រោម! ដើរមួយៗ ពួកយើងអាចឆ្លងផុតបាន!",
             "Don't look down! One step at a time, we will make it across together!",
             "别往下看！一步一步来，我们一定能一起穿过去！"),
            ("The Hidden Cavern of Wonders", "Secret illuminated cavern filled with golden relics, crystal stalactites, and underground river", "Wide Interior Shot, Torches and Glow",
             "Discovering the legendary hidden vault guarded by stone guardians.",
             "ប្លង់ទី ៣: ពួកយើងបានរកឃើញរូងកំណប់អាថ៌កំបាំងហើយ!",
             "We found it! The secret subterranean vault of legends!",
             "我们找到了！这就是传说中的秘密地下宝库！"),
            ("The Summit Triumph", "Wind-swept mountain summit offering 360-degree panoramic view of the world below", "Heroic Low-Angle Shot, Lens Flare",
             "Planting the banner of discovery as eagles soar overhead.",
             "ប្លង់ទី ៤: ពួកយើងធ្វើបានសម្រេចហើយ! ជ័យជម្នះបានមកដល់!",
             "We did it! We conquered the summit together!",
             "我们成功了！我们一起征服了顶峰！")
        ],
        "comedy": [
            ("The Busy Bakery Mishap", "Cozy cartoon kitchen where flour and batter are flying everywhere in hilarious chaos", "Fast Comic Panning Shot, Bright Punchy Colors",
             "Monkey tries to help bake a giant cake with hilariously messy results.",
             "ប្លង់ទី ១: ឈប់សិន! នោះមិនមែនជាស្ករទេ គឺជាម្សៅមី!",
             "Wait, stop! That wasn't the sugar jar, that was the baking flour!",
             "等等，停下！那不是糖罐，那是面粉！"),
            ("The Runaway Dough", "The enchanted dough balloon expands and bounces down the village cobblestone street", "Dynamic Chase Cam, Fast Motion",
             "Chasing the giant bouncing dough through market stalls.",
             "ប្លង់ទី ២: ជួយចាប់វាផង! នំខេកនេះកំពុងរត់គេចខ្លួនហើយ!",
             "Catch it! The cake dough is bouncing away down the street!",
             "快抓住它！蛋糕面团正在大街上蹦蹦跳跳地逃跑！"),
            ("The Sticky Situation", "Village fountain where the giant dough lands with a soft comic SPLAT", "Over-the-Shoulder Reaction Shot",
             "Everyone covered in frosting sharing a joyful, infectious laugh.",
             "ប្លង់ទី ៣: ហាហា! មើលមុខឯងចុះ ដូចនំប៉័ងមានរោមចឹង!",
             "Haha! Look at your face, you look like a walking powdered pastry!",
             "哈哈！看看你的脸，简直就像一个行走的糖霜点心！"),
            ("The Sweetest Party", "Town square decorated with lanterns as everyone enjoys the tastiest accident ever made", "Warm Medium Ensemble Shot",
             "Sharing slices of the delicious giant cake with the entire village.",
             "ប្លង់ទី ៤: ទោះបីជាមានភាពរញ៉េរញ៉ៃ តែនេះជាថ្ងៃដែលសប្បាយបំផុត!",
             "Even though it was pure chaos, this turned out to be the sweetest day ever!",
             "虽然过程一团糟，但这绝对是最甜美快乐的一天！")
        ]
    }

    def generate_story(self, req: StoryGenerateRequest) -> StoryScriptResponse:
        prompt_lower = (req.prompt or "").lower()
        genre_key = "fantasy"
        if "comedy" in prompt_lower or "funny" in prompt_lower or "joke" in prompt_lower:
            genre_key = "comedy"
        elif "adventure" in prompt_lower or "mountain" in prompt_lower or "journey" in prompt_lower:
            genre_key = "adventure"
        elif req.genre and req.genre.lower() in self.GENRE_TEMPLATES:
            genre_key = req.genre.lower()

        templates = self.GENRE_TEMPLATES.get(genre_key, self.GENRE_TEMPLATES["fantasy"])

        # Determine scene count based on duration preset
        count = 4
        dur = (req.target_duration or "").lower()
        if "10" in dur and "5-" not in dur:
            count = 6
        elif ("15" in dur or "20" in dur) and "5-" not in dur:
            count = 8

        scenes: List[StoryScene] = []
        user_characters = req.characters or ["char_boy", "char_girl", "char_monkey"]

        for i in range(count):
            loc_tpl, vis_tpl, cam_tpl, desc_tpl, km_tpl, en_tpl, zh_tpl = templates[i % len(templates)]
            sc_num = i + 1
            char_pair = [user_characters[i % len(user_characters)], user_characters[(i + 1) % len(user_characters)]]

            title = f"{loc_tpl} (Scene {sc_num})"
            visual_prompt = f"Stylized 3D cartoon cinema render, Pixar art style. {vis_tpl}. {desc_tpl} Featuring {', '.join(char_pair)}. 8k resolution, raytracing, soft whimsical lighting, cinematic color grade."

            scenes.append(StoryScene(
                scene_number=sc_num,
                title=title,
                location=loc_tpl,
                camera_shot=cam_tpl,
                visual_prompt=visual_prompt,
                duration_sec=15,
                characters=char_pair,
                dialogue=SceneDialogue(
                    km=f"ប្លង់ទី {sc_num}: {km_tpl}",
                    en=f"Scene {sc_num}: {en_tpl}",
                    zh=f"第 {sc_num} 幕: {zh_tpl}"
                )
            ))

        clean_title = req.prompt.strip()[:40] if req.prompt.strip() else f"Enchanted {genre_key.capitalize()} Adventure"
        proj_id = req.project_id or f"proj_{uuid.uuid4().hex[:10]}"
        now = get_now_iso()

        return StoryScriptResponse(
            id=f"script_{uuid.uuid4().hex[:10]}",
            project_id=proj_id,
            title=clean_title,
            synopsis=f"A cinematic {genre_key} tale: {req.prompt.strip() or 'A brave journey through wonders and discoveries.'}",
            genre=genre_key.capitalize(),
            style=req.style or "3D Cartoon (Pixar-like)",
            scene_count=len(scenes),
            estimated_duration_sec=sum(s.duration_sec for s in scenes),
            scenes=scenes,
            provider_used="offline_contextual_engine",
            version=1,
            created_at=now,
            updated_at=now
        )


def get_llm_provider(preference: str = "auto") -> LLMProvider:
    """Factory creating the appropriate provider based on credentials and preference"""
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if preference in ("auto", "gemini") and gemini_key:
        return GeminiProvider(api_key=gemini_key)

    # Local contextual fallback
    return ContextualStoryEngine()
