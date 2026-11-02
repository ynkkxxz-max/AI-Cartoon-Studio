export interface EditorMedia {
  video_id: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  has_audio?: boolean;
  stream_url: string;
  export_url?: string;
}

export interface EditorClip {
  video_id: string;
  start_time: number;
  end_time: number;
}

export interface SilenceAnalysis {
  has_audio: boolean;
  duration: number;
  silence_segments: { start_time: number; end_time: number }[];
  keep_segments: { start_time: number; end_time: number }[];
  analysis: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (typeof body?.detail === 'string') message = body.detail;
    else if (Array.isArray(body?.detail)) {
      message = body.detail.map((item: { loc?: (string | number)[]; msg?: string }) =>
        `${item.loc?.slice(1).join('.') || 'Request'}: ${item.msg || 'Invalid value'}`).join('; ');
    }
    throw new Error(message);
  }
  if (body === null) throw new Error('The server returned an unreadable response. Please try again.');
  return body as T;
}

function post<T>(operation: string, data: unknown): Promise<T> {
  return request<T>(`/api/editor/timeline/${operation}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
}

export const editingApi = {
  async upload(file: File): Promise<EditorMedia> {
    const form = new FormData();
    form.append('file', file);
    const uploaded = await request<{ video_id: string }>('/api/editor/upload', { method: 'POST', body: form });
    // Verify readable streams/duration rather than trusting legacy upload defaults.
    const media = await request<EditorMedia>(`/api/editor/timeline/media/${encodeURIComponent(uploaded.video_id)}`);
    return { ...media, filename: file.name };
  },
  analyze(videoId: string): Promise<SilenceAnalysis> {
    return post('silence', { video_id: videoId });
  },
  trim(videoId: string, start: number, end: number): Promise<EditorMedia> {
    return post('trim', { video_id: videoId, start_time: start, end_time: end });
  },
  merge(clips: EditorClip[], transition: number): Promise<EditorMedia> {
    return post('merge', { clips, transition_seconds: transition });
  },
  convert(videoId: string, aspect: '9:16' | '16:9' | '1:1'): Promise<EditorMedia> {
    return post('convert', { video_id: videoId, aspect_ratio: aspect });
  },
};
