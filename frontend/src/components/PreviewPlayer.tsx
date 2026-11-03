import React, { useRef, useState } from 'react';
import { Maximize2, Pause, Play, Subtitles, Video, Volume2, VolumeX } from 'lucide-react';

interface PreviewPlayerProps {
  currentSubtitleKh?: string;
  currentSubtitleEn?: string;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ currentSubtitleKh = 'ដំណើរផ្សងព្រេងក្នុងទឹកដីវេទមន្តនៃស្ទូឌីយោតុក្កតា AI', currentSubtitleEn = 'The magic journey through the enchanted animated kingdom' }) => {
  const media = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };
  const togglePlay = async () => {
    if (!media.current) return;
    try {
      setError('');
      if (media.current.paused) await media.current.play();
      else media.current.pause();
    } catch {
      setError('មិនអាចចាក់គំរូបាន។ សូមពិនិត្យ backend។ / Preview unavailable.');
    }
  };

  return (
    <section className="studio-card min-w-0 p-3" aria-labelledby="studio-preview-title">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="studio-preview-title" className="flex items-center gap-2 text-[12px] font-semibold text-slate-100"><Video className="h-3.5 w-3.5 text-violet-400" />មើលជាមុន <span className="text-[10px] font-normal text-slate-500">Preview</span></h2>
        <span className="rounded-full border border-[#373851] bg-[#1c1d32] px-2 py-0.5 text-[9px] text-slate-400">Sample preview</span>
      </div>
      <div ref={frame} className="group relative mx-auto aspect-video max-h-[240px] w-full overflow-hidden rounded-lg bg-black">
        <video ref={media} src="/api/editor/sample-preview" poster="/assets/preview_screen.jpg" preload="metadata" muted={muted} playsInline className="h-full w-full object-contain" onLoadedMetadata={() => { const value = media.current?.duration ?? 0; setDuration(Number.isFinite(value) ? value : 0); }} onTimeUpdate={() => setTime(media.current?.currentTime ?? 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError('មិនអាចទាញយកគំរូបាន។ / Sample preview unavailable.')} />
        {!playing && <button type="button" onClick={() => void togglePlay()} aria-label="ចាក់គំរូ / Play sample preview" className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-violet-600/95 text-white shadow-lg transition-transform hover:scale-105"><Play className="ml-0.5 h-5 w-5 fill-current" /></button>}
        {subtitles && <div className="pointer-events-none absolute inset-x-3 bottom-12 text-center"><span className="inline-block max-w-full rounded bg-black/75 px-2.5 py-1 text-[10px] font-medium leading-[1.4] text-amber-200">{currentSubtitleKh}<span className="block text-[9px] font-normal text-slate-300">{currentSubtitleEn}</span></span></div>}
        <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black via-black/85 to-transparent px-2.5 pb-2 pt-5">
          <input type="range" min="0" max={duration || 1} value={Math.min(time, duration || 1)} step="0.1" disabled={!duration} aria-label="ទីតាំងចាក់វីដេអូ / Preview position" onChange={event => { if (media.current) media.current.currentTime = Number(event.target.value); }} className="block h-1 w-full accent-violet-400" />
          <div className="flex items-center justify-between text-slate-200">
            <div className="flex items-center gap-2"><button type="button" onClick={() => void togglePlay()} aria-label={playing ? 'Pause preview' : 'Play preview'} className="rounded p-0.5 hover:text-violet-300">{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}</button><span className="font-mono text-[9px] tabular-nums">{formatTime(time)} / {duration ? formatTime(duration) : '—'}</span></div>
            <div className="flex items-center gap-1.5"><button type="button" onClick={() => setSubtitles(value => !value)} aria-label="បិទបើកអក្សរ / Toggle preview subtitles" aria-pressed={subtitles} className={`rounded p-1 ${subtitles ? 'bg-violet-500/25 text-violet-200' : 'text-slate-400'}`}><Subtitles className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setMuted(value => !value)} aria-label={muted ? 'Unmute preview' : 'Mute preview'} className="p-1 hover:text-white">{muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button><button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void frame.current?.requestFullscreen().catch(() => {}); }} aria-label="មើលពេញអេក្រង់ / Fullscreen preview" className="p-1 hover:text-white"><Maximize2 className="h-3.5 w-3.5" /></button></div>
          </div>
        </div>
      </div>
      {error ? <p role="status" className="mt-2 text-[10px] leading-relaxed text-amber-300">{error}</p> : <p className="mt-2 text-[9px] leading-relaxed text-slate-500">គំរូសម្រាប់ពិនិត្យផ្ទាំងចាក់ / Local playback sample</p>}
    </section>
  );
};
