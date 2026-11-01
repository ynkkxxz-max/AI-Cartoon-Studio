import asyncio
import os
import uuid
from pathlib import Path
import edge_tts
from backend.app.core.config import GENERATED_DIR

VOICE_CATALOG = {
    "human": [
        {
            "id": "km-KH-PisethNeural",
            "name": "Piseth (ក្មេងប្រុស / បុរស)",
            "lang": "km",
            "gender": "Male",
            "sample": "សួស្តី! ខ្ញុំបាទឈ្មោះ ពិសិដ្ឋ សូមស្វាគមន៍មកកាន់ AI Cartoon Studio!",
            "category": "human_child_boy"
        },
        {
            "id": "km-KH-SreymomNeural",
            "name": "Sreymom (ក្មេងស្រី / ស្រ្តី)",
            "lang": "km",
            "gender": "Female",
            "sample": "ជម្រាបសួរចាស! នាងខ្ញុំឈ្មោះ ស្រីមុំ រីករាយណាស់ដែលបានស្គាល់អ្នកទាំងអស់គ្នា!",
            "category": "human_child_girl"
        },
        {
            "id": "en-US-AnaNeural",
            "name": "Ana (Child Girl)",
            "lang": "en",
            "gender": "Female",
            "sample": "Hi everyone! Welcome to AI Cartoon Studio. Let's create an amazing story together!",
            "category": "human_child_girl"
        },
        {
            "id": "en-US-ChristopherNeural",
            "name": "Christopher (Adult Man)",
            "lang": "en",
            "gender": "Male",
            "sample": "Welcome to AI Cartoon Studio. Professional video production made effortless.",
            "category": "human_adult"
        },
        {
            "id": "zh-CN-XiaoxiaoNeural",
            "name": "Xiaoxiao (小晓 - 少女/女性)",
            "lang": "zh",
            "gender": "Female",
            "sample": "你好！欢迎来到AI卡通工作室，让我们一起开启精彩的奇幻冒险！",
            "category": "human_child_girl"
        },
        {
            "id": "zh-CN-YunjianNeural",
            "name": "Yunjian (云健 - 青年/成熟男性)",
            "lang": "zh",
            "gender": "Male",
            "sample": "大家好，我是云健。今天我们将为您带来最高水准的动画制作体验。",
            "category": "human_adult"
        }
    ],
    "animal": [
        {"id": "sound_dog", "name": "Dog (ឆ្កែ)", "sound_type": "bark", "sample_text": "Woof woof! ហ្គៅៗ!"},
        {"id": "sound_cat", "name": "Cat (ឆ្មា)", "sound_type": "meow", "sample_text": "Meow meow! ម៉ែវៗ!"},
        {"id": "sound_lion", "name": "Lion (តោ)", "sound_type": "roar", "sample_text": "Roaaar! សំឡេងតោបន្លឺឡើង!"},
        {"id": "sound_bird", "name": "Bird (សត្វបក្សី)", "sound_type": "chirp", "sample_text": "Chirp chirp! ច្រៀងពិរោះណាស់!"}
    ],
    "talking_animal": [
        {
            "id": "talking_cat",
            "name": "Talking Cat (ឆ្មាឆ្លាត)",
            "voice_id": "km-KH-SreymomNeural",
            "pitch": "+25Hz",
            "rate": "+15%",
            "sample": "Hello! ខ្ញុំជាឆ្មាដែលអាចនិយាយភាសាខ្មែរបាន! ស្រឡាញ់ខ្ញុំទេ?",
            "lang": "km"
        },
        {
            "id": "talking_monkey",
            "name": "Talking Monkey (ស្វាវ័យឆ្លាត)",
            "voice_id": "km-KH-PisethNeural",
            "pitch": "+30Hz",
            "rate": "+20%",
            "sample": "អេហេ! ខ្ញុំជាស្វាអច្ឆរិយៈ ចូលចិត្តញ៉ាំចេក និងធ្វើដំណើរផ្សងព្រេង!",
            "lang": "km"
        }
    ],
    "emotions": [
        {"id": "emo_happy", "name": "Happy (រីករាយ)", "pitch": "+15Hz", "rate": "+10%"},
        {"id": "emo_sad", "name": "Sad (សោកសៅ)", "pitch": "-15Hz", "rate": "-15%"},
        {"id": "emo_angry", "name": "Angry (ខឹង)", "pitch": "+20Hz", "rate": "+20%"},
        {"id": "emo_scared", "name": "Scared (ភ័យខ្លាច)", "pitch": "+35Hz", "rate": "+25%"}
    ]
}

async def generate_speech_audio(
    text: str,
    voice_id: str = "km-KH-PisethNeural",
    rate: str = "+0%",
    pitch: str = "+0Hz"
) -> Path:
    """
    Generates mp3 file via edge_tts and returns Path
    """
    out_filename = f"tts_{uuid.uuid4().hex[:10]}.mp3"
    out_path = GENERATED_DIR / out_filename

    # Fallback to default voice if voice_id is custom
    if not voice_id.endswith("Neural"):
        voice_id = "km-KH-PisethNeural"

    communicate = edge_tts.Communicate(text=text, voice=voice_id, rate=rate, pitch=pitch)
    await communicate.save(str(out_path))
    return out_path

