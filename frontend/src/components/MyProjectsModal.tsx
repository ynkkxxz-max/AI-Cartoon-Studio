import React, { useEffect, useState } from 'react';
import { X, FolderKanban, Calendar, Clock, Film } from 'lucide-react';
import { api } from '../services/api';
import type { Project } from '../services/api';

interface MyProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (p: Project) => void;
}

export const MyProjectsModal: React.FC<MyProjectsModalProps> = ({ isOpen, onClose, onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-studio-card border border-studio-cardBorder rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-studio-cardBorder flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-sm">
              គម្រោងរបស់ខ្ញុំ (My Saved Projects)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project List */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">កំពុងទាញយកទិន្នន័យ...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Film className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              មិនទាន់មានគម្រោងត្រូវបានរក្សាទុកនៅឡើយទេ (No saved projects yet).
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="p-3 rounded-xl bg-[#0e101f] border border-studio-cardBorder hover:border-purple-500/40 flex items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1 text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white truncate">{proj.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {proj.story_prompt || "No prompt description"}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {proj.duration_preset}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                    <span>🌐 {proj.languages?.join(', ').toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectProject(proj);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                  >
                    បើក Open
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
