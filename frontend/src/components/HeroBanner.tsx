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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17133f] via-[#151944] to-[#12132d] border border-purple-500/30 shadow-xl flex items-center justify-between min-h-[105px]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Left text column */}
      <div className="relative z-10 p-4 lg:p-5 text-left max-w-xl">
        <h1 className="text-2xl lg:text-[26px] font-extrabold text-white tracking-tight leading-tight">
          AI Cartoon Studio
        </h1>

        <div className="mt-0.5 space-y-0.5">
          <p className="text-sm font-semibold text-purple-200">
            ស្ទូឌីយោតុក្កតា AI សម្រាប់ការប្រើប្រាស់ផ្ទាល់ខ្លួន
          </p>
          <p className="text-[11px] text-slate-400 font-normal">
            Create Amazing Cartoon Videos with AI
          </p>
        </div>

        {/* Feature Badges Row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {featureBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e2040]/90 border border-purple-500/40 text-[10px] text-purple-200 font-semibold backdrop-blur-sm shadow-sm"
              >
                <Icon className="w-3 h-3 text-purple-400" />
                <span>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side wide 3D panoramic illustration matching mockup */}
      <div className="relative hidden md:block h-[110px] w-[450px] flex-shrink-0 overflow-hidden">
        <img
          src="/assets/hero_panoramic.jpg"
          alt="3D Animated Cartoon Characters and Castle"
          className="w-full h-full object-cover object-right"
        />
        {/* Soft gradient fade on the left edge to blend seamlessly into background */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#151944] to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
