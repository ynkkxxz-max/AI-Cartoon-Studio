import React from 'react';
import {
  LayoutDashboard,
  Film,
  Video,
  FolderKanban,
  Users,
  Mic,
  Layers,
  Settings,
  HardDrive,
  Crown
} from 'lucide-react';
import type { SystemStatus } from '../services/api';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  systemStatus: SystemStatus | null;
  onOpenProjects: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, systemStatus, onOpenProjects }) => {
  const navItems = [
    { id: 'dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'create_cartoon', labelKh: 'បង្កើតតុក្កតា', labelEn: 'Create Cartoon', icon: Film },
    { id: 'video_editor', labelKh: 'កែវីដេអូ AI', labelEn: 'AI Video Editor', icon: Video },
    { id: 'my_projects', labelKh: 'គម្រោងរបស់ខ្ញុំ', labelEn: 'My Projects', icon: FolderKanban, action: onOpenProjects },
    { id: 'characters', labelKh: 'តួអង្គ', labelEn: 'Characters', icon: Users },
    { id: 'voices', labelKh: 'សំឡេង AI', labelEn: 'AI Voices', icon: Mic },
    { id: 'assets', labelKh: 'ប្លង់/ទ្រព្យសកម្ម', labelEn: 'Scenes / Assets', icon: Layers },
    { id: 'settings', labelKh: 'ការកំណត់', labelEn: 'Settings', icon: Settings },
  ];

  const storageUsed = systemStatus ? systemStatus.storage_used_gb : 98;
  const storageTotal = systemStatus ? systemStatus.storage_total_gb : 250;
  const storagePct = systemStatus ? systemStatus.storage_pct : 39;

  return (
    <aside className="w-56 bg-[#0c0d1e] border-r border-[#1f2343] flex flex-col justify-between p-3 select-none flex-shrink-0">
      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'video_editor') {
                  window.location.assign('/clip-editor.html');
                } else if (item.action) {
                  item.action();
                } else {
                  setActiveView(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/50 font-bold border border-purple-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold leading-tight truncate">{item.labelKh}</span>
                <span className={`text-[10px] leading-tight truncate font-normal ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                  {item.labelEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Storage & Edition Card */}
      <div className="pt-3 space-y-2.5 border-t border-[#1f2343]/80">
        <div className="bg-[#121429] rounded-xl p-3 border border-[#23274c]">
          <div className="flex items-center justify-between text-xs text-slate-200 mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-xs">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              ការផ្ទុក (Storage)
            </span>
          </div>

          <div className="text-[11px] text-slate-300 mb-1.5 flex justify-between font-mono">
            <span>{storageUsed} GB / {storageTotal} GB</span>
            <span className="text-purple-300 font-bold">{storagePct}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#090a16] rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(storagePct, 100)}%` }}
            />
          </div>
        </div>

        {/* Edition Pill */}
        <div className="bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-purple-200 shadow-inner">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wider">Personal Edition</span>
        </div>
      </div>
    </aside>
  );
};
