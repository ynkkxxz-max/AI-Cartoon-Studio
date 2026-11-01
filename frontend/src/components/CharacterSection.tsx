import React from 'react';
import { Users, Plus, Volume2 } from 'lucide-react';
import type { Character } from '../services/api';

interface CharacterSectionProps {
  characters: Character[];
  selectedCharacters: string[];
  onToggleSelect: (id: string) => void;
  onOpenAddModal: () => void;
  onAuditionVoice: (char: Character) => void;
}

export const CharacterSection: React.FC<CharacterSectionProps> = ({
  characters,
  selectedCharacters,
  onToggleSelect,
  onOpenAddModal,
  onAuditionVoice
}) => {
  return (
    <div className="bg-studio-card rounded-2xl border border-studio-cardBorder p-3.5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-studio-cardBorder/60">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            តួអង្គ
            <span className="text-[11px] font-normal text-slate-400">(Characters)</span>
          </h3>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition-all"
        >
          <Plus className="w-3 h-3" />
          <span>បន្ថែមតួអង្គ Add Character</span>
        </button>
      </div>

      {/* Avatars Row */}
      <div className="pt-2.5 flex items-center gap-3 overflow-x-auto pb-1">
        {characters.map((char) => {
          const isSelected = selectedCharacters.includes(char.id);
          return (
            <div
              key={char.id}
              className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
              onClick={() => onToggleSelect(char.id)}
            >
              <div
                className={`relative w-14 h-14 rounded-2xl p-[2px] transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 shadow-lg shadow-purple-900/50 scale-105'
                    : 'bg-[#181a30] hover:bg-purple-900/40 border border-studio-cardBorder'
                }`}
              >
                <div className="w-full h-full bg-[#121426] rounded-[14px] overflow-hidden flex items-center justify-center">
                  <img
                    src={char.avatar_url || '/characters/boy.png'}
                    alt={char.name_en}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/characters/boy.png';
                    }}
                  />
                </div>

                {/* Audio Audition Quick Pill */}
                <button
                  type="button"
                  title="ស្តាប់សំឡេង Audition Voice"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAuditionVoice(char);
                  }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-md"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>

              <span className="text-[10px] font-semibold text-slate-200 mt-1 max-w-[65px] truncate text-center">
                {char.name_kh}
              </span>
              <span className="text-[9px] text-slate-400 max-w-[65px] truncate text-center">
                {char.name_en}
              </span>
            </div>
          );
        })}

        {/* Add Character Card */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-studio-cardBorder hover:border-purple-500/60 bg-[#0e101f] flex items-center justify-center text-slate-400 hover:text-purple-300 transition-all">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">បន្ថែម</span>
          <span className="text-[9px] text-slate-500">Add</span>
        </button>
      </div>
    </div>
  );
};
