export interface SystemStatus {
  status: string;
  ffmpeg_available: boolean;
  ffmpeg_version: string;
  storage_used_bytes: number;
  storage_total_bytes: number;
  storage_used_gb: number;
  storage_total_gb: number;
  storage_pct: number;
  active_jobs: number;
  total_projects: number;
  edition: string;
}

export interface Character {
  id: string;
  name_kh: string;
  name_en: string;
  category: string;
  avatar_url?: string;
  default_voice?: string;
  description?: string;
}

export interface VoiceItem {
  id: string;
  name: string;
  lang?: string;
  gender?: string;
  sample?: string;
  category?: string;
  sound_type?: string;
  sample_text?: string;
}

export interface VoiceCatalog {
  human: VoiceItem[];
  animal: VoiceItem[];
  talking_animal: any[];
  emotions: any[];
}

export interface Project {
  id: string;
  name: string;
  project_type: string;
  story_prompt: string;
  duration_preset: string;
  resolution: string;
  style: string;
  languages: string[];
  selected_characters: string[];
  status: string;
  pipeline_step: number;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

const API_BASE = '/api';

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to list projects');
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<any> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async listCharacters(): Promise<Character[]> {
    const res = await fetch(`${API_BASE}/characters`);
    if (!res.ok) throw new Error('Failed to list characters');
    return res.json();
  },

  async addCharacter(char: Partial<Character>): Promise<Character> {
    const res = await fetch(`${API_BASE}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(char),
    });
    if (!res.ok) throw new Error('Failed to add character');
    return res.json();
  },

  async getVoiceCatalog(): Promise<VoiceCatalog> {
    const res = await fetch(`${API_BASE}/voices/catalog`);
    if (!res.ok) throw new Error('Failed to get voice catalog');
    return res.json();
  },

  async previewVoice(voiceId: string, text: string, lang = 'km', pitch = '+0Hz', rate = '+0%'): Promise<{ success: boolean; audio_url: string }> {
    const res = await fetch(`${API_BASE}/voices/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice_id: voiceId, text, language: lang, pitch, rate }),
    });
    if (!res.ok) throw new Error('Failed to generate voice preview');
    return res.json();
  },

  async uploadVideo(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/editor/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async processVideo(params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/editor/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to process video');
    return res.json();
  }
};
