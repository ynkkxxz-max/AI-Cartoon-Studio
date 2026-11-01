import React from 'react';
import { Clapperboard, Bell, User, Sparkles, FolderKanban, Wrench, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projectCount: number;
  onOpenProjects: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, projectCount, onOpenProjects }) => {
  return (
    <header className="h-14 border-b border-[#1f2343] bg-[#0c0d1e]/98 px-5 flex items-center justify-between sticky top-0 z-50 shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-600/30">
          <div className="w-full h-full bg-[#0d0f24] rounded-[10px] flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5 leading-tight">
            AI Cartoon Studio
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-purple-500/25 text-purple-300 border border-purple-500/40">
              Personal
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal leading-tight">Personal Edition</span>
        </div>
      </div>

      {/* Top Nav Pills matching exact reference */}
      <nav className="flex items-center gap-1.5 bg-[#12142a] p-1 rounded-xl border border-[#23274c]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white border border-purple-400/50 shadow-md shadow-purple-900/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>ផ្ទាំងគ្រប់គ្រង</span>
          <span className="text-[11px] opacity-80 font-normal">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white border border-purple-400/50 shadow-md shadow-purple-900/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>បង្កើត</span>
          <span className="text-[11px] opacity-80 font-normal">Create</span>
        </button>

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
          <span>គម្រោងរបស់ខ្ញុំ</span>
          <span className="text-[11px] opacity-80 font-normal">My Projects</span>
          {projectCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-purple-500/40 text-purple-200 rounded-full font-bold">
              {projectCount}
            </span>
          )}
        </button>

        <button
          onClick={() => alert("ឧបករណ៍ AI (AI Tools): Voice Cloner, Script AI, Character Consistency Model នឹងត្រូវបានបន្ថែមនៅ Phase 4")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <Wrench className="w-3.5 h-3.5 text-slate-400" />
          <span>ឧបករណ៍ AI</span>
          <span className="text-[11px] opacity-80 font-normal">AI Tools</span>
        </button>
      </nav>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        <button
          title="ការជូនដំណឹង Notifications"
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-[#23274c]"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0c0d1e]" />
        </button>

        <div className="flex items-center gap-2.5 pl-2.5 border-l border-[#1f2343]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[1.5px] flex items-center justify-center">
            <div className="w-full h-full bg-[#12142a] rounded-full flex items-center justify-center text-purple-300">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight">គណនីផ្ទាល់ខ្លួន</span>
            <span className="text-[10px] text-slate-400 leading-tight">My Account</span>
          </div>
        </div>
      </div>
    </header>
  );
};
