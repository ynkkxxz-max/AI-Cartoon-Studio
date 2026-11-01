import React, { useState, useRef } from 'react';
import { Video, Play, Pause, Volume2, VolumeX, Maximize2, Subtitles, Settings } from 'lucide-react';

interface PreviewPlayerProps {
  currentSubtitleKh?: string;
  currentSubtitleEn?: string;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  currentSubtitleKh = "ដំណើរផ្សងព្រេងក្នុងទឹកដីវេទមន្តនៃស្ទូឌីយោតុក្កតា AI",
  currentSubtitleEn = "The magic journey through the enchanted animated kingdom"
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const duration = 30;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#111327] rounded-2xl border border-[#1f2343] p-4 shadow-xl text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#1f2343]/80">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            មើលជាមុន
            <span className="text-[11px] font-normal text-slate-400">(Preview)</span>
          </h3>
        </div>

        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
          ● Ready to Play
        </span>
      </div>

      {/* Video Box matching exact 3D Cartoon scene from mockup */}
      <div className="relative mt-3 rounded-xl overflow-hidden bg-black aspect-video border border-[#23274c] group shadow-inner">
        <img
          src="/assets/preview_screen.jpg"
          alt="3D Animated Cartoon Preview"
          className={`w-full h-full object-cover transition-all duration-300 ${isPlaying ? 'scale-105' : 'scale-100'}`}
        />

        {/* Audio stream */}
        <audio
          ref={audioRef}
          src="/api/voices/playback/tts_e6cb520169.mp3"
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Center Play Button Overlay matching mockup */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-purple-600/90 hover:bg-purple-600 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all hover:scale-110 ring-4 ring-purple-500/40"
          >
            <Play className="w-6 h-6 ml-0.5 fill-white" />
          </button>
        )}

        {/* Subtitles Overlay (CC) */}
        {showSubtitles && (
          <div className="absolute bottom-10 inset-x-2 text-center pointer-events-none">
            <span className="inline-block px-3 py-1 rounded-md bg-black/85 backdrop-blur-md text-[11px] text-amber-300 font-bold border border-white/10 shadow-lg">
              {currentSubtitleKh}
              <div className="text-[9px] text-slate-300 font-normal">{currentSubtitleEn}</div>
            </span>
          </div>
        )}

        {/* Bottom Video Controls matching mockup */}
        <div className="absolute bottom-0 inset-x-0 h-9 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 flex items-center justify-between text-white text-xs z-20">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="hover:text-purple-300 transition-colors">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <span className="text-[11px] text-slate-300 font-mono font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              title="បឋមកថាអក្សររត់ Subtitles (CC)"
              className={`p-1 rounded ${showSubtitles ? 'text-purple-300 bg-purple-900/60' : 'hover:text-white'}`}
            >
              <Subtitles className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              title="សំឡេង Volume"
              className="p-1 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => alert("Preview Quality: 1080p Full HD H.264 Playback")}
              title="ការកំណត់ Settings"
              className="p-1 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const el = document.fullscreenElement;
                if (!el) {
                  document.documentElement.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }}
              title="ពេញអេក្រង់ Fullscreen"
              className="p-1 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
