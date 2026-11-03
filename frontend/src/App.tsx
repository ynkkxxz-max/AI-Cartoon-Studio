import { useEffect, useRef, useState } from 'react';
import { ArrowRight, AudioLines, Box, Check, ChevronRight, Download, Film, Folder, HardDrive, Languages, Layers, LayoutDashboard, LoaderCircle, Plus, Search, Settings, Sparkles, Upload, Video, X } from 'lucide-react';
import { CreateVideoCard } from './components/CreateVideoCard';
import { CharacterSection } from './components/CharacterSection';
import { VoiceEnginePanel } from './components/VoiceEnginePanel';
import { AddCharacterModal } from './components/AddCharacterModal';
import { DeleteCharacterDialog } from './components/DeleteCharacterDialog';
import { ClipTimelineEditor } from './components/ClipTimelineEditor';
import { api } from './services/api';
import { editingApi } from './services/editingApi';
import type { Character, Project, SystemStatus, VoiceCatalog } from './services/api';

type View = 'dashboard' | 'create' | 'editor' | 'projects' | 'library' | 'settings';
const views = [
  { id: 'dashboard' as const, kh: 'ផ្ទាំងគ្រប់គ្រង', en: 'Dashboard', icon: LayoutDashboard },
  { id: 'create' as const, kh: 'បង្កើតតុក្កតា', en: 'Generate Cartoon', icon: Sparkles },
  { id: 'editor' as const, kh: 'បញ្ចូល និងកាត់ត', en: 'Upload & Edit', icon: Film },
  { id: 'projects' as const, kh: 'គម្រោងរបស់ខ្ញុំ', en: 'My Projects', icon: Folder },
  { id: 'library' as const, kh: 'បណ្ណាល័យ', en: 'Asset Library', icon: Layers },
];
const validView = (value: string): value is View => ['dashboard', 'create', 'editor', 'projects', 'library', 'settings'].includes(value);

export default function App() {
  const initial = window.location.hash.slice(1);
  const [view, setView] = useState<View>(validView(initial) ? initial : 'dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voices, setVoices] = useState<VoiceCatalog | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [uploads, setUploads] = useState<{ video_id: string; filename: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [visited, setVisited] = useState({ create: initial === 'create', editor: initial === 'editor' });
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(['char_boy', 'char_girl']);
  const [addCharacter, setAddCharacter] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Character | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [lastDeleted, setLastDeleted] = useState<{ character: Character; index: number; selected: boolean } | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [libraryTab, setLibraryTab] = useState<'characters' | 'voices' | 'videos'>('characters');

  // Video Generation & Playback State (Phase 4)
  const [activeStoryProject, setActiveStoryProject] = useState<any | null>(null);
  const [renderedVideo, setRenderedVideo] = useState<{ url: string; lang: string; title: string; duration: number } | null>(null);
  const [isRenderingVideo, setIsRenderingVideo] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string>('');

  const main = useRef<HTMLElement>(null);
  const current = views.find(item => item.id === view);
  const filtered = projects.filter(project => project.name.toLowerCase().includes(query.toLowerCase()));
  const navigate = (next: View) => { setView(next); window.location.hash = next; setQuery(''); setSelectedProject(null); main.current?.scrollTo({ top: 0 }); };
  const refresh = async () => {
    setLoading(true); setLoadError('');
    const results = await Promise.allSettled([api.listProjects(), api.listCharacters(), api.getVoiceCatalog(), api.getSystemStatus(), editingApi.listUploads()]);
    if (results[0].status === 'fulfilled') setProjects(results[0].value); else setLoadError('មិនអាចភ្ជាប់ Studio បាន។ សូមបើក backend ហើយព្យាយាមម្ដងទៀត។');
    if (results[1].status === 'fulfilled') {
      const available = results[1].value;
      setCharacters(available);
      setSelectedCharacters(previous => previous.filter(id => available.some(character => character.id === id)));
    }
    if (results[2].status === 'fulfilled') setVoices(results[2].value);
    if (results[3].status === 'fulfilled') setSystem(results[3].value);
    if (results[4].status === 'fulfilled') setUploads(results[4].value);
    setLoading(false);
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if (view === 'create' || view === 'editor') setVisited(previous => previous[view] ? previous : { ...previous, [view]: true }); }, [view]);
  useEffect(() => {
    const update = () => { const next = window.location.hash.slice(1); if (validView(next)) { setView(next); main.current?.scrollTo({ top: 0 }); } };
    window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update);
  }, []);
  const toggleCharacter = (id: string) => setSelectedCharacters(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  const audition = async (character: Character) => {
    try { const result = await api.previewVoice(character.default_voice || 'km-KH-PisethNeural', 'សួស្តី! សូមស្វាគមន៍មកកាន់ស្ទូឌីយោរបស់យើង។'); await new Audio(result.audio_url).play(); }
    catch { setLoadError('មិនអាចចាក់សំឡេងបាន។ សូមពិនិត្យការភ្ជាប់អ៊ីនធឺណិត ហើយសាកម្ដងទៀត។'); }
  };

  const handleRenderCartoon = async (lang: string) => {
    const targetProj = activeStoryProject || (projects.length > 0 ? projects[0] : null);
    if (!targetProj?.id) {
      alert('សូមបង្កើតសាច់រឿងជាមុនសិន! (Please create a story first)');
      return;
    }
    setIsRenderingVideo(true);
    setRenderError('');
    try {
      const res = await api.renderCartoonVideo(targetProj.id, lang);
      setRenderedVideo({
        url: res.video_url,
        lang: res.language,
        title: res.title,
        duration: res.duration
      });
    } catch (err: any) {
      setRenderError(err.message || 'Rendering failed');
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const projectRows = (items: Project[]) => <div className="project-list">{items.length ? items.map(project => <button key={project.id} className="project-row" onClick={() => { if (view !== 'projects') { setView('projects'); window.location.hash = 'projects'; } setSelectedProject(project); }}>
    <span className={`project-icon ${project.project_type === 'video_editor' ? 'teal' : ''}`}>{project.project_type === 'video_editor' ? <Film size={19} /> : <Sparkles size={19} />}</span>
    <span className="project-name"><strong>{project.name}</strong><small>{project.project_type === 'video_editor' ? 'Video edit' : 'Story draft'} <span>·</span> {(project.languages || []).map(language => ({ km: 'KH', en: 'EN', zh: '中文' }[language] || language)).join(' / ')}</small></span><span className="status-tag">{project.status === 'completed' ? 'Completed' : project.project_type !== 'video_editor' ? 'Draft' : project.status}</span><ChevronRight size={15} />
  </button>) : <div className="empty-state"><Folder size={27} /><strong>{query ? 'រកមិនឃើញគម្រោង' : 'កន្លែងសម្រាប់គំនិតបន្ទាប់របស់អ្នក'}</strong><p>{query ? 'សាកល្បងស្វែងរកដោយពាក្យផ្សេង។' : 'បង្កើតសេចក្ដីព្រាងដំបូង ដើម្បីចាប់ផ្ដើម។'}</p><button className="studio-button" onClick={() => navigate('create')}><Plus size={15} /> បង្កើតគម្រោង</button></div>}</div>;
  const confirmDelete = async () => {
    if (!pendingDelete || deleteBusy) return;
    setDeleteBusy(true); setDeleteError('');
    try {
      await api.deleteCharacter(pendingDelete.id);
      setLastDeleted({ character: pendingDelete, index: characters.findIndex(item => item.id === pendingDelete.id), selected: selectedCharacters.includes(pendingDelete.id) });
      setCharacters(previous => previous.filter(item => item.id !== pendingDelete.id));
      setSelectedCharacters(previous => previous.filter(id => id !== pendingDelete.id));
      setRestoreError(''); setPendingDelete(null);
    } catch (cause) { setDeleteError(cause instanceof Error ? cause.message : 'Could not delete character'); }
    finally { setDeleteBusy(false); }
  };
  const undoDelete = async () => {
    if (!lastDeleted || restoreBusy) return;
    setRestoreBusy(true); setRestoreError('');
    try {
      const restored = await api.restoreCharacter(lastDeleted.character.id);
      setCharacters(previous => { if (previous.some(item => item.id === restored.id)) return previous; const next = [...previous]; next.splice(Math.max(0, lastDeleted.index), 0, restored); return next; });
      if (lastDeleted.selected) setSelectedCharacters(previous => previous.includes(restored.id) ? previous : [...previous, restored.id]);
      setLastDeleted(null);
    } catch (cause) { setRestoreError(cause instanceof Error ? cause.message : 'Could not restore character'); }
    finally { setRestoreBusy(false); }
  };
  const characterPanel = <CharacterSection characters={characters} selectedCharacters={selectedCharacters} onToggleSelect={toggleCharacter} onOpenAddModal={() => setAddCharacter(true)} onAuditionVoice={character => void audition(character)} deletionDisabled={deleteBusy || restoreBusy} onDelete={character => { setDeleteError(''); setPendingDelete(character); }} />;

  return <div className="workspace-app">
    <aside className="workspace-sidebar">
      <a className="workspace-brand" href="#dashboard" onClick={event => { event.preventDefault(); navigate('dashboard'); }} aria-label="AI Cartoon Studio dashboard"><span className="brand-symbol"><Layers size={22} /></span><span><strong>AI Cartoon<br />Studio</strong><small>PERSONAL EDITION</small></span></a>
      <span className="nav-caption">WORKSPACE</span>
      <nav aria-label="Workspace navigation">{views.map(({ id, kh, en, icon: Icon }) => <button key={id} type="button" onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined} className={`workspace-nav-item ${view === id ? 'is-active' : ''}`} title={en}><Icon size={17} /><span>{kh}<small>{en}</small></span>{id === 'projects' && projects.length > 0 && <em>{projects.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="creative-space"><span>YOUR CREATIVE SPACE</span><strong>Made for your imagination.</strong><p>គំនិតមួយ អាចក្លាយជារឿងដ៏អស្ចារ្យ។</p><div className="space-divider" /></div><button className={`workspace-nav-item ${view === 'settings' ? 'is-active' : ''}`} onClick={() => navigate('settings')} title="Settings"><Settings size={16} /><span>ការកំណត់<small>Settings</small></span></button><small className="workspace-version">LOCAL STUDIO · v1.0</small></div>
    </aside>
    <div className="workspace-column">
      <header className="workspace-topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={12} /><strong>{current?.en || 'Settings'}</strong></div><div className="topbar-actions"><form className="workspace-search" onSubmit={event => { event.preventDefault(); setView('projects'); window.location.hash = 'projects'; }}><Search size={15} /><input value={query} onChange={event => { setQuery(event.target.value); if (event.target.value) { setView('projects'); window.location.hash = 'projects'; } }} placeholder="ស្វែងរកគម្រោង…" aria-label="Search projects" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={13} /></button>}</form><span className={`connection-dot ${system ? 'online' : ''}`} title={system ? 'Local backend connected' : 'Backend connection unavailable'} /><span className="user-avatar" title="Personal workspace">YOU</span></div></header>
      <main className={`workspace-main view-${view}`} ref={main} id="workspace-content"><div className="page-wrap">
        {loadError && <div role="alert" className="workspace-notice"><span>{loadError}</span><button onClick={() => void refresh()}>ព្យាយាមម្ដងទៀត</button><button aria-label="Dismiss notice" onClick={() => setLoadError('')}><X size={14} /></button></div>}
        {view === 'dashboard' && <>
          <div className="page-heading"><span className="eyebrow">YOUR CREATIVE UNIVERSE</span><h1>សូមស្វាគមន៍មកកាន់ Studio<span className="heading-badge">PERSONAL</span></h1><p>កន្លែងដែលគំនិតរបស់អ្នក ចាប់ផ្ដើមក្លាយជារឿង។</p></div>
          <section className="universe-hero"><div className="hero-copy"><span className="hero-label"><span /> CREATE SOMETHING WONDERFUL</span><h2>គ្រប់គំនិត មានពិភព<br /><span>របស់ខ្លួនឯង។</span></h2><p>រៀបចំរឿងតុក្កតារបស់អ្នក ឬកែច្នៃវីដេអូដែលអ្នកបានថត។<br />One workspace. Two creative possibilities.</p><div className="hero-actions"><button className="studio-button" onClick={() => navigate('create')}><Plus size={16} /> បង្កើតរឿងថ្មី</button><button className="studio-button secondary" onClick={() => navigate('editor')}><Video size={16} /> កាត់តវីដេអូ</button></div></div><div className="universe-art" role="img" aria-label="A glowing creative universe with orbiting stars"><div className="universe-glow" /><div className="universe-orbit orbit-one" /><div className="universe-orbit orbit-two" /><div className="universe-planet"><Sparkles size={47} strokeWidth={1.2} /></div><span className="art-star star-one">✦</span><span className="art-star star-two">✧</span><span className="art-star star-three">✦</span><span className="art-pill"><Layers size={15} /> Creative possibilities</span><span className="art-language"><Languages size={17} /><span>Three languages<small>ខ្មែរ · English · 中文</small></span></span></div></section>
          <div className="workspace-stats"><div><span>គម្រោងរបស់អ្នក <small>Projects</small></span><strong>{loading ? '—' : String(projects.length).padStart(2, '0')}</strong><Folder size={21} /></div><div><span>លំហូរការងារ <small>Creative workflows</small></span><strong>02</strong><Sparkles size={21} /></div><div><span>ភាសាគម្រោង <small>Project languages</small></span><strong>03</strong><Languages size={21} /></div></div>
          <div className="section-heading"><h2>ជ្រើសរើសការងាររបស់អ្នក</h2><p>Two creative spaces. A clear place to start.</p></div>
          <div className="workflow-grid"><button className="workflow-card" onClick={() => navigate('create')}><span className="workflow-icon"><Sparkles size={23} /></span><h3>បង្កើតតុក្កតា <small>Generate Cartoon</small></h3><p>ចាប់ផ្ដើមពីគំនិត រៀបចំតួអង្គ និងភាសារបស់រឿង។</p><span className="workflow-meta">Story · Characters · Languages</span><ArrowRight size={19} /></button><button className="workflow-card editor-workflow" onClick={() => navigate('editor')}><span className="workflow-icon"><Film size={23} /></span><h3>បញ្ចូល និងកាត់ត <small>Upload & Edit</small></h3><p>កាត់ ភ្ជាប់ clips ពិនិត្យចន្លោះស្ងាត់ និងនាំចេញ MP4។</p><span className="workflow-meta">Upload · Refine · Export</span><ArrowRight size={19} /></button></div>
          <div className="section-heading with-action"><div><h2>គម្រោងថ្មីៗ</h2><p>Pick up where your last idea began.</p></div><button className="studio-text-link" onClick={() => navigate('projects')}>មើលទាំងអស់ <ArrowRight size={13} /></button></div>{loading ? <div className="loading-state"><LoaderCircle className="animate-spin" size={18} /> កំពុងទាញយកគម្រោង…</div> : projectRows(projects.slice(0, 3))}
        </>}
        {(view === 'create' || visited.create) && <div style={{ display: view === 'create' ? undefined : 'none' }}>
          <div className="page-heading"><span className="eyebrow">WORKFLOW 01 · YOUR NEXT STORY</span><h1>បង្កើតតុក្កតា <small>Generate Cartoon</small></h1><p>ចាប់ផ្ដើមពីគំនិតតូចមួយ ហើយរៀបចំរឿងរបស់អ្នកតាមលំដាប់។</p></div>
          <div className="create-workspace">
            <CreateVideoCard
              selectedCharacters={selectedCharacters}
              onSwitchToEditor={() => navigate('editor')}
              onProjectCreated={(proj) => {
                setActiveStoryProject(proj);
                void refresh();
              }}
            />
            <aside className="story-guide studio-card space-y-3">
              <div className="section-heading">
                <h2>ពិភពរឿង និងវីដេអូរបស់អ្នក</h2>
                <p>Cartoon Video Player & Export Hub</p>
              </div>

              {renderedVideo ? (
                <div className="space-y-2.5">
                  <video
                    src={renderedVideo.url}
                    controls
                    autoPlay
                    className="w-full rounded-lg border border-purple-500/50 bg-black shadow-lg"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-200">
                    <span className="font-bold text-emerald-400">
                      ● វីដេអូរួចរាល់ ({renderedVideo.lang.toUpperCase()} • {renderedVideo.duration}s)
                    </span>
                    <a
                      href={renderedVideo.url}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <Download size={13} />
                      <span>ទាញយក MP4</span>
                    </a>
                  </div>
                </div>
              ) : isRenderingVideo ? (
                <div className="p-6 rounded-xl border border-purple-500/40 bg-purple-950/30 text-center space-y-2">
                  <LoaderCircle className="animate-spin mx-auto text-purple-400" size={32} />
                  <p className="text-xs font-bold text-white">កំពុងផលិតវីដេអូតុក្កតា និងសំឡេង AI...</p>
                  <p className="text-[10px] text-purple-300">Rendering 3D scene visuals, Edge-TTS audio & FFmpeg MP4</p>
                </div>
              ) : (
                <div className="story-concept-art">
                  <span className="concept-moon" />
                  <Sparkles size={55} strokeWidth={1} />
                  <span>YOUR NEXT GREAT STORY</span>
                </div>
              )}

              {renderError && (
                <p className="p-2 rounded bg-rose-500/10 text-rose-300 text-[10px] border border-rose-500/20">{renderError}</p>
              )}

              <h3 className="guide-label">ផលិតវីដេអូតាមភាសា / RENDER VIDEO VERSIONS</h3>
              <div className="space-y-2">
                {[
                  { code: 'km', name: 'ខ្មែរ', sub: 'Khmer version (Piseth Voice)', btn: '🎬 ផលិតជាភាសាខ្មែរ (Khmer MP4)' },
                  { code: 'en', name: 'English', sub: 'English version (Christopher Voice)', btn: '🎬 Render English (MP4)' },
                  { code: 'zh', name: '中文', sub: 'Chinese version (Xiaoxiao Voice)', btn: '🎬 渲染中文版 (Chinese MP4)' }
                ].map(language => (
                  <div className="p-2.5 rounded-lg border border-[#2b2e55] bg-[#0f1128] flex items-center justify-between gap-2" key={language.code}>
                    <div className="min-w-0">
                      <strong className="block text-xs text-white">{language.name}</strong>
                      <small className="block text-[10px] text-slate-400 truncate">{language.sub}</small>
                    </div>
                    <button
                      type="button"
                      disabled={isRenderingVideo}
                      onClick={() => void handleRenderCartoon(language.code)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-[10px] transition shrink-0 shadow-sm"
                    >
                      {language.btn}
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          </div>
          <details className="creative-details"><summary><Box size={16} /> តួអង្គសម្រាប់រឿងនេះ <span>{selectedCharacters.length} selected</span></summary>{characterPanel}</details>
        </div>}
        {(view === 'editor' || visited.editor) && <div style={{ display: view === 'editor' ? undefined : 'none' }}><div className="page-heading"><span className="eyebrow">WORKFLOW 02 · YOUR OWN FOOTAGE</span><h1>បញ្ចូល និងកាត់ត <small>Upload & Edit</small></h1><p>ឧបករណ៍កាត់តជាក់ស្ដែង សម្រាប់វីដេអូរបស់អ្នក។</p></div><div className="embedded-editor"><ClipTimelineEditor /></div></div>}
        {view === 'projects' && <><div className="page-heading"><span className="eyebrow">ORGANIZE YOUR IDEAS</span><h1>គម្រោងរបស់ខ្ញុំ <small>My Projects</small></h1><p>គ្រប់គំនិតរបស់អ្នក រក្សាទុកនៅកន្លែងតែមួយ។</p></div><div className="section-heading with-action"><div><h2>គម្រោងទាំងអស់ <span className="count-label">{filtered.length}</span></h2><p>{query ? `Search: ${query}` : 'Your saved stories and video projects.'}</p></div><button className="studio-button" onClick={() => navigate('create')}><Plus size={15} /> គម្រោងថ្មី</button></div>{projectRows(filtered)}{selectedProject && <section className="project-detail studio-card"><div className="section-heading with-action"><h2>{selectedProject.name}</h2><button className="icon-button" aria-label="Close project details" onClick={() => setSelectedProject(null)}><X size={17} /></button></div><p>{selectedProject.story_prompt || 'Video editing project'}</p><div className="detail-metadata"><span>Style <strong>{selectedProject.style}</strong></span><span>Target length <strong>{selectedProject.duration_preset}</strong></span><span>Saved <strong>{new Date(selectedProject.updated_at).toLocaleDateString('en-GB')}</strong></span></div><span className="capability-note">Saved draft · {selectedProject.status}</span></section>}</>}
        {view === 'library' && <><div className="page-heading"><span className="eyebrow">YOUR CREATIVE LIBRARY</span><h1>បណ្ណាល័យ <small>Asset Library</small></h1><p>រក្សាតួអង្គ សំឡេង និងវីដេអូរបស់អ្នកឱ្យមានរបៀប។</p></div><div className="library-tabs" role="tablist" aria-label="Asset category">{([{ id: 'characters', icon: Box, text: 'តួអង្គ / Characters', count: characters.length }, { id: 'voices', icon: AudioLines, text: 'សំឡេង / Voices', count: voices?.human?.length || 0 }, { id: 'videos', icon: Video, text: 'វីដេអូ / Videos', count: uploads.length }] as const).map(({ id, icon: Icon, text, count }) => <button key={id} role="tab" aria-selected={libraryTab === id} onClick={() => setLibraryTab(id)}><Icon size={16} />{text}<span>{count}</span></button>)}</div>{libraryTab === 'characters' && <div className="library-characters">{characterPanel}</div>}{libraryTab === 'voices' && <div className="library-voices"><VoiceEnginePanel catalog={voices} /></div>}{libraryTab === 'videos' && <div className="project-list">{uploads.length ? uploads.map(video => <a key={video.video_id} className="project-row" href={`/api/editor/stream/${encodeURIComponent(video.filename)}`} target="_blank" rel="noreferrer"><span className="project-icon teal"><Video size={20} /></span><span className="project-name"><strong>{video.filename}</strong><small>Uploaded footage · Original file</small></span><ArrowRight size={17} /></a>) : <div className="empty-state"><Upload size={27} /><strong>មិនទាន់មានវីដេអូ</strong><button className="studio-button" onClick={() => navigate('editor')}>បញ្ចូលវីដេអូ</button></div>}</div>}</>}
        {view === 'settings' && <><div className="page-heading"><span className="eyebrow">PERSONAL WORKSPACE</span><h1>ការកំណត់ <small>Settings</small></h1><p>ព័ត៌មានអំពី Studio ក្នុងកុំព្យូទ័ររបស់អ្នក។</p></div><div className="settings-grid"><section className="studio-card settings-card"><HardDrive size={22} /><h2>ការផ្ទុក / Storage</h2><strong>{system ? `${system.storage_used_gb} / ${system.storage_total_gb} GB` : 'Unavailable'}</strong><div className="storage-track"><span style={{ width: `${Math.min(system?.storage_pct || 0, 100)}%` }} /></div><p>ទំហំថាសសរុបក្នុងម៉ាស៊ីន / Total machine disk usage</p></section><section className="studio-card settings-card"><Check size={22} /><h2>ស្ថានភាព / System status</h2><strong>{system ? 'Backend connected' : 'Offline'}</strong><p>FFmpeg: {system?.ffmpeg_available ? 'Available' : 'Unavailable'}</p><button className="studio-button secondary" onClick={() => void refresh()} disabled={loading}>ពិនិត្យម្ដងទៀត</button></section></div></>}
      </div></main>
    </div>
    {pendingDelete && <DeleteCharacterDialog character={pendingDelete} busy={deleteBusy} error={deleteError} onCancel={() => setPendingDelete(null)} onConfirm={() => void confirmDelete()} />}
    {lastDeleted && <div className="character-undo" role="status"><Check size={16} /><span>បានលុប {lastDeleted.character.name_kh || lastDeleted.character.name_en}{restoreError && <small role="alert">{restoreError}</small>}</span><button disabled={restoreBusy} onClick={() => void undoDelete()}>{restoreBusy ? 'កំពុងស្ដារ…' : 'ស្ដារវិញ / Undo'}</button><button aria-label="Dismiss undo notification" disabled={restoreBusy} onClick={() => setLastDeleted(null)}><X size={14} /></button></div>}
    <AddCharacterModal isOpen={addCharacter} onClose={() => setAddCharacter(false)} onCharacterAdded={character => { setCharacters(previous => [...previous, character]); setSelectedCharacters(previous => [...previous, character.id]); }} />
  </div>;
}
