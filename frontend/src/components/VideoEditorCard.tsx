import React, { useState, useRef } from 'react';
import { UploadCloud, Check, Wand2, FileVideo, Download } from 'lucide-react';
import { api } from '../services/api';

export const VideoEditorCard: React.FC = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingMode, setEditingMode] = useState<string>('full_auto');
  const [features, setFeatures] = useState<{ [key: string]: boolean }>({
    auto_subtitle: true,
    remove_silence: true,
    background_music: true,
  });
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [quality, setQuality] = useState<string>('1080p');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      alert("ទម្រង់វីដេអូមិនត្រឹមត្រូវ! សូមប្រើប្រាស់ MP4, MOV ឬ AVI (Invalid format, please use MP4, MOV, or AVI).");
      return;
    }

    setIsUploading(true);
    setExportResult(null);
    try {
      const data = await api.uploadVideo(file);
      setUploadedVideo(data);
    } catch (err: any) {
      alert(`បរាជ័យក្នុងការ Upload: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartEditing = async () => {
    if (!uploadedVideo) {
      alert("សូម Upload វីដេអូជាមុនសិន! (Please upload a video first)");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.processVideo({
        video_id: uploadedVideo.video_id,
        mode: editingMode,
        features,
        aspect_ratio: aspectRatio,
        quality
      });
      setExportResult(res);
      alert(`🎉 ការកែវីដេអូបានបញ្ចប់ដោយជោគជ័យ! File ត្រូវបាន Export ជា ${res.aspect_ratio} (${res.quality})`);
    } catch (err: any) {
      alert(`កំហុសក្នុងការកែវីដេអូ: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#111327] rounded-2xl border border-[#1f2343] p-4 shadow-xl text-left space-y-3.5">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#1f2343]/80">
        <FileVideo className="w-5 h-5 text-purple-400" />
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          កែវីដេអូពិតដោយ AI
          <span className="text-[11px] font-normal text-slate-400">(AI Video Editor)</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Drag and drop upload (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".mp4,.mov,.avi,.mkv,.webm"
            onChange={(e) => handleFileChange(e.target.files)}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChange(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-full min-h-[145px] ${
              isDragging
                ? 'border-purple-400 bg-purple-900/30'
                : 'border-purple-500/40 hover:border-purple-400 bg-[#0c0d1e] hover:bg-[#121429]'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-purple-600/20 text-purple-300 flex items-center justify-center mb-1.5 shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold text-white mb-0.5">
              Upload Your Videos
            </span>
            <span className="text-[11px] font-bold text-purple-300 mb-1">
              MP4 • MOV • AVI
            </span>
            <span className="text-[11px] text-slate-300 leading-tight">
              អូសទម្លាក់វីដេអូនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស
              <br />
              <span className="text-[9.5px] text-slate-400 font-normal">Drag & drop videos here or click to browse</span>
            </span>

            {isUploading && (
              <span className="mt-1.5 text-xs text-purple-300 font-bold animate-pulse">
                ⏳ កំពុង Upload...
              </span>
            )}
          </div>

          {/* Uploaded File Info Card */}
          {uploadedVideo && (
            <div className="mt-2.5 p-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-[11px] text-slate-200">
              <div className="flex items-center justify-between font-bold text-purple-200 mb-0.5">
                <span className="truncate max-w-[150px]">{uploadedVideo.filename}</span>
                <span className="text-emerald-400 font-mono">● {uploadedVideo.aspect_ratio}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                <span>⏱️ {uploadedVideo.duration}s</span>
                <span>🖥️ {uploadedVideo.width}x{uploadedVideo.height}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center-Left: AI Editing Mode (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <label className="block text-xs font-bold text-slate-200">
            របៀបកែដោយ AI / AI Editing Mode
          </label>
          <div className="space-y-2">
            {[
              { id: 'full_auto', kh: 'កែស្វ័យប្រវត្តិពេញលេញ', en: 'Full Auto Editing' },
              { id: 'tiktok_reels', kh: 'កម្រងខ្លីៗ TikTok / Reels', en: 'TikTok / Reels Highlights' },
              { id: 'cinematic', kh: 'កែសម្រួលបែបភាពយន្ត', en: 'Cinematic Editing' },
            ].map((mode) => (
              <label
                key={mode.id}
                onClick={() => setEditingMode(mode.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  editingMode === mode.id
                    ? 'bg-purple-950/50 border-purple-500 text-white shadow-sm'
                    : 'bg-[#0c0d1e] border-[#23274c] text-slate-300 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="edit_mode"
                  checked={editingMode === mode.id}
                  onChange={() => setEditingMode(mode.id)}
                  className="mt-0.5 accent-purple-600 w-3.5 h-3.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">{mode.kh}</span>
                  <span className="text-[10px] text-slate-400 leading-tight font-medium">{mode.en}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Center-Right: Features Checkboxes (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <label className="block text-xs font-bold text-slate-200">
            មុខងារកែច្នៃ / Editing Features
          </label>
          <div className="space-y-2">
            {[
              { id: 'auto_subtitle', kh: 'បឋមកថាអក្សររត់ស្វ័យប្រវត្តិ', en: 'Auto Subtitle' },
              { id: 'remove_silence', kh: 'លុបភាពស្ងាត់ និងកំហុស', en: 'Remove Silence & Mistakes' },
              { id: 'background_music', kh: 'បន្ថែមតន្ត្រី និងការផ្លាស់ប្តូរប្លង់', en: 'Background Music & Transitions' },
            ].map((f) => (
              <label
                key={f.id}
                onClick={() => setFeatures(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  features[f.id]
                    ? 'bg-purple-950/50 border-purple-500/80 text-white shadow-sm'
                    : 'bg-[#0c0d1e] border-[#23274c] text-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border ${
                    features[f.id] ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'
                  }`}
                >
                  {features[f.id] && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">{f.kh}</span>
                  <span className="text-[10px] text-slate-400 leading-tight font-medium">{f.en}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Far Right: Aspect Ratio, Quality, and Action Button (2 cols) */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-2.5">
          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              ទម្រង់ទំហំវីដេអូ / Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: '9:16', label: '9:16', sub: 'TikTok' },
                { id: '16:9', label: '16:9', sub: 'YouTube' },
                { id: '1:1', label: '1:1', sub: 'Square' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    aspectRatio === ratio.id
                      ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-md shadow-purple-900/40'
                      : 'bg-[#0c0d1e] border-[#23274c] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold leading-tight">{ratio.label}</span>
                  <span className="text-[9px] opacity-75 leading-tight font-medium">{ratio.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              គុណភាពចេញ / Quality
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="quality_opt"
                  checked={quality === '1080p'}
                  onChange={() => setQuality('1080p')}
                  className="accent-purple-600 w-3.5 h-3.5"
                />
                <span className="text-xs font-semibold">1080p (Full HD)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="quality_opt"
                  checked={quality === '4k'}
                  onChange={() => setQuality('4k')}
                  className="accent-purple-600 w-3.5 h-3.5"
                />
                <span className="text-xs font-semibold">4K (Ultra HD)</span>
              </label>
            </div>
          </div>

          {/* Start AI Editing Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleStartEditing}
            className="w-full py-3 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50 flex items-center justify-center gap-1.5 transition-all border border-purple-400/40 active:scale-95 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isProcessing ? 'កំពុងកែច្នៃ...' : 'ចាប់ផ្តើមកែដោយ AI Start AI Editing'}</span>
          </button>

          {exportResult && (
            <a
              href={exportResult.export_url}
              download
              className="w-full py-2.5 px-3 rounded-xl text-center font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/40 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយក MP4 (Download)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
