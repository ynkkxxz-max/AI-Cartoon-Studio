import { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HeroBanner } from './components/HeroBanner';
import { CreateVideoCard } from './components/CreateVideoCard';
import { CharacterSection } from './components/CharacterSection';
import { PreviewPlayer } from './components/PreviewPlayer';
import { VoiceEnginePanel } from './components/VoiceEnginePanel';
import { PipelineStepper } from './components/PipelineStepper';
import { VideoEditorCard } from './components/VideoEditorCard';
import { MyProjectsModal } from './components/MyProjectsModal';
import { AddCharacterModal } from './components/AddCharacterModal';
import { api } from './services/api';
import type { Character, VoiceCatalog, SystemStatus, Project } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(['char_boy', 'char_girl']);
  const [voiceCatalog, setVoiceCatalog] = useState<VoiceCatalog | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [projectCount, setProjectCount] = useState<number>(0);

  // Modals
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isAddCharOpen, setIsAddCharOpen] = useState<boolean>(false);

  // Subtitles for preview player
  const [subKh, setSubKh] = useState<string>("ដំណើរផ្សងព្រេងក្នុងទឹកដីវេទមន្តនៃស្ទូឌីយោតុក្កតា AI");
  const [subEn, setSubEn] = useState<string>("The magic journey through the enchanted animated kingdom");

  const editorRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    try {
      const [sys, chars, voices, projs] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.listCharacters().catch(() => []),
        api.getVoiceCatalog().catch(() => null),
        api.listProjects().catch(() => []),
      ]);

      if (sys) setSystemStatus(sys);
      if (chars && chars.length > 0) setCharacters(chars);
      if (voices) setVoiceCatalog(voices);
      if (projs) setProjectCount(projs.length);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSelectCharacter = (id: string) => {
    setSelectedCharacters(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAuditionVoice = async (char: Character) => {
    try {
      const sampleText = `${char.name_kh} បាននិយាយថា៖ សួស្តី! ខ្ញុំត្រៀមខ្លួនជាស្រេចដើម្បីចូលរួមសម្តែងក្នុងរឿងតុក្កតាថ្មីនេះហើយ!`;
      const res = await api.previewVoice(char.default_voice || 'km-KH-PisethNeural', sampleText, 'km');
      if (res.audio_url) {
        const audio = new Audio(res.audio_url);
        audio.play();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectCreated = (proj: any) => {
    setCurrentStep(3);
    setProjectCount(prev => prev + 1);
    if (proj.scenes && proj.scenes.length > 0) {
      setSubKh(proj.scenes[0].dialogue.km);
      setSubEn(proj.scenes[0].dialogue.en);
    }
  };

  const handleSelectProject = (proj: Project) => {
    setCurrentStep(proj.pipeline_step || 2);
    if (proj.metadata?.scenes && proj.metadata.scenes.length > 0) {
      setSubKh(proj.metadata.scenes[0].dialogue.km);
      setSubEn(proj.metadata.scenes[0].dialogue.en);
    }
  };

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectCount={projectCount}
        onOpenProjects={() => setIsProjectsOpen(true)}
      />

      {/* Main Body Layout: Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeView={activeTab}
          setActiveView={setActiveTab}
          systemStatus={systemStatus}
          onOpenProjects={() => setIsProjectsOpen(true)}
        />

        {/* Scrollable Center & Right Content */}
        <main className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* Top Hero Banner */}
          <HeroBanner />

          {/* Primary Top Production Grid (3 Columns: Create Form, Characters & Preview, Voice Engine) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            {/* Left Column: Create Video Card (5 cols) */}
            <div className="lg:col-span-5">
              <CreateVideoCard
                onProjectCreated={handleProjectCreated}
                onSwitchToEditor={scrollToEditor}
                selectedCharacters={selectedCharacters}
              />
            </div>

            {/* Center Column: Characters & Video Preview (4 cols) */}
            <div className="lg:col-span-4 space-y-3.5">
              <CharacterSection
                characters={characters}
                selectedCharacters={selectedCharacters}
                onToggleSelect={handleToggleSelectCharacter}
                onOpenAddModal={() => setIsAddCharOpen(true)}
                onAuditionVoice={handleAuditionVoice}
              />

              <PreviewPlayer
                currentSubtitleKh={subKh}
                currentSubtitleEn={subEn}
              />
            </div>

            {/* Right Column: AI Smart Voice & Sound (3 cols) */}
            <div className="lg:col-span-3">
              <VoiceEnginePanel catalog={voiceCatalog} />
            </div>
          </div>

          {/* Middle Horizontal Workflow Pipeline Stepper */}
          <PipelineStepper currentStep={currentStep} />

          {/* Bottom Panel: AI Real Video Editor */}
          <div ref={editorRef}>
            <VideoEditorCard />
          </div>
        </main>
      </div>

      {/* Modals */}
      <MyProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onSelectProject={handleSelectProject}
      />

      <AddCharacterModal
        isOpen={isAddCharOpen}
        onClose={() => setIsAddCharOpen(false)}
        onCharacterAdded={(newChar) => {
          setCharacters(prev => [...prev, newChar]);
          setSelectedCharacters(prev => [...prev, newChar.id]);
        }}
      />
    </div>
  );
}

export default App;
