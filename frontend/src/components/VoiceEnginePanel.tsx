import React, { useState } from 'react';
import { Mic, MessageSquare, Heart } from 'lucide-react';
import { api } from '../services/api';
import type { VoiceCatalog } from '../services/api';

interface VoiceEnginePanelProps {
  catalog?: VoiceCatalog | null;
}

export const VoiceEnginePanel: React.FC<VoiceEnginePanelProps> = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const playVoice = async (id: string, text: string, lang = 'km', pitch = '+0Hz', rate = '+0%') => {
    try {
      if (activeAudio) {
        activeAudio.pause();
      }
      setPlayingId(id);

      const res = await api.previewVoice(id, text, lang, pitch, rate);
      if (res && res.audio_url) {
        const audio = new Audio(res.audio_url);
        setActiveAudio(audio);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        await audio.play();
      }
    } catch (err: any) {
      console.error('Audio play error:', err);
      setPlayingId(null);
    }
  };

  return (
    <div className="bg-studio-card rounded-2xl border border-studio-cardBorder p-3.5 shadow-xl space-y-3 text-left">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-studio-cardBorder/60">
        <div className="w-5 h-5 flex items-center justify-center text-purple-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 3v18M8 6v12M4 9v6M16 6v12M20 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xs font-bold text-white leading-tight">
            សំឡេងឆ្លាតវៃ និងសំឡេង
          </h3>
          <span className="text-[10px] text-slate-400 leading-tight">(AI Smart Voice & Sound)</span>
        </div>
      </div>

      {/* 1. Human Voices */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1.5">
          <Mic className="w-3.5 h-3.5 text-purple-400" />
          <span>សំឡេងមនុស្ស / Human Voices</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Child */}
          <button
            onClick={() => playVoice('km-KH-SreymomNeural', 'សួស្តី! ខ្ញុំជាសំឡេងក្មេងតុក្កតា!', 'km', '+20Hz', '+10%')}
            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
              playingId === 'km-KH-SreymomNeural'
                ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-500/40'
                : 'bg-[#121427] border-studio-cardBorder hover:border-purple-500/40'
            }`}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-900/30 flex items-center justify-center border border-purple-400/40">
              <img src="/characters/face_girl.png" alt="Child" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-semibold text-slate-200">ក្មេង</span>
            <span className="text-[8px] text-slate-400">Child</span>
          </button>

          {/* Adult */}
          <button
            onClick={() => playVoice('km-KH-PisethNeural', 'ជម្រាបសួរ! ខ្ញុំជាសំឡេងមនុស្សពេញវ័យក្នុងរឿងតុក្កតា!', 'km')}
            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
              playingId === 'km-KH-PisethNeural'
                ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-500/40'
                : 'bg-[#121427] border-studio-cardBorder hover:border-purple-500/40'
            }`}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-900/30 flex items-center justify-center border border-purple-400/40">
              <img src="/characters/face_man.png" alt="Adult" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-semibold text-slate-200">ពេញវ័យ</span>
            <span className="text-[8px] text-slate-400">Adult</span>
          </button>

          {/* Old Man / Old Woman */}
          <button
            onClick={() => playVoice('km-KH-PisethNeural', 'ឱចៅៗអើយ! នេះជាសំឡេងមនុស្សចាស់និទានរឿងព្រេងពីបុរាណ!', 'km', '-20Hz', '-15%')}
            className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${
              playingId === 'km-KH-PisethNeural_old'
                ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-500/40'
                : 'bg-[#121427] border-studio-cardBorder hover:border-purple-500/40'
            }`}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-900/30 flex items-center justify-center border border-purple-400/40">
              <img src="/characters/face_old.png" alt="Old Man" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-semibold text-slate-200">មនុស្សចាស់</span>
            <span className="text-[8px] text-slate-400 text-center leading-tight">Old Man/Woman</span>
          </button>
        </div>
      </div>

      {/* 2. Animal Sounds */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1.5">
          <span className="text-purple-400 text-xs">🐾</span>
          <span>សំឡេងសត្វ / Animal Sounds</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'sound_dog', label: 'Dog', img: '/assets/sound_dog.png', text: 'វូហ្វ វូហ្វ! ឆ្កែព្រុស ហ្គៅៗ!' },
            { id: 'sound_cat', label: 'Cat', img: '/assets/sound_cat.png', text: 'ម៉ែវ ម៉ែវ! ឆ្មាស្រែក!' },
            { id: 'sound_lion', label: 'Lion', img: '/assets/sound_lion.png', text: 'រ៉ូអឺ! សំឡេងតោកំណាច!' },
            { id: 'sound_bird', label: 'Bird', img: '/assets/sound_bird.png', text: 'ជីប ជីប! សត្វបក្សីច្រៀង!' },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => playVoice(a.id, a.text, 'km', '+20Hz', '+20%')}
              className="p-1 rounded-xl bg-[#121427] border border-studio-cardBorder hover:border-purple-500/40 flex flex-col items-center gap-0.5 transition-all group"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-[#1a1c36] p-0.5 group-hover:scale-105 transition-transform">
                <img src={a.img} alt={a.label} className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="text-[9px] font-semibold text-slate-300">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Talking Animal Voices */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span>សំឡេងសត្វនិយាយ / Talking Animal Voices</span>
        </div>

        <button
          onClick={() => playVoice('km-KH-SreymomNeural', 'Hello! ខ្ញុំជាឆ្មាវៃឆ្លាតដែលអាចនិយាយភាសាខ្មែរបានច្បាស់ល្អ!', 'km', '+35Hz', '+15%')}
          className="w-full p-2 rounded-xl bg-gradient-to-r from-[#171533] via-[#1a1538] to-[#141630] border border-purple-500/40 hover:border-purple-400 flex items-center gap-2.5 transition-all group"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-amber-400/50">
            <img src="/assets/talking_cat.png" alt="Talking Cat" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 rounded-full bg-white text-purple-950 text-[9px] font-bold shadow-sm">
              Hello!
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-slate-200 leading-tight">
                សត្វដែលអាចនិយាយបាន
              </span>
              <span className="text-[8px] text-slate-400 leading-tight">Animals that can talk</span>
            </div>
          </div>
        </button>
      </div>

      {/* 4. Emotional Voices */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1.5">
          <Heart className="w-3.5 h-3.5 text-purple-400" />
          <span>អារម្មណ៍សំឡេង / Emotion Voices</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'emo_happy', labelKh: 'រីករាយ', labelEn: 'Happy', img: '/assets/emo_happy.png', text: 'យេ! ពួកយើងសប្បាយចិត្តខ្លាំងណាស់!', pitch: '+20Hz', rate: '+15%' },
            { id: 'emo_sad', labelKh: 'សោកសៅ', labelEn: 'Sad', img: '/assets/emo_sad.png', text: 'អនិច្ចាអើយ... ខ្ញុំពិតជាពិបាកចិត្តណាស់...', pitch: '-20Hz', rate: '-15%' },
            { id: 'emo_angry', labelKh: 'ខឹង', labelEn: 'Angry', img: '/assets/emo_angry.png', text: 'ឈប់ភ្លាម! ខ្ញុំខឹងខ្លាំងណាស់ហើយ!', pitch: '+20Hz', rate: '+25%' },
            { id: 'emo_scared', labelKh: 'ភ័យខ្លាច', labelEn: 'Scared', img: '/assets/emo_scared.png', text: 'ជួយផង! ខ្មោច ឬសត្វចម្លែកមកហើយ!', pitch: '+35Hz', rate: '+20%' },
          ].map((emo) => (
            <button
              key={emo.id}
              onClick={() => playVoice('km-KH-PisethNeural', emo.text, 'km', emo.pitch, emo.rate)}
              className="p-1 rounded-xl bg-[#121427] border border-studio-cardBorder hover:border-purple-500/40 flex flex-col items-center gap-0.5 transition-all group"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
                <img src={emo.img} alt={emo.labelEn} className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="text-[9px] font-medium text-slate-300 leading-tight">{emo.labelKh}</span>
              <span className="text-[8px] text-slate-500 leading-tight">{emo.labelEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
