import React, { useState } from 'react';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import type { Character } from '../services/api';

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterAdded: (char: Character) => void;
}

export const AddCharacterModal: React.FC<AddCharacterModalProps> = ({ isOpen, onClose, onCharacterAdded }) => {
  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('child');
  const [voice, setVoice] = useState('km-KH-PisethNeural');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKh.trim() || !nameEn.trim()) {
      alert("សូមបញ្ចូលឈ្មោះតួអង្គទាំងភាសាខ្មែរ និងអង់គ្លេស!");
      return;
    }

    setSubmitting(true);
    try {
      const newChar = await api.addCharacter({
        name_kh: nameKh,
        name_en: nameEn,
        category,
        default_voice: voice,
        description,
        avatar_url: '/characters/boy.png'
      });
      onCharacterAdded(newChar);
      onClose();
    } catch (err: any) {
      alert(`កំហុសក្នុងការបន្ថែមតួអង្គ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-studio-card border border-studio-cardBorder rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-studio-cardBorder flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-sm">
              បន្ថែមតួអង្គថ្មី (Add New Character)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              ឈ្មោះជាភាសាខ្មែរ (Khmer Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nameKh}
              onChange={(e) => setNameKh(e.target.value)}
              placeholder="ឧទាហរណ៍: ពិសិដ្ឋ ឬ កុមារីសោភា"
              className="w-full bg-[#0d0e1c] border border-studio-cardBorder rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              ឈ្មោះជាភាសាអង់គ្លេស (English Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Brave Alex or Princess Maya"
              className="w-full bg-[#0d0e1c] border border-studio-cardBorder rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                ប្រភេទ / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0d0e1c] border border-studio-cardBorder rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="child">ក្មេង (Child)</option>
                <option value="adult">ពេញវ័យ (Adult)</option>
                <option value="elder">មនុស្សចាស់ (Elder)</option>
                <option value="animal">សត្វ (Animal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                សំឡេង / Default Voice
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-[#0d0e1c] border border-studio-cardBorder rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="km-KH-PisethNeural">Piseth (Khmer Male)</option>
                <option value="km-KH-SreymomNeural">Sreymom (Khmer Female)</option>
                <option value="en-US-AnaNeural">Ana (English Child)</option>
                <option value="en-US-ChristopherNeural">Christopher (EN Adult)</option>
                <option value="zh-CN-XiaoxiaoNeural">Xiaoxiao (Chinese)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              ការពិពណ៌នា / Character Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="លក្ខណៈសម្បត្តិ និងចរិតលក្ខណៈរបស់តួអង្គ..."
              className="w-full bg-[#0d0e1c] border border-studio-cardBorder rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
            >
              បោះបង់ Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 hover:from-purple-500 hover:to-indigo-500 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
