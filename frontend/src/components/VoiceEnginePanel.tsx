import React, { useState } from 'react';
import { Mic, User, Volume2, Sparkles } from 'lucide-react';
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
    <div className="bg-studio-card rounded-2xl border border-studio-cardBorder p-3.5 shadow-xl space-y-3.5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-studio-cardBorder/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              សំឡេងឆ្លាតវៃ និងសំឡេង
            </h3>
            <span className="text-[10px] text-slate-400">(AI Smart Voice & Sound)</span>
          </div>
        </div>
      </div>

      {/* 1. Human Voices */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
          <User className="w-3.5 h-3.5 text-purple-400" />
          <span>សំឡេងមនុស្ស / Human Voices</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Child */}
          <button
            onClick={() => playVoice('km-KH-SreymomNeural', 'សួស្តី! ខ្ញុំជាសំឡេងក្មេងតុក្កតា!', 'km', '+15Hz', '+10%')}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              playingId === 'km-KH-SreymomNeural'
                ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-500/30'
                : 'bg-[#121426] border-studio-cardBorder hover:border-purple-500/40'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-xs">
              👧
            </div>
            <span className="text-[10px] font-semibold text-slate-200">ក្មេង</span>
            <span className="text-[9px] text-slate-400">Child</span>
            {playingId === 'km-KH-SreymomNeural' && (
              <span className="text-[8px] text-purple-300 animate-pulse font-bold">▶ កំពុងចាក់</span>
            )}
          </button>

          {/* Adult */}
          <button
            onClick={() => playVoice('km-KH-PisethNeural', 'ជម្រាបសួរ! ខ្ញុំជាសំឡេងមនុស្សពេញវ័យក្នុងរឿងតុក្កតា!', 'km')}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              playingId === 'km-KH-PisethNeural'
                ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-500/30'
                : 'bg-[#121426] border-studio-cardBorder hover:border-purple-500/40'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs">
              👨
            </div>
            <span className="text-[10px] font-semibold text-slate-200">ពេញវ័យ</span>
            <span className="text-[9px] text-slate-400">Adult</span>
            {playingId === 'km-KH-PisethNeural' && (
              <span className="text-[8px] text-purple-300 animate-pulse font-bold">▶ កំពុងចាក់</span>
            )}
          </button>

          {/* Old Man / Old Woman */}
          <button
            onClick={() => playVoice('km-KH-PisethNeural', 'ឱចៅៗអើយ! នេះជាសំឡេងមនុស្សចាស់និទានរឿងព្រេងពីបុរាណ!', 'km', '-20Hz', '-15%')}
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              playingId === 'km-KH-PisethNeural_old'
                ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-500/30'
                : 'bg-[#121426] border-studio-cardBorder hover:border-purple-500/40'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
              👴
            </div>
            <span className="text-[10px] font-semibold text-slate-200">មនុស្សចាស់</span>
            <span className="text-[8px] text-slate-400 text-center leading-tight">Old Man/Woman</span>
          </button>
        </div>
      </div>

      {/* 2. Animal Sounds */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
          <span>🐾</span>
          <span>សំឡេងសត្វ / Animal Sounds</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'sound_dog', labelKh: 'ឆ្កែ', labelEn: 'Dog', icon: '🐶', text: 'វូហ្វ វូហ្វ! ឆ្កែព្រុស ហ្គៅៗ!' },
            { id: 'sound_cat', labelKh: 'ឆ្មា', labelEn: 'Cat', icon: '🐱', text: 'ម៉ែវ ម៉ែវ! ឆ្មាស្រែក!' },
            { id: 'sound_lion', labelKh: 'តោ', labelEn: 'Lion', icon: '🦁', text: 'រ៉ូអឺ! សំឡេងតោកំណាច!' },
            { id: 'sound_bird', labelKh: 'បក្សី', labelEn: 'Bird', icon: '🐦', text: 'ជីប ជីប! សត្វបក្សីច្រៀង!' },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => playVoice(a.id, a.text, 'km', '+20Hz', '+20%')}
              className="p-1.5 rounded-xl bg-[#121426] border border-studio-cardBorder hover:border-purple-500/40 flex flex-col items-center gap-0.5 transition-all"
            >
              <span className="text-sm">{a.icon}</span>
              <span className="text-[9px] font-semibold text-slate-300">{a.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Talking Animal Voices */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>សំឡេងសត្វនិយាយ / Talking Animals</span>
        </div>

        <button
          onClick={() => playVoice('km-KH-SreymomNeural', 'Hello! ខ្ញុំជាឆ្មាវៃឆ្លាតដែលអាចនិយាយភាសាខ្មែរបានច្បាស់ល្អ!', 'km', '+35Hz', '+15%')}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-purple-500/30 hover:border-purple-400 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/30 flex items-center justify-center text-sm shadow-inner">
              🐱
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-pink-200 flex items-center gap-1">
                Hello! <span className="text-white">សត្វដែលអាចនិយាយបាន</span>
              </span>
              <span className="text-[9px] text-slate-400">Animals that can talk (Khmer/EN/CN)</span>
            </div>
          </div>
          <div className="w-6 h-6 rounded-full bg-purple-600/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
            <Volume2 className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* 4. Emotional Voices */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
          <span>🎭</span>
          <span>អារម្មណ៍សំឡេង / Emotion Voices</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'emo_happy', labelKh: 'រីករាយ', labelEn: 'Happy', emoji: '😊', text: 'យេ! ពួកយើងសប្បាយចិត្តខ្លាំងណាស់!', pitch: '+20Hz', rate: '+15%' },
            { id: 'emo_sad', labelKh: 'សោកសៅ', labelEn: 'Sad', emoji: '😢', text: 'អនិច្ចាអើយ... ខ្ញុំពិតជាពិបាកចិត្តណាស់...', pitch: '-20Hz', rate: '-15%' },
            { id: 'emo_angry', labelKh: 'ខឹង', labelEn: 'Angry', emoji: '😠', text: 'ឈប់ភ្លាម! ខ្ញុំខឹងខ្លាំងណាស់ហើយ!', pitch: '+20Hz', rate: '+25%' },
            { id: 'emo_scared', labelKh: 'ភ័យខ្លាច', labelEn: 'Scared', emoji: '😨', text: 'ជួយផង! ខ្មោច ឬសត្វចម្លែកមកហើយ!', pitch: '+35Hz', rate: '+20%' },
          ].map((emo) => (
            <button
              key={emo.id}
              onClick={() => playVoice('km-KH-PisethNeural', emo.text, 'km', emo.pitch, emo.rate)}
              className="p-1.5 rounded-xl bg-[#121426] border border-studio-cardBorder hover:border-purple-500/40 flex flex-col items-center gap-0.5 transition-all"
            >
              <span className="text-xs">{emo.emoji}</span>
              <span className="text-[9px] font-medium text-slate-300">{emo.labelKh}</span>
              <span className="text-[8px] text-slate-500">{emo.labelEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
