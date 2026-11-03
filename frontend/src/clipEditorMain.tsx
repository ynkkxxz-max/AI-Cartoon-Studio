import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Clapperboard } from 'lucide-react';
import { ClipTimelineEditor } from './components/ClipTimelineEditor';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="min-h-screen bg-[#090a16] text-slate-100 font-sans">
      <header className="border-b border-[#292b50] bg-[#0c0d1e]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3"><Clapperboard className="h-7 w-7 text-purple-400" /><div><h1 className="text-base font-bold">AI Cartoon Studio</h1><p className="text-xs text-slate-400">កាត់តវីដេអូ / Personal Clip Editor</p></div></div>
          <a href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#35385d] px-3 py-2 text-xs text-slate-200 hover:bg-purple-900/30"><ArrowLeft className="h-4 w-4" /> ត្រឡប់ផ្ទាំងគ្រប់គ្រង / Dashboard</a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6"><ClipTimelineEditor /></main>
    </div>
  </StrictMode>,
);
