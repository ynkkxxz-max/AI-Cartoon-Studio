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

export interface SilenceAnalysis {
  video_id: string;
  video_duration: number;
  silence_intervals: Array<{ start: number; end: number; duration: number }>;
  speaking_intervals: Array<{ start: number; end: number; duration: number }>;
  total_silence_seconds: number;
  silence_count: number;
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

  async deleteCharacter(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/characters/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail || 'Could not delete the character. Please try again.');
    }
  },

  async restoreCharacter(id: string): Promise<Character> {
    const response = await fetch(`${API_BASE}/characters/${encodeURIComponent(id)}/restore`, { method: 'POST' });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail || 'Could not restore the character. Please try again.');
    }
    return response.json();
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

  async detectSilence(videoId: string, noiseDb = -30, minDuration = 0.5): Promise<SilenceAnalysis> {
    const res = await fetch(`${API_BASE}/editor/detect-silence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, noise_db: noiseDb, min_duration: minDuration }),
    });
    if (!res.ok) throw new Error('Failed to detect silence');
    return res.json();
  },

  async trimVideo(videoId: string, startTime: number, endTime: number): Promise<any> {
    const res = await fetch(`${API_BASE}/editor/trim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, start_time: startTime, end_time: endTime }),
    });
    if (!res.ok) throw new Error('Failed to trim video');
    return res.json();
  },

  async mergeVideos(videoIds: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/editor/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_ids: videoIds }),
    });
    if (!res.ok) throw new Error('Failed to merge videos');
    return res.json();
  },

  async applySilenceCut(videoId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/editor/apply-silence-cut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId }),
    });
    if (!res.ok) throw new Error('Failed to remove silence');
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
