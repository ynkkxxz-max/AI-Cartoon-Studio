import { useEffect, useRef } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import type { Character } from '../services/api';

interface Props {
  character: Character;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCharacterDialog({ character, busy, error, onCancel, onConfirm }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); else document.querySelector<HTMLButtonElement>('.workspace-nav-item[aria-current="page"]')?.focus(); };
  }, []);
  return <div className="character-dialog-backdrop" onClick={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <div ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-character-title" aria-describedby="delete-character-description" className="character-dialog" onKeyDown={event => {
      if (event.key === 'Escape' && !busy) onCancel();
      if (event.key === 'Tab') {
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
        if (!buttons.length) { event.preventDefault(); return; }
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <span className="delete-dialog-icon"><Trash2 size={23} /></span>
      <h2 id="delete-character-title">លុបតួអង្គនេះ?</h2>
      <p id="delete-character-description"><strong>{character.name_kh || character.name_en}</strong> នឹងត្រូវដកចេញពីបណ្ណាល័យ។ គម្រោងដែលបានរក្សាទុកពីមុននៅដដែល ហើយអ្នកអាចចុច Undo ដើម្បីស្ដារវិញបាន។</p>
      {error && <p className="delete-dialog-error" role="alert">{error}</p>}
      <div className="delete-dialog-actions"><button ref={cancel} className="studio-button secondary" disabled={busy} onClick={onCancel}>បោះបង់ / Cancel</button><button className="studio-button danger" disabled={busy} onClick={onConfirm}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}{busy ? 'កំពុងលុប…' : 'លុបតួអង្គ / Delete'}</button></div>
    </div>
  </div>;
}
