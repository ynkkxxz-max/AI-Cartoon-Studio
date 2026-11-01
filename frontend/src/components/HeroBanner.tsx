import React from 'react';
import { BookOpen, Users, Film, Mic, Sparkles, MonitorPlay } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const featureBadges = [
    { label: 'AI Story', icon: BookOpen },
    { label: 'Characters', icon: Users },
    { label: 'Animation', icon: Film },
    { label: 'Voice', icon: Mic },
    { label: 'Auto Edit', icon: Sparkles },
    { label: 'Export 1080p / 4K', icon: MonitorPlay },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17133b] via-[#161a42] to-[#12142e] border border-purple-500/20 p-5 shadow-xl shadow-purple-950/20">
      {/* Background ambient glow circles */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-60 h-60 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left text column */}
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">
              AI Cartoon Studio
            </h1>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-sm md:text-base font-semibold text-purple-200">
              ស្ទូឌីយោតុក្កតា AI សម្រាប់ការប្រើប្រាស់ផ្ទាល់ខ្លួន
            </p>
            <p className="text-xs text-slate-400">
              Create Amazing Cartoon Videos with AI
            </p>
          </div>

          {/* Feature Badges Row */}
          <div className="pt-2 flex flex-wrap gap-2">
            {featureBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1c1d3b]/90 border border-purple-500/30 text-[11px] text-purple-200 font-medium backdrop-blur-sm shadow-sm"
                >
                  <Icon className="w-3 h-3 text-purple-400" />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side 3D Cartoon Art Illustration */}
        <div className="relative flex-shrink-0 w-64 md:w-80 h-28 md:h-32 rounded-xl overflow-hidden border border-purple-500/30 shadow-lg">
          <img
            src="/assets/hero_art.jpg"
            alt="3D Animated Cartoon Characters"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // Fallback to reference banner image if sub-asset is missing
              (e.target as HTMLImageElement).src = '/reference_ui.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17133b]/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
