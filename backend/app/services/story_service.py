import json
from typing import Dict, Any, List

def generate_story_scenes(prompt: str, duration_preset: str, languages: List[str]) -> Dict[str, Any]:
    """
    Constructs structured 3D animation scenes with synchronized multilingual scripts
    """
    # Estimate scenes based on duration preset
    scene_count = 4 if "5" in duration_preset else (8 if "10" in duration_preset else 12)

    story_title = prompt.strip()[:40] if prompt.strip() else "The Magic Forest Kingdom"

    scenes = []
    base_descriptions = [
        ("Ancient Temple Gate", "Young boy and his monkey companion arrive at towering ancient gates covered in glowing mystic runes."),
        ("Crystal Waterfall", "A mesmerizing glowing blue waterfall surrounded by luminescent flowers and playful forest spirits."),
        ("The Floating Sky Islands", "Majestic floating islands drifting above clouds with golden bridges connecting ancient stone pavilions."),
        ("The Dragon's Library", "A vast subterranean hall with millions of floating scrolls and a friendly emerald dragon mentor."),
        ("The Crystal Heart Chamber", "The central sanctuary where the sacred gem radiates harmony, restoring life to the enchanted land."),
        ("Celebration in the Sky Village", "Villagers, magical animals, and the children gather in vibrant celebration as lanterns float into the sky.")
    ]

    for i in range(min(scene_count, len(base_descriptions))):
        loc, desc = base_descriptions[i]
        scenes.append({
            "scene_number": i + 1,
            "location": loc,
            "visual_description": f"Stylized 3D cinematic scene: {desc}",
            "duration_sec": 15,
            "dialogue": {
                "km": f"ប្លង់ទី {i+1}: ពួកយើងបានមកដល់ {loc} ហើយ! មើលចុះ ពិតជាអស្ចារ្យមែន!",
                "en": f"Scene {i+1}: We have arrived at the {loc}! Look, it's truly breathtaking!",
                "zh": f"第 {i+1} 幕：我们终于到达了 {loc}！看啊，这里简直太壮观了！"
            },
            "characters": ["char_boy", "char_monkey"] if i % 2 == 0 else ["char_girl", "char_man"]
        })

    return {
        "title": story_title,
        "prompt": prompt,
        "duration": duration_preset,
        "scene_count": len(scenes),
        "scenes": scenes,
        "languages": languages
    }

