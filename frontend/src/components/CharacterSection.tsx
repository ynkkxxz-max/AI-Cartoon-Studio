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
  const getAvatar = (char: Character, idx: number) => {
    if (char.avatar_url && char.avatar_url.includes('face_')) return char.avatar_url;
    if (char.id === 'char_boy' || idx === 0) return '/characters/face_boy.png';
    if (char.id === 'char_girl' || idx === 1) return '/characters/face_girl.png';
    if (char.id === 'char_man' || idx === 2) return '/characters/face_man.png';
    if (char.id === 'char_old' || idx === 3) return '/characters/face_old.png';
    return '/characters/face_boy.png';
  };

  const displayChars = characters.slice(0, 4);

  return (
    <div className="bg-[#111327] rounded-2xl border border-[#1f2343] p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#1f2343]/80">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            តួអង្គ
            <span className="text-[11px] font-normal text-slate-400">(Characters)</span>
          </h3>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600/30 text-purple-200 hover:bg-purple-600/40 border border-purple-500/40 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>បន្ថែមតួអង្គ Add Character</span>
        </button>
      </div>

      {/* Avatars Row matching exact mockup */}
      <div className="pt-3 flex items-center justify-between gap-2.5 overflow-x-auto">
        {displayChars.map((char, idx) => {
          const isSelected = selectedCharacters.includes(char.id);
          const avatarSrc = getAvatar(char, idx);

          return (
            <div
              key={char.id}
              className="flex flex-col items-center flex-1 cursor-pointer group"
              onClick={() => onToggleSelect(char.id)}
            >
              <div
                className={`relative w-13 h-13 md:w-14 md:h-14 rounded-full p-[2px] transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-900/60 scale-105'
                    : 'hover:ring-1 hover:ring-purple-400/50'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#181a32] flex items-center justify-center border border-purple-400/30">
                  <img
                    src={avatarSrc}
                    alt={char.name_en}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Voice Audition Quick Button */}
                <button
                  type="button"
                  title="ស្តាប់សំឡេង Audition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAuditionVoice(char);
                  }}
                  className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110"
                >
                  <Volume2 className="w-2.5 h-2.5" />
                </button>
              </div>

              <span className="text-[11px] font-bold text-slate-100 mt-1.5 truncate max-w-[65px] text-center leading-tight">
                {char.name_kh}
              </span>
              <span className="text-[9.5px] text-slate-400 truncate max-w-[65px] text-center font-medium leading-tight">
                {char.name_en}
              </span>
            </div>
          );
        })}

        {/* Add Character button */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center flex-1 group cursor-pointer"
        >
          <div className="w-13 h-13 md:w-14 md:h-14 rounded-full border-2 border-dashed border-slate-600 hover:border-purple-400 bg-[#0c0d1e] flex items-center justify-center text-slate-400 hover:text-purple-300 transition-all">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 mt-1.5 leading-tight">បន្ថែម</span>
          <span className="text-[9.5px] text-slate-500 font-medium leading-tight">Add</span>
        </button>
      </div>
    </div>
  );
};
