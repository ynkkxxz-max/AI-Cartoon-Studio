import React, { useState } from 'react';
import { Film, Camera, Edit3, Check, LoaderCircle } from 'lucide-react';
import { api } from '../services/api';
import type { StoryScript, StoryScene } from '../services/api';

interface StoryScriptViewerProps {
  script: StoryScript;
  onScriptUpdated: (updated: StoryScript) => void;
}

export const StoryScriptViewer: React.FC<StoryScriptViewerProps> = ({ script, onScriptUpdated }) => {
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<'km' | 'en' | 'zh'>('km');
  const [editKm, setEditKm] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editZh, setEditZh] = useState('');
  const [editCamera, setEditCamera] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const startEdit = (scene: StoryScene) => {
    setEditingScene(scene.scene_number);
    setEditKm(scene.dialogue.km);
    setEditEn(scene.dialogue.en);
    setEditZh(scene.dialogue.zh);
    setEditCamera(scene.camera_shot);
    setStatusMessage('');
  };

  const saveEdit = async (sceneNumber: number) => {
    setIsSaving(true);
    setStatusMessage('');
    try {
      const updated = await api.updateScene(script.project_id, sceneNumber, {
        camera_shot: editCamera,
        dialogue: {
          km: editKm,
          en: editEn,
          zh: editZh
        }
      });
      onScriptUpdated(updated);
      setEditingScene(null);
      setStatusMessage(`បានកែសម្រួលប្លង់ទី ${sceneNumber} ដោយជោគជ័យ (v${updated.version})!`);
    } catch (err: any) {
      alert(`កំហុសក្នុងការកែសម្រួល: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-[#0d0e21] p-3.5 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#252849] pb-2.5">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white">
            {script.title}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30">
            {script.genre} • {script.scene_count} ប្លង់ (Scenes) • v{script.version}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Provider: {script.provider_used}
          </span>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center rounded-lg border border-[#252849] bg-[#14162e] p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveLang('km')}
            className={`px-2 py-1 rounded font-semibold transition ${
              activeLang === 'km' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇰🇭 ខ្មែរ (KM)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`px-2 py-1 rounded font-semibold transition ${
              activeLang === 'en' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇺🇸 English (EN)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('zh')}
            className={`px-2 py-1 rounded font-semibold transition ${
              activeLang === 'zh' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇨🇳 中文 (ZH)
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
          {statusMessage}
        </div>
      )}

      {/* Synopsis */}
      {script.synopsis && (
        <p className="text-[11px] text-slate-300 italic leading-relaxed bg-[#11132a] p-2 rounded-lg border border-[#1f2244]">
          "{script.synopsis}"
        </p>
      )}

      {/* Scenes List */}
      <div className="space-y-2.5">
        {script.scenes.map((scene) => {
          const isCurrentEditing = editingScene === scene.scene_number;
          return (
            <div
              key={scene.scene_number}
              className="rounded-lg border border-[#24274c] bg-[#11132a] p-3 space-y-2 text-xs"
            >
              {/* Scene top bar */}
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-400">
                    ប្លង់ #{scene.scene_number}: {scene.location}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Camera className="w-3 h-3 text-cyan-400" />
                    {scene.camera_shot}
                  </span>
                </div>

                {!isCurrentEditing ? (
                  <button
                    type="button"
                    onClick={() => startEdit(scene)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-purple-300 hover:text-purple-200 hover:bg-purple-900/30 border border-purple-500/20"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>កែសម្រួល / Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => saveEdit(scene.scene_number)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                    >
                      {isSaving ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>រក្សាទុក / Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingScene(null)}
                      className="px-2 py-1 rounded text-slate-400 hover:text-white text-[10px]"
                    >
                      បោះបង់ / Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Visual Prompt description */}
              <div className="p-2 rounded bg-[#0b0c1b] border border-[#1d203f] text-[10px] text-slate-400 leading-relaxed font-mono">
                <span className="text-purple-300 font-bold block mb-0.5">🎨 3D Visual Rendering Prompt:</span>
                {scene.visual_prompt}
              </div>

              {/* Dialogue Box */}
              {!isCurrentEditing ? (
                <div className="p-2.5 rounded bg-purple-950/20 border border-purple-500/20 text-slate-200 leading-relaxed">
                  <span className="text-[10px] text-purple-400 font-bold block mb-0.5">
                    {activeLang === 'km' && '🇰🇭 សន្ទនាភាសាខ្មែរ (Khmer Dialogue):'}
                    {activeLang === 'en' && '🇺🇸 English Dialogue:'}
                    {activeLang === 'zh' && '🇨🇳 中文台词 (Chinese Dialogue):'}
                  </span>
                  <p className="text-[11.5px] font-medium text-slate-100">
                    {scene.dialogue[activeLang] || <span className="text-slate-500 italic">No dialogue</span>}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1 border-t border-[#1e2246]">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold">Camera Shot Style:</label>
                    <input
                      type="text"
                      value={editCamera}
                      onChange={(e) => setEditCamera(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded bg-[#0b0c1b] border border-[#2b2e55] text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-purple-300 font-bold">🇰🇭 សន្ទនាខ្មែរ (Khmer):</label>
                    <textarea
                      rows={2}
                      value={editKm}
                      onChange={(e) => setEditKm(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded bg-[#0b0c1b] border border-[#2b2e55] text-white text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cyan-300 font-bold">🇺🇸 English Dialogue:</label>
                    <textarea
                      rows={2}
                      value={editEn}
                      onChange={(e) => setEditEn(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded bg-[#0b0c1b] border border-[#2b2e55] text-white text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-300 font-bold">🇨🇳 中文台词 (Chinese):</label>
                    <textarea
                      rows={2}
                      value={editZh}
                      onChange={(e) => setEditZh(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded bg-[#0b0c1b] border border-[#2b2e55] text-white text-xs resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Characters tags */}
              {scene.characters && scene.characters.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                  <span className="font-semibold text-slate-500">តួអង្គក្នុងប្លង់ (Characters):</span>
                  {scene.characters.map((cid) => (
                    <span key={cid} className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20 font-mono">
                      {cid}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
