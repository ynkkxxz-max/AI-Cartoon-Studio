import { useEffect, useRef, useState } from 'react';
import { Check, Maximize2, Plus, Trash2, Users, Volume2, X } from 'lucide-react';
import type { Character } from '../services/api';

interface CharacterSectionProps {
  characters: Character[];
  selectedCharacters: string[];
  onToggleSelect: (id: string) => void;
  onOpenAddModal: () => void;
  onAuditionVoice: (char: Character) => void;
  onDelete: (char: Character) => void;
  deletionDisabled?: boolean;
}

const defaultArt: Record<string, number> = { char_boy: 0, char_girl: 1, char_man: 2, char_old: 3, char_monkey: 4 };

function CharacterArtwork({ character }: { character: Character }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [character.avatar_url]);
  const index = defaultArt[character.id];
  if (index !== undefined) return <span role="img" aria-label={character.name_en} className={`character-sprite character-sprite-${index}`} style={{ backgroundPosition: `${index * 25}% center` }} />;
  if (character.avatar_url && !failed) return <img src={character.avatar_url} alt={character.name_en} onError={() => setFailed(true)} className="character-custom-image" />;
  return <span role="img" aria-label={character.name_en} className="character-art-placeholder">{character.category === 'animal' ? '🐒' : character.name_en.trim().slice(0, 2).toUpperCase()}</span>;
}

function CharacterImagePreview({ character, onClose }: { character: Character; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="character-preview-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="character-preview-name" className="character-preview-dialog" onKeyDown={event => { if (event.key === 'Escape') onClose(); if (event.key === 'Tab') { event.preventDefault(); close.current?.focus(); } }}>
      <header><div><h2 id="character-preview-name">{character.name_kh || character.name_en}</h2><span>{character.name_en}</span></div><button ref={close} type="button" className="icon-button" aria-label="បិទរូបធំ / Close image preview" onClick={onClose}><X size={22} /></button></header>
      <div className="character-preview-stage"><CharacterArtwork character={character} /></div>
      <p>មើលរូបពេញ / Full character view <span>Esc to close</span></p>
    </div>
  </div>;
}

export function CharacterSection({ characters, selectedCharacters, onToggleSelect, onOpenAddModal, onAuditionVoice, onDelete, deletionDisabled = false }: CharacterSectionProps) {
  const [preview, setPreview] = useState<Character | null>(null);
  return <section className="studio-card character-library-card" aria-label="តួអង្គ Characters">
    <div className="character-library-heading"><div><h2><Users size={17} />តួអង្គ <small>Characters</small></h2><p>រូបពេញខ្លួន · ចុចរូបដើម្បីពង្រីក / Click a character to enlarge</p></div><button type="button" className="studio-button secondary" onClick={onOpenAddModal}><Plus size={15} /> បន្ថែម / Add</button></div>
    <div className="character-grid character-card-grid">
      {characters.map(character => {
        const selected = selectedCharacters.includes(character.id);
        return <article key={character.id} className={`character-card ${selected ? 'is-selected' : ''}`}>
          <button type="button" className="character-visual" aria-label={`ពង្រីករូប / Enlarge ${character.name_en}`} onClick={() => setPreview(character)}>
            <CharacterArtwork character={character} /><span className="character-expand"><Maximize2 size={15} />ពង្រីក</span>
          </button>
          <div className="character-card-info"><h3>{character.name_kh || character.name_en}</h3><p>{character.name_en}</p></div>
          <div className="character-card-actions"><button type="button" className={`character-select ${selected ? 'is-selected' : ''}`} aria-label={`ជ្រើសតួអង្គ ${character.name_en}`} aria-pressed={selected} onClick={() => onToggleSelect(character.id)}><Check size={13} /><span>{selected ? 'បានជ្រើស' : 'ជ្រើស'}</span></button><button type="button" className="character-action-icon" aria-label={`ស្តាប់សំឡេង ${character.name_en}`} title="ស្តាប់សំឡេង / Audition voice" onClick={() => onAuditionVoice(character)}><Volume2 size={15} /></button><button type="button" className="character-delete" disabled={deletionDisabled} aria-label={`លុបតួអង្គ / Delete ${character.name_en}`} title="លុប / Delete" onClick={() => onDelete(character)}><Trash2 size={14} /><span className="character-delete-label">លុប</span></button></div>
        </article>;
      })}
      <button type="button" onClick={onOpenAddModal} className="character-add-card" aria-label="បន្ថែមតួអង្គ / Add character"><span><Plus size={26} /></span><strong>បន្ថែមតួអង្គ</strong><small>Add your own character</small></button>
    </div>
    {preview && <CharacterImagePreview character={preview} onClose={() => setPreview(null)} />}
  </section>;
}
