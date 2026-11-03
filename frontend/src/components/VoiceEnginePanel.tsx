import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, Heart, LoaderCircle, MessageSquare, Mic, PawPrint } from 'lucide-react';
import { api } from '../services/api';
import type { VoiceCatalog } from '../services/api';

interface VoiceEnginePanelProps { catalog?: VoiceCatalog | null }

export const VoiceEnginePanel: React.FC<VoiceEnginePanelProps> = ({ catalog }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const requestId = useRef(0);
  const available = new Set((catalog?.human ?? []).map(voice => voice.id));
  const humanAvailable = available.has('km-KH-PisethNeural');
  const femaleAvailable = available.has('km-KH-SreymomNeural');
  useEffect(() => () => { requestId.current += 1; audio.current?.pause(); }, []);

  const playVoice = async (key: string, voiceId: string, text: string, pitch = '+0Hz', rate = '+0%') => {
    const currentRequest = ++requestId.current;
    audio.current?.pause();
    setPlayingId(key);
    setError('');
    try {
      const response = await api.previewVoice(voiceId, text, 'km', pitch, rate);
      if (currentRequest !== requestId.current) return;
      if (!response.audio_url) throw new Error('No audio returned');
      const sample = new Audio(response.audio_url);
      audio.current = sample;
      sample.onended = () => { if (currentRequest === requestId.current) setPlayingId(null); };
      sample.onerror = () => { if (currentRequest === requestId.current) { setPlayingId(null); setError('មិនអាចចាក់សំឡេងបាន / Audio unavailable'); } };
      await sample.play();
    } catch {
      if (currentRequest === requestId.current) { setPlayingId(null); setError('មិនអាចបង្កើតសំឡេងបាន។ សូមសាកម្ដងទៀត។ / Voice preview unavailable.'); }
    }
  };

  const humanVoices = [
    { key: 'child', kh: 'ក្មេង', en: 'Child', image: '/characters/face_girl.png', voice: 'km-KH-SreymomNeural', text: 'សួស្តី! ខ្ញុំជាសំឡេងក្មេងតុក្កតា!', pitch: '+20Hz', rate: '+10%' },
    { key: 'adult', kh: 'ពេញវ័យ', en: 'Adult', image: '/characters/face_man.png', voice: 'km-KH-PisethNeural', text: 'ជម្រាបសួរ! សូមស្វាគមន៍មកកាន់ស្ទូឌីយោតុក្កតា AI!', pitch: '+0Hz', rate: '+0%' },
    { key: 'elder', kh: 'មនុស្សចាស់', en: 'Elder', image: '/characters/face_old.png', voice: 'km-KH-PisethNeural', text: 'ឱចៅៗអើយ! តោះយើងមកស្តាប់រឿងព្រេងពីបុរាណ!', pitch: '-20Hz', rate: '-15%' },
  ];
  const emotions = [
    { key: 'emo_happy', kh: 'រីករាយ', en: 'Happy', image: '/assets/emo_happy.png', text: 'យេ! ពួកយើងសប្បាយចិត្តខ្លាំងណាស់!', pitch: '+20Hz', rate: '+15%' },
    { key: 'emo_sad', kh: 'សោកសៅ', en: 'Sad', image: '/assets/emo_sad.png', text: 'អនិច្ចាអើយ... ខ្ញុំពិតជាពិបាកចិត្តណាស់...', pitch: '-20Hz', rate: '-15%' },
    { key: 'emo_angry', kh: 'ខឹង', en: 'Angry', image: '/assets/emo_angry.png', text: 'ឈប់ភ្លាម! ខ្ញុំខឹងខ្លាំងណាស់ហើយ!', pitch: '+20Hz', rate: '+25%' },
    { key: 'emo_scared', kh: 'ភ័យខ្លាច', en: 'Scared', image: '/assets/emo_scared.png', text: 'ជួយផង! សត្វចម្លែកមកហើយ!', pitch: '+35Hz', rate: '+20%' },
  ];
  const card = 'relative flex min-w-0 flex-col items-center rounded-lg border px-1 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-45';
  const cardTone = (key: string) => playingId === key ? 'border-violet-400/60 bg-violet-500/15 text-violet-200' : 'border-transparent bg-[#0e1020]/60 text-slate-300 hover:border-violet-400/20 hover:bg-violet-500/5';
  const spinner = (key: string) => playingId === key && <LoaderCircle className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-spin text-violet-300" />;

  return (
    <section className="studio-card min-w-0 space-y-3 p-3 text-left" aria-labelledby="voice-library-title">
      <div className="flex items-center gap-2.5 border-b border-[#292b43]/70 pb-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400"><AudioLines className="h-4 w-4" /></span><h2 id="voice-library-title" className="text-[12px] font-semibold leading-[1.4] text-slate-100">សំឡេងឆ្លាតវៃ<span className="block text-[10px] font-normal text-slate-500">AI Voice & Sound</span></h2></div>
      <div>
        <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-300"><Mic className="h-3 w-3 text-violet-400" />សំឡេងមនុស្ស <span className="text-[9px] font-normal text-slate-500">Human voices</span></h3>
        <div className="grid grid-cols-3 gap-1.5">{humanVoices.map(voice => <button key={voice.key} type="button" disabled={!available.has(voice.voice)} onClick={() => void playVoice(voice.key, voice.voice, voice.text, voice.pitch, voice.rate)} aria-label={`ស្តាប់សំឡេង ${voice.en}`} aria-pressed={playingId === voice.key} className={`${card} ${cardTone(voice.key)}`}>{spinner(voice.key)}<img src={voice.image} alt="" className="mb-1.5 h-8 w-8 rounded-full border border-violet-400/15 object-cover" /><span className="text-[10px] font-medium leading-[1.4]">{voice.kh}</span><span className="text-[9px] leading-[1.4] text-slate-500">{voice.en}</span></button>)}</div>
      </div>
      <div>
        <h3 className="mb-1.5 flex items-center justify-between gap-1 text-[11px] font-medium text-slate-300"><span className="flex items-center gap-1.5"><PawPrint className="h-3 w-3 text-violet-400" />សំឡេងសត្វ <span className="text-[9px] font-normal text-slate-500">Animal SFX</span></span><span className="text-[8px] font-normal text-slate-600">Planned</span></h3>
        <div className="grid grid-cols-4 gap-1">{[{ label: 'Dog', image: '/assets/sound_dog.png' }, { label: 'Cat', image: '/assets/sound_cat.png' }, { label: 'Lion', image: '/assets/sound_lion.png' }, { label: 'Bird', image: '/assets/sound_bird.png' }].map(animal => <button key={animal.label} type="button" disabled title="សំឡេងសត្វធម្មជាតិនឹងបន្ថែមពេលក្រោយ / Natural animal audio is planned" className={`${card} border-transparent bg-[#0e1020]/50 !opacity-50`}><img src={animal.image} alt="" className="mb-1 h-6 w-6 rounded-full object-cover" /><span className="text-[9px] leading-[1.4]">{animal.label}</span></button>)}</div>
      </div>
      <div>
        <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-300"><MessageSquare className="h-3 w-3 text-violet-400" />សត្វនិយាយ <span className="text-[9px] font-normal text-slate-500">Talking animals</span></h3>
        <button type="button" disabled={!femaleAvailable} onClick={() => void playVoice('talking-cat', 'km-KH-SreymomNeural', 'Hello! ខ្ញុំជាឆ្មាវៃឆ្លាតដែលអាចនិយាយភាសាខ្មែរបាន!', '+35Hz', '+15%')} aria-pressed={playingId === 'talking-cat'} className={`relative flex w-full items-center gap-2.5 rounded-lg border p-2 text-left transition-colors disabled:opacity-45 ${cardTone('talking-cat')} !border-violet-400/20`}>
          {spinner('talking-cat')}<img src="/assets/talking_cat.png" alt="" className="h-7 w-7 rounded-full border border-violet-400/20 object-cover" /><span className="text-[10px] font-medium leading-[1.4] text-slate-200">ឆ្មានិយាយ<span className="block text-[9px] font-normal text-slate-500">Talking cat · voice preset</span></span><span className="ml-auto rounded-full bg-violet-400/10 px-2 py-0.5 text-[9px] text-violet-300">Hello!</span>
        </button>
      </div>
      <div>
        <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-300"><Heart className="h-3 w-3 text-violet-400" />អារម្មណ៍ <span className="text-[9px] font-normal text-slate-500">Emotion presets</span></h3>
        <div className="grid grid-cols-4 gap-1">{emotions.map(emotion => <button key={emotion.key} type="button" disabled={!humanAvailable} onClick={() => void playVoice(emotion.key, 'km-KH-PisethNeural', emotion.text, emotion.pitch, emotion.rate)} aria-pressed={playingId === emotion.key} className={`${card} ${cardTone(emotion.key)}`}>{spinner(emotion.key)}<img src={emotion.image} alt="" className="mb-1 h-6 w-6 rounded-full object-cover" /><span className="text-[9px] font-medium leading-[1.4]">{emotion.kh}</span><span className="text-[8px] leading-[1.4] text-slate-500">{emotion.en}</span></button>)}</div>
      </div>
      {error && <p role="status" className="text-[10px] leading-relaxed text-amber-300">{error}</p>}
    </section>
  );
};
