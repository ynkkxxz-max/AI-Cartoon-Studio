import React from 'react';
import { Clapperboard, Bell, User, Sparkles, FolderKanban, Wrench, Home } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projectCount: number;
  onOpenProjects: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, projectCount, onOpenProjects }) => {
  return (
    <header className="h-13 border-b border-studio-cardBorder bg-[#0e1020]/95 backdrop-blur-md px-4 py-2 flex items-center justify-between sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-500/20">
          <div className="w-full h-full bg-[#0e101f] rounded-[6px] flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-purple-400" />
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-xs tracking-wide text-white flex items-center gap-1.5">
            AI Cartoon Studio
            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Personal
            </span>
          </span>
          <span className="text-[9px] text-slate-400">Personal Edition</span>
        </div>
      </div>

      {/* Top Nav Pills */}
      <nav className="flex items-center gap-1 bg-[#121426] p-1 rounded-xl border border-studio-cardBorder">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-purple-200 border border-purple-500/60 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-purple-400" />
          <span>ផ្ទាំងគ្រប់គ្រង</span>
          <span className="text-[10px] opacity-75">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-purple-200 border border-purple-500/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>បង្កើត</span>
          <span className="text-[10px] opacity-75">Create</span>
        </button>

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        >
          <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
          <span>គម្រោងរបស់ខ្ញុំ</span>
          <span className="text-[10px] opacity-75">My Projects</span>
          {projectCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[9px] bg-purple-500/40 text-purple-200 rounded-full font-bold">
              {projectCount}
            </span>
          )}
        </button>

        <button
          onClick={() => alert("ឧបករណ៍ AI (AI Tools): Voice Cloner, Script AI, Character Consistency Model នឹងត្រូវបានបន្ថែមនៅ Phase 4")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        >
          <Wrench className="w-3.5 h-3.5 text-slate-400" />
          <span>ឧបករណ៍ AI</span>
          <span className="text-[10px] opacity-75">AI Tools</span>
        </button>
      </nav>

      {/* Right User Actions */}
      <div className="flex items-center gap-2.5">
        <button
          title="ការជូនដំណឹង Notifications"
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0c0d19]" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-studio-cardBorder">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-[#141628] rounded-full flex items-center justify-center text-purple-300">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[11px] font-semibold text-slate-200 leading-tight">គណនីផ្ទាល់ខ្លួន</span>
            <span className="text-[9px] text-slate-400 leading-tight">My Account</span>
          </div>
        </div>
      </div>
    </header>
  );
};
