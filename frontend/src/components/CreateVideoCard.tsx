import React, { useState } from 'react';
import { Sparkles, Video, Film, Clock, Monitor, Palette, Check, LoaderCircle } from 'lucide-react';
import { api } from '../services/api';
import type { StoryScript } from '../services/api';
import { StoryScriptViewer } from './StoryScriptViewer';

interface CreateVideoCardProps {
  onProjectCreated: (project: any) => void;
  onSwitchToEditor: () => void;
  selectedCharacters: string[];
}

export const CreateVideoCard: React.FC<CreateVideoCardProps> = ({ onProjectCreated, onSwitchToEditor, selectedCharacters }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'editor'>('create');
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [duration, setDuration] = useState('5-20 minutes');
  const [resolution, setResolution] = useState('1080p');
  const [style, setStyle] = useState('3D Cartoon (Pixar-like)');
  const [languages, setLanguages] = useState<Record<string, boolean>>({ km: true, en: true, zh: true });
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [generatedScript, setGeneratedScript] = useState<StoryScript | null>(null);

  const handleGenerate = async () => {
    setFeedback('');
    setError('');
    if (!prompt.trim()) { setError('សូមបញ្ចូលគំនិតរឿងរបស់អ្នក។ / Enter your story idea.'); return; }
    const selectedLangs = Object.keys(languages).filter(key => languages[key]);
    if (!selectedLangs.length) { setError('សូមជ្រើសរើសយ៉ាងហោចណាស់ភាសាមួយ។ / Select at least one language.'); return; }
    setIsGenerating(true);
    try {
      const script = await api.generateStory({
        prompt,
        genre: style,
        target_duration: duration,
        style,
        languages: selectedLangs,
        characters: selectedCharacters
      });
      setGeneratedScript(script);
      onProjectCreated({
        id: script.project_id,
        name: projectName.trim() || script.title,
        story_prompt: prompt,
        duration_preset: duration,
        resolution,
        style,
        languages: selectedLangs,
        selected_characters: selectedCharacters,
        pipeline_step: 2
      });
      setFeedback(`🎉 បានបង្កើតសាច់រឿង 3D និងប្លង់រឿង (${script.scene_count} Scenes) ដោយជោគជ័យ!`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'ការបង្កើតមិនបានសម្រេច។ / Could not generate the story.');
    } finally {
      setIsGenerating(false);
    }
  };

  const languageItems = [{ id: 'km', kh: 'ខ្មែរ', en: 'Khmer', flag: 'flag_kh.png' }, { id: 'en', kh: 'អង់គ្លេស', en: 'English', flag: 'flag_us.png' }, { id: 'zh', kh: 'ចិន', en: 'Chinese', flag: 'flag_cn.png' }];
  const fieldLabel = 'mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-400';
  const selectClass = 'studio-input h-[32px] w-full min-w-0 rounded-lg border border-[#2d2d49] bg-[#17182c] px-2 text-[11px] text-slate-200 outline-none focus:border-purple-400';

  return (
    <div className="space-y-4">
      <section aria-label="Create a story draft" className="studio-card create-story-card min-w-0 rounded-xl border border-[#292940] bg-[#121324] p-3.5">
        <div className="studio-panel-heading mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#292940] pb-2.5">
          <h2 className="flex items-center gap-2 text-[12px] font-semibold text-slate-100">
            <Film className="h-4 w-4 text-purple-400" /> បង្កើតរឿងថ្មី <span className="text-[10px] font-normal text-slate-500">New story</span>
          </h2>
          <div className="flex items-center rounded-lg border border-[#2c2c47] bg-[#0c0d1c] p-0.5">
            <button type="button" onClick={() => setActiveTab('create')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium ${activeTab === 'create' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
              <Sparkles className="h-3 w-3" />សាច់រឿង / Story
            </button>
            <button type="button" onClick={() => { setActiveTab('editor'); onSwitchToEditor(); }} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium ${activeTab === 'editor' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Video className="h-3 w-3" />កែវីដេអូ / Edit
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="studio-project-name" className="mb-1.5 block text-[11px] font-semibold text-slate-200">
              ឈ្មោះគម្រោង <span className="font-normal text-slate-500">/ Project name</span>
            </label>
            <input id="studio-project-name" maxLength={120} value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="ឈ្មោះរឿងរបស់អ្នក…" className="studio-input h-[40px] w-full rounded-lg border border-[#2b2b46] bg-[#0d1626] px-3 text-[12px] text-slate-200" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="studio-story-prompt" className="text-[11px] font-semibold text-slate-200">
                គំនិតរឿង <span className="font-normal text-slate-500">/ Story prompt</span><span className="ml-1 text-purple-400">*</span>
              </label>
              <button type="button" onClick={() => setPrompt('ដំណើរផ្សងព្រេងរបស់ក្មេងប្រុសក្លាហាន និងសត្វស្វាមន្តអាគមនៅក្នុងព្រៃអច្ឆរិយៈ ដើម្បីស្វែងរកប្រាសាទពេជ្រអណ្តែតលើអាកាស')} className="text-[10px] font-medium text-purple-300 hover:text-purple-200">
                + ឧទាហរណ៍ / Example
              </button>
            </div>
            <div className="relative">
              <textarea id="studio-story-prompt" value={prompt} onChange={event => { setPrompt(event.target.value.slice(0, 2000)); setError(''); setFeedback(''); }} placeholder="សរសេរគំនិតរឿង ឬដំណើរផ្សងព្រេងរបស់អ្នក…" className="studio-input block h-[78px] w-full resize-none rounded-lg border border-[#2b2b46] bg-[#0b0c19] px-3 py-2.5 pr-4 text-[11px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-purple-400" />
              <span className="pointer-events-none absolute bottom-1.5 right-2 text-[9px] tabular-nums text-slate-600">{prompt.length} / 2000</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="min-w-0">
              <label htmlFor="studio-duration" className={fieldLabel}><Clock className="h-3 w-3 text-purple-400" /><span>រយៈពេល <span className="hidden 2xl:inline">/ Duration</span></span></label>
              <select id="studio-duration" value={duration} onChange={event => setDuration(event.target.value)} className={selectClass}>
                <option value="5-20 minutes">5–20 នាទី / min</option>
                <option value="5 minutes">5 នាទី / min</option>
                <option value="10 minutes">10 នាទី / min</option>
                <option value="15 minutes">15 នាទី / min</option>
                <option value="20 minutes">20 នាទី / min</option>
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="studio-resolution" className={fieldLabel}><Monitor className="h-3 w-3 text-blue-400" /><span>គុណភាព <span className="hidden 2xl:inline">/ Quality</span></span></label>
              <select id="studio-resolution" value={resolution} onChange={event => setResolution(event.target.value)} className={selectClass}>
                <option value="1080p">1080p · Full HD</option>
                <option value="4k">4K · Ultra HD</option>
                <option value="720p">720p · HD</option>
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="studio-style" className={fieldLabel}><Palette className="h-3 w-3 text-pink-400" /><span>រចនាប័ទ្ម <span className="hidden 2xl:inline">/ Style</span></span></label>
              <select id="studio-style" value={style} onChange={event => setStyle(event.target.value)} className={selectClass}>
                <option value="3D Cartoon (Pixar-like)">3D Cartoon</option>
                <option value="2D Anime Expressive">2D Anime</option>
                <option value="Fantasy Watercolor">Watercolor</option>
                <option value="Claymation 3D">Claymation</option>
              </select>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-200">ភាសា <span className="font-normal text-slate-500">/ Output languages</span></p>
            <div className="grid grid-cols-3 gap-2">
              {languageItems.map(item => (
                <button key={item.id} type="button" aria-pressed={languages[item.id]} onClick={() => setLanguages(previous => ({ ...previous, [item.id]: !previous[item.id] }))} className={`flex min-w-0 items-center justify-between gap-1.5 rounded-lg border px-2 py-2 text-left transition-colors ${languages[item.id] ? 'border-purple-500/70 bg-purple-500/10' : 'border-[#2d2d49] bg-[#0d0e1c]'}`}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="language-code-badge">{{ km: 'KH', en: 'EN', zh: '中' }[item.id]}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-semibold text-slate-200">{item.kh}</span>
                      <span className="block text-[9px] text-slate-500">{item.en}</span>
                    </span>
                  </span>
                  <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${languages[item.id] ? 'border-purple-400 bg-purple-500 text-white' : 'border-slate-600'}`}>
                    {languages[item.id] && <Check className="h-2.5 w-2.5" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <button type="button" disabled={isGenerating} onClick={() => void handleGenerate()} className="studio-button flex h-[38px] w-full items-center justify-center gap-2 rounded-lg border border-purple-400/40 bg-gradient-to-r from-violet-600 to-purple-600 text-[11px] font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 shadow-md shadow-purple-900/30">
              {isGenerating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isGenerating ? 'កំពុងបង្កើតសាច់រឿង AI… / Generating Screenplay…' : 'បង្កើតសាច់រឿងដោយ AI / Generate AI Story'}
            </button>
            <p className="text-center text-[9px] leading-relaxed text-slate-500">
              បង្កើតប្លង់រឿង 3D និងការសន្ទនាជា ៣ ភាសា (ខ្មែរ អង់គ្លេស ចិន) ដោយស្វ័យប្រវត្តិ
            </p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-2.5 py-2 text-[10px] leading-relaxed text-rose-300">{error}</p>}
          {feedback && <p role="status" className="text-[10px] text-emerald-300 font-semibold">{feedback}</p>}
        </div>
      </section>

      {/* Render Story Script Viewer if script exists */}
      {generatedScript && (
        <StoryScriptViewer
          script={generatedScript}
          onScriptUpdated={(updated) => setGeneratedScript(updated)}
        />
      )}
    </div>
  );
};
