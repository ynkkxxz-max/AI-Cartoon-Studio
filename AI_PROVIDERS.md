# 🤖 AI PROVIDERS — Adapter Architecture & Capabilities

## 1. Provider Adapter Architecture
All AI interactions run through provider-independent abstraction interfaces:
- Standardized request schemas
- Real API error catching and rate-limit handling
- Strict cost controls (no silent fallbacks that incur unexpected billing)
- No fake/simulated responses in production mode

---

## 2. Currently Configured & Verified Providers

### Text-to-Speech (TTS): Edge-TTS Neural Engine
- **Status:** Tested — Working ✅
- **Driver:** `edge-tts` (Python SDK)
- **Supported Languages & Models:**
  - **Khmer 🇰🇭:** `km-KH-PisethNeural` (Male Adult / Child Boy), `km-KH-SreymomNeural` (Female Adult / Child Girl)
  - **English 🇺🇸:** `en-US-ChristopherNeural`, `en-US-AnaNeural`
  - **Mandarin Chinese 🇨🇳:** `zh-CN-XiaoxiaoNeural`, `zh-CN-YunjianNeural`
- **Output:** Native 24kHz MP3 audio files streamed to frontend and saved under `storage/generated/`.

### Media Processing & Transcoding: FFmpeg 7.1 Engine
- **Status:** Tested — Working ✅
- **Binary:** Bundled `ffmpeg-win-x86_64-v7.1.exe` (`imageio-ffmpeg`)
- **Capabilities:**
  - Silence detection (`silencedetect=noise=-30dB:d=0.5`)
  - Frame-accurate video trimming
  - Multi-clip concatenation with crossfade
  - Aspect ratio transcoding (9:16 TikTok, 16:9 YouTube, 1:1 Square)
  - Fast-start MP4 streaming header injection (`-movflags +faststart`)

---

## 3. Configurable & Planned AI Integrations

### Large Language Model (Story Scripts & Translation)
- **Planned Adapters:** Google Gemini (Gemini 1.5 Pro / Flash) & OpenAI (GPT-4o)
- **Target Output:** Structured JSON containing scene breakdown, dialogue lines, camera directions, and multilingual translations.

### Speech-to-Text (ASR) & Transcription
- **Planned Adapters:** OpenAI Whisper / Faster-Whisper local engine
- **Capabilities:** Word-level timestamps, speaker diarization, language identification.

### Image & Video Generation
- **Planned Adapters:** Configurable cloud video/image APIs (Runway Gen-3, Luma Dream Machine, Kling, Stable Diffusion).
- **Execution:** Scene-level generation with background job queue.
