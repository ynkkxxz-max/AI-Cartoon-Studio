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
    <aside className="w-52 bg-studio-sidebar border-r border-studio-cardBorder flex flex-col justify-between p-2.5 select-none flex-shrink-0">
      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setActiveView(item.id);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-900/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-tight truncate">{item.labelKh}</span>
                <span className={`text-[10px] leading-tight truncate ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
                  {item.labelEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Storage & Edition Card */}
      <div className="pt-3 space-y-2 border-t border-studio-cardBorder/60">
        <div className="bg-[#121424] rounded-xl p-2.5 border border-studio-cardBorder/80">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              ការផ្ទុក (Storage)
            </span>
          </div>

          <div className="text-[10px] text-slate-400 mb-1 flex justify-between font-mono">
            <span>{storageUsed} GB / {storageTotal} GB</span>
            <span className="text-purple-400 font-semibold">{storagePct}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(storagePct, 100)}%` }}
            />
          </div>
        </div>

        {/* Edition Pill */}
        <div className="bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/40 rounded-xl p-2 flex items-center justify-center gap-1.5 text-purple-300 shadow-inner">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wide">Personal Edition</span>
        </div>
      </div>
    </aside>
  );
};
