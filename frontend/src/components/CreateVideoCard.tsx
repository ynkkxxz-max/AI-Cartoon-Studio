import React, { useState } from 'react';
import { Sparkles, Video, Film, Clock, Monitor, Palette, Check } from 'lucide-react';
import { api } from '../services/api';

interface CreateVideoCardProps {
  onProjectCreated: (project: any) => void;
  onSwitchToEditor: () => void;
  selectedCharacters: string[];
}

export const CreateVideoCard: React.FC<CreateVideoCardProps> = ({
  onProjectCreated,
  onSwitchToEditor,
  selectedCharacters
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'editor'>('create');
  const [prompt, setPrompt] = useState<string>('');
  const [duration, setDuration] = useState<string>('5-20 minutes');
  const [resolution, setResolution] = useState<string>('1080p');
  const [style, setStyle] = useState<string>('3D Cartoon (Pixar-like)');
  const [languages, setLanguages] = useState<{ [key: string]: boolean }>({
    km: true,
    en: true,
    zh: true
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const toggleLanguage = (code: string) => {
    setLanguages(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("សូមបញ្ចូលគំនិតរឿងរបស់អ្នក (Please enter your story prompt)!");
      return;
    }

    const selectedLangs = Object.keys(languages).filter(k => languages[k]);
    if (selectedLangs.length === 0) {
      alert("សូមជ្រើសរើសយ៉ាងហោចណាស់ភាសាមួយ (Please select at least one language)!");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.createProject({
        name: prompt.slice(0, 30) + '...',
        story_prompt: prompt,
        duration_preset: duration,
        resolution,
        style,
        languages: selectedLangs,
        selected_characters: selectedCharacters,
        pipeline_step: 3
      });
      onProjectCreated(res);
      alert(`🎉 គម្រោងបានបង្កើតដោយជោគជ័យ! ប្លង់សាច់រឿងចំនួន ${res.scenes?.length || 4} ត្រូវបានរៀបចំសម្រាប់ភាសាខ្មែរ អង់គ្លេស និងចិន។`);
    } catch (err: any) {
      alert(`បរាជ័យក្នុងការបង្កើតគម្រោង: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExamplePrompt = () => {
    setPrompt("ដំណើរផ្សងព្រេងរបស់ក្មេងប្រុសក្លាហាន និងសត្វស្វាមន្តអាគមនៅក្នុងព្រៃអច្ឆរិយៈ ដើម្បីស្វែងរកប្រាសាទពេជ្រអណ្តែតលើអាកាស");
  };

  return (
    <div className="bg-studio-card rounded-2xl border border-studio-cardBorder p-4 shadow-xl">
      {/* Header and top tab buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-studio-cardBorder/60">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              បង្កើតវីដេអូថ្មី
              <span className="text-xs font-normal text-slate-400">(Create New Video)</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0e101f] p-1 rounded-xl border border-studio-cardBorder">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>បង្កើតវីដេអូ</span>
            <span className="text-[10px] opacity-80">(Create Video)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('editor');
              onSwitchToEditor();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'editor'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>កែវីដេអូ</span>
            <span className="text-[10px] opacity-80">(AI Video Editor)</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="pt-3 space-y-3 text-left">
        {/* Story Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-200">
              គំនិតរឿង / Story Prompt <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={loadExamplePrompt}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              + ឧទាហរណ៍គំរូ (Example Prompt)
            </button>
          </div>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder="បញ្ចូលគំនិត គំរូសង្ខេបដែលអ្នកចង់បាន...&#10;Enter your story idea or a short story description here..."
              className="w-full bg-[#0d0e1c] border border-studio-cardBorder rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-mono">
              {prompt.length} / 2000
            </span>
          </div>
        </div>

        {/* 3 Dropdown Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Duration */}
          <div className="bg-[#0e101f] border border-studio-cardBorder/80 rounded-xl p-2.5">
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" />
              រយៈពេល / Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#14162a] border border-studio-cardBorder rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
            >
              <option value="5-20 minutes">⏱️ 5–20 នាទី / 5–20 min</option>
              <option value="5 minutes">⏱️ 5 នាទី / 5 minutes</option>
              <option value="10 minutes">⏱️ 10 នាទី / 10 minutes</option>
              <option value="15 minutes">⏱️ 15 នាទី / 15 minutes</option>
              <option value="20 minutes">⏱️ 20 នាទី / 20 minutes</option>
            </select>
          </div>

          {/* Resolution */}
          <div className="bg-[#0e101f] border border-studio-cardBorder/80 rounded-xl p-2.5">
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Monitor className="w-3 h-3 text-blue-400" />
              គុណភាព / Resolution
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full bg-[#14162a] border border-studio-cardBorder rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
            >
              <option value="1080p">🖥️ 1080p (Full HD)</option>
              <option value="4k">🖥️ 4K (Ultra HD)</option>
              <option value="720p">🖥️ 720p (Fast Render)</option>
            </select>
          </div>

          {/* Animation Style */}
          <div className="bg-[#0e101f] border border-studio-cardBorder/80 rounded-xl p-2.5">
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3 text-pink-400" />
              រចនាប័ទ្ម / Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-[#14162a] border border-studio-cardBorder rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
            >
              <option value="3D Cartoon (Pixar-like)">🎨 3D Cartoon (Pixar-like)</option>
              <option value="2D Anime Expressive">🎨 2D Anime Expressive</option>
              <option value="Fantasy Watercolor">🎨 Fantasy Watercolor</option>
              <option value="Claymation 3D">🎨 Claymation 3D</option>
            </select>
          </div>
        </div>

        {/* Output Languages Selection with exact flag badges */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            ភាសាបញ្ចេញ / Output Languages
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Khmer */}
            <button
              type="button"
              onClick={() => toggleLanguage('km')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                languages.km
                  ? 'bg-purple-950/50 border-purple-500 text-white shadow-sm'
                  : 'bg-[#0d0e1c] border-studio-cardBorder text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded overflow-hidden shadow-sm flex-shrink-0">
                  <img src="/assets/flag_kh.png" alt="Khmer" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">ខ្មែរ</span>
                  <span className="text-[10px] text-slate-400">Khmer</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${languages.km ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'}`}>
                {languages.km && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* English */}
            <button
              type="button"
              onClick={() => toggleLanguage('en')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                languages.en
                  ? 'bg-purple-950/50 border-purple-500 text-white shadow-sm'
                  : 'bg-[#0d0e1c] border-studio-cardBorder text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded overflow-hidden shadow-sm flex-shrink-0">
                  <img src="/assets/flag_us.png" alt="English" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">អង់គ្លេស</span>
                  <span className="text-[10px] text-slate-400">English</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${languages.en ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'}`}>
                {languages.en && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* Chinese */}
            <button
              type="button"
              onClick={() => toggleLanguage('zh')}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                languages.zh
                  ? 'bg-purple-950/50 border-purple-500 text-white shadow-sm'
                  : 'bg-[#0d0e1c] border-studio-cardBorder text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded overflow-hidden shadow-sm flex-shrink-0">
                  <img src="/assets/flag_cn.png" alt="Chinese" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold">ចិន</span>
                  <span className="text-[10px] text-slate-400">Chinese</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${languages.zh ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'}`}>
                {languages.zh && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Primary Action Button matching exact mockup gradient */}
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerate}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs md:text-sm bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#9333ea] hover:brightness-110 text-white shadow-lg shadow-purple-900/50 transition-all flex items-center justify-center gap-2 border border-purple-400/40 active:scale-[0.99] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>{isGenerating ? 'កំពុងរៀបចំប្លង់សាច់រឿង... (Generating Plan...)' : 'បង្កើតវីដេអូ 3 វីដេអូ Generate 3 Videos'}</span>
        </button>
      </div>
    </div>
  );
};
