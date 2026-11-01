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
  const [duration, setDuration] = useState<number>(30);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-studio-card rounded-2xl border border-studio-cardBorder p-3.5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-studio-cardBorder/60">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            មើលជាមុន
            <span className="text-[11px] font-normal text-slate-400">(Preview)</span>
          </h3>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
          ● Ready to Play
        </span>
      </div>

      {/* Video Box */}
      <div className="relative mt-2.5 rounded-xl overflow-hidden bg-black aspect-video border border-studio-cardBorder group">
        <video
          ref={videoRef}
          src="/api/editor/sample-preview"
          poster="/assets/preview_poster.jpg"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-cover"
        />

        {/* Big Center Play Overlay Button when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center backdrop-blur-sm shadow-2xl transition-all hover:scale-110"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>
        )}

        {/* Subtitles Overlay */}
        {showSubtitles && (
          <div className="absolute bottom-11 inset-x-2 text-center pointer-events-none transition-all">
            <span className="inline-block px-3 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] text-amber-300 font-medium border border-white/10 shadow-lg">
              {currentSubtitleKh}
              <div className="text-[9px] text-slate-300 font-normal">{currentSubtitleEn}</div>
            </span>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 h-9 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2.5 flex items-center justify-between text-white text-xs z-20">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="hover:text-purple-300 transition-colors">
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-slate-300 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              title="បឋមកថាអក្សររត់ Subtitles (CC)"
              className={`p-1 rounded ${showSubtitles ? 'text-purple-300 bg-purple-900/50' : 'hover:text-white'}`}
            >
              <Subtitles className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              title="សំឡេង Volume"
              className="p-1 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => alert("ការកំណត់មើលជាមុន (Preview Quality Settings): 1080p Playback, H.264 AAC")}
              title="ការកំណត់ Settings"
              className="p-1 hover:text-white"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              title="ពេញអេក្រង់ Fullscreen"
              className="p-1 hover:text-white"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
