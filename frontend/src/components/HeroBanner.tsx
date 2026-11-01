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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171442] via-[#161a49] to-[#11132e] border border-purple-500/30 shadow-xl flex items-center justify-between min-h-[110px]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Left text column */}
      <div className="relative z-10 p-4 lg:p-5 text-left max-w-xl">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
          AI Cartoon Studio
        </h1>

        <div className="mt-1 space-y-0.5">
          <p className="text-sm font-bold text-purple-200">
            ស្ទូឌីយោតុក្កតា AI សម្រាប់ការប្រើប្រាស់ផ្ទាល់ខ្លួន
          </p>
          <p className="text-xs text-slate-400 font-normal">
            Create Amazing Cartoon Videos with AI
          </p>
        </div>

        {/* Feature Badges Row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {featureBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1f2249]/90 border border-purple-500/40 text-[11px] text-purple-200 font-semibold backdrop-blur-sm shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-purple-400" />
                <span>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side wide 3D panoramic illustration matching mockup */}
      <div className="relative hidden md:block h-[115px] w-[500px] flex-shrink-0 overflow-hidden">
        <img
          src="/assets/hero_panoramic.jpg"
          alt="3D Animated Cartoon Characters and Castle"
          className="w-full h-full object-cover object-right"
        />
        {/* Soft gradient fade on the left edge */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#161a49] via-[#161a49]/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
