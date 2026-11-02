import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileVideo, LoaderCircle, Plus, Scissors, Trash2, UploadCloud, Volume2 } from 'lucide-react';
import { editingApi } from '../services/editingApi';
import type { EditorClip, EditorMedia, SilenceAnalysis } from '../services/editingApi';

type TimelineClip = EditorClip & { key: number; label: string };
const panel = 'rounded-xl border border-[#292b50] bg-[#0c0d1e] p-3';
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-purple-400/40 bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40';
const subtle = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#35385d] bg-[#191b34] px-3 py-2 text-xs text-slate-200 hover:bg-[#242646] disabled:cursor-not-allowed disabled:opacity-40';
const seconds = (value: number) => `${value.toFixed(2)}s`;
const message = (error: unknown) => error instanceof Error ? error.message : 'ការងារមិនបានសម្រេច / Operation failed';

export function ClipTimelineEditor() {
  const [sources, setSources] = useState<EditorMedia[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, SilenceAnalysis>>({});
  const [fade, setFade] = useState(false);
  const [aspect, setAspect] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<EditorMedia | null>(null);
  const [dragging, setDragging] = useState(false);
  const sourceVideo = useRef<HTMLVideoElement>(null);
  const playbackEnd = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);
  const source = sources.find(item => item.video_id === sourceId);
  const analysis = source ? analyses[source.video_id] : undefined;
  const validRange = Boolean(source && range.start >= 0 && range.end <= source.duration && range.end - range.start >= 0.1 - 0.000001);
  const totalDuration = clips.reduce((sum, clip) => sum + clip.end_time - clip.start_time, 0) - (fade ? Math.max(0, clips.length - 1) * 0.25 : 0);
  const hasShortFade = fade && clips.some(clip => clip.end_time - clip.start_time <= 0.5);
  const keepSpans = analysis?.keep_segments ?? [];
  const shortKeepSpans = keepSpans.filter(span => span.end_time - span.start_time < 0.1 - 0.000001).length;

  const invalidate = () => { setResult(null); setError(''); setNotice(''); };
  const selectSource = (id: string) => {
    const selected = sources.find(item => item.video_id === id);
    if (!selected) return;
    invalidate();
    playbackEnd.current = null;
    setSourceId(id);
    setRange({ start: 0, end: selected.duration });
  };

  async function run(label: string, operation: () => Promise<void>) {
    if (busy) return;
    setBusy(label);
    invalidate();
    try { await operation(); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(''); }
  }

  async function upload(files: FileList | File[]) {
    if (busy || !files.length) return;
    const selectedFiles = Array.from(files);
    await run('កំពុង Upload វីដេអូ / Uploading videos…', async () => {
      const added: EditorMedia[] = [];
      const failures: string[] = [];
      for (const file of selectedFiles) {
        if (!/\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)) {
          failures.push(`${file.name}: សូមប្រើ MP4, MOV, AVI, MKV ឬ WebM។`);
          continue;
        }
        try { added.push(await editingApi.upload(file)); }
        catch (cause) { failures.push(`${file.name}: ${message(cause)}`); }
      }
      if (added.length) {
        setSources(previous => [...previous, ...added]);
        if (!source) {
          setSourceId(added[0].video_id);
          setRange({ start: 0, end: added[0].duration });
        }
        setNotice(`បាន Upload ${added.length} វីដេអូ / ${added.length} video(s) uploaded`);
      }
      if (failures.length) setError(failures.join('\n'));
      if (fileInput.current) fileInput.current.value = '';
    });
  }

  function updateRange(which: 'start' | 'end', value: number) {
    if (!source || !Number.isFinite(value)) return;
    invalidate();
    playbackEnd.current = null;
    setRange(previous => which === 'start'
      ? { ...previous, start: Math.max(0, Math.min(value, previous.end - 0.1)) }
      : { ...previous, end: Math.min(source.duration, Math.max(value, previous.start + 0.1)) });
  }

  function addClip() {
    if (!source || !validRange) return;
    if (clips.length >= 12) { setError('Timeline អាចមានបាន ១២ clips។ សូមនាំចេញ ឬដក clip មួយចេញសិន។ / Maximum 12 clips.'); return; }
    invalidate();
    setClips(previous => [...previous, { key: nextKey.current++, label: source.filename, video_id: source.video_id, start_time: range.start, end_time: range.end }]);
  }

  function moveClip(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= clips.length) return;
    invalidate();
    setClips(previous => { const moved = [...previous]; [moved[index], moved[next]] = [moved[next], moved[index]]; return moved; });
  }

  function applyKeepSpans() {
    if (!source || !analysis || !analysis.has_audio || !keepSpans.length || shortKeepSpans || keepSpans.length > 12) return;
    invalidate();
    setFade(false);
    setClips(keepSpans.map(span => ({ ...span, video_id: source.video_id, label: source.filename, key: nextKey.current++ })));
    setNotice('បានជំនួស Timeline ដោយចន្លោះដែលត្រូវរក្សា។ សូមពិនិត្យ រួចចុច Export Timeline។ / Timeline replaced with reviewed keep spans.');
  }

  async function exportTimeline() {
    if (!clips.length || hasShortFade) return;
    await run('កំពុងនាំចេញ Timeline / Exporting timeline…', async () => {
      const first = clips[0];
      const media = clips.length === 1
        ? await editingApi.trim(first.video_id, first.start_time, first.end_time)
        : await editingApi.merge(clips.map(({ video_id, start_time, end_time }) => ({ video_id, start_time, end_time })), fade ? 0.25 : 0);
      setResult(media);
    });
  }

  function continueEditing() {
    if (!result || busy) return;
    const exported = result;
    invalidate();
    playbackEnd.current = null;
    setSources(previous => previous.some(item => item.video_id === exported.video_id) ? previous : [...previous, exported]);
    setSourceId(exported.video_id);
    setRange({ start: 0, end: exported.duration });
    setNotice('បានជ្រើសឯកសារដែលនាំចេញសម្រាប់កែបន្ត។ / Export selected as the source for further editing.');
  }

  return (
    <section aria-label="Video clip editor" className="rounded-2xl border border-[#292b50] bg-[#111327] p-4 text-left shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#292b50] pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><FileVideo className="h-5 w-5 text-purple-400" /> កាត់ និងភ្ជាប់វីដេអូ <span className="font-normal text-slate-400">/ Clip Editor</span></h2>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-[11px] text-emerald-300">Local editing · MP4 export</span>
      </div>
      <input ref={fileInput} id="clip-video-upload" aria-label="Upload source videos" type="file" multiple accept=".mp4,.mov,.avi,.mkv,.webm" className="sr-only" disabled={Boolean(busy)} onChange={event => { if (event.target.files) void upload(event.target.files); }} />
      <button type="button" disabled={Boolean(busy)} onClick={() => fileInput.current?.click()}
        onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) void upload(event.dataTransfer.files); }}
        className={`flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 text-sm transition-colors disabled:opacity-50 ${dragging ? 'border-purple-400 bg-purple-900/30' : 'border-purple-500/40 bg-[#0c0d1e] hover:border-purple-400'}`}>
        <UploadCloud className="h-6 w-6 text-purple-300" /><span>ជ្រើស ឬអូសវីដេអូចូល / Upload videos <small className="block text-xs text-slate-400">MP4 · MOV · AVI · MKV · WebM · multiple files</small></span>
      </button>

      <fieldset disabled={Boolean(busy)} className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 disabled:opacity-70">
        <legend className="sr-only">Source video and trim selection</legend>
        <div className={`${panel} space-y-3`}>
          <label htmlFor="clip-source" className="block text-xs font-semibold text-slate-200">១. ជ្រើសវីដេអូ / Source video</label>
          <select id="clip-source" value={sourceId} onChange={event => selectSource(event.target.value)} disabled={!sources.length || Boolean(busy)} className="w-full rounded-lg border border-[#35385d] bg-[#16182e] px-3 py-2 text-xs text-white">
            {!sources.length && <option value="">Upload a video to begin / សូម Upload វីដេអូ</option>}
            {sources.map(item => <option key={item.video_id} value={item.video_id}>{item.filename} · {seconds(item.duration)}</option>)}
          </select>
          {source ? <>
            <video key={source.video_id} ref={sourceVideo} src={source.stream_url} controls preload="metadata" className="aspect-video max-h-72 w-full rounded-lg bg-black"
              onError={() => setError('មិនអាចចាក់វីដេអូនេះបាន។ សូម Upload ម្ដងទៀត បើឯកសារត្រូវបានផ្លាស់ទី។ / Source preview could not load. Re-upload if the file is unavailable.')}
              onTimeUpdate={() => { const video = sourceVideo.current; if (video && playbackEnd.current !== null && video.currentTime >= playbackEnd.current) { video.pause(); playbackEnd.current = null; } }}>
              Your browser does not support video playback.
            </video>
            <p className="break-all text-xs text-slate-400">{source.width} × {source.height} · {seconds(source.duration)} · {source.filename}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="clip-start" className="block text-xs text-slate-300">ចាប់ផ្ដើម / Start (s)</label><input id="clip-start" type="number" min="0" max={Math.max(0, range.end - 0.1)} step="0.01" value={Number(range.start.toFixed(3))} onChange={event => updateRange('start', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[#35385d] bg-[#16182e] p-2 text-sm text-white" /></div>
              <div><label htmlFor="clip-end" className="block text-xs text-slate-300">បញ្ចប់ / End (s)</label><input id="clip-end" type="number" min={range.start + 0.1} max={source.duration} step="0.01" value={Number(range.end.toFixed(3))} onChange={event => updateRange('end', Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[#35385d] bg-[#16182e] p-2 text-sm text-white" /></div>
            </div>
            <div className="space-y-2"><label htmlFor="clip-start-slider" className="block text-xs text-slate-400">Start trim handle</label><input id="clip-start-slider" type="range" min="0" max={source.duration} step="0.01" value={range.start} onChange={event => updateRange('start', Number(event.target.value))} className="w-full accent-purple-500" /><label htmlFor="clip-end-slider" className="block text-xs text-slate-400">End trim handle</label><input id="clip-end-slider" type="range" min="0" max={source.duration} step="0.01" value={range.end} onChange={event => updateRange('end', Number(event.target.value))} className="w-full accent-blue-500" /></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={subtle} disabled={!validRange} onClick={() => { const video = sourceVideo.current; if (video) { video.currentTime = range.start; playbackEnd.current = range.end; void video.play().catch(cause => setError(message(cause))); } }}>មើលចន្លោះ / Play selection</button>
              <button type="button" className={subtle} disabled={!validRange || clips.length >= 12} onClick={addClip}><Plus className="h-3.5 w-3.5" /> បន្ថែម / Add clip</button>
              <button type="button" className={button} disabled={!validRange} onClick={() => void run('កំពុងកាត់វីដេអូ / Trimming video…', async () => setResult(await editingApi.trim(source.video_id, range.start, range.end)))}><Scissors className="h-3.5 w-3.5" /> Export selection</button>
            </div>
            <p className="text-xs text-slate-400">ចន្លោះដែលបានជ្រើស / Selected: {seconds(Math.max(0, range.end - range.start))} · minimum 0.10s</p>
          </> : <div className="flex aspect-video items-center justify-center rounded-lg border border-[#292b50] bg-black/30 text-sm text-slate-500">វីដេអូរបស់អ្នកនឹងបង្ហាញនៅទីនេះ / Your video preview</div>}
        </div>

        <div className="space-y-3">
          <div className={`${panel} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-white">២. ចន្លោះស្ងាត់ / Quiet audio</h3><button type="button" className={subtle} disabled={!source} onClick={() => source && void run('កំពុងរកចន្លោះស្ងាត់ / Analyzing quiet audio…', async () => { const data = await editingApi.analyze(source.video_id); setAnalyses(previous => ({ ...previous, [source.video_id]: data })); })}><Volume2 className="h-3.5 w-3.5" /> Analyze silence</button></div>
            <p className="text-xs leading-relaxed text-slate-400">ពិនិត្យចន្លោះមុនកាត់។ ការវិភាគរកតែសំឡេងស្ងាត់។ / Review quiet spans before cutting.</p>
            {analysis && <div className="space-y-2 text-xs">
              {!analysis.has_audio ? <p className="text-amber-200">វីដេអូនេះគ្មាន audio track។ រក្សាវីដេអូទាំងមូល។ / No audio track; keep the full video.</p>
                : !keepSpans.length ? <p className="text-amber-200">Audio ស្ងាត់ទាំងមូល។ សូមជ្រើសចន្លោះដោយដៃ។ / All audio is quiet; choose a range manually.</p>
                  : <p className="text-slate-300">{analysis.silence_segments.length} quiet span(s) · {keepSpans.length} keep span(s)</p>}
              {analysis.silence_segments.length > 0 && <div className="max-h-24 overflow-auto flex flex-wrap gap-1.5" aria-label="Detected quiet spans">{analysis.silence_segments.map((span, index) => <span key={index} className="rounded border border-amber-600/40 bg-amber-950/30 px-2 py-1 text-amber-200">{seconds(span.start_time)}–{seconds(span.end_time)}</span>)}</div>}
              {shortKeepSpans > 0 && <p className="text-amber-200">មាន {shortKeepSpans} ចន្លោះខ្លីជាង 0.10s។ សូមកាត់ដោយដៃ។ / Some keep spans are too short; trim manually.</p>}
              {keepSpans.length > 12 && <p className="text-amber-200">មានចន្លោះច្រើនជាង ១២។ សូមកាត់ជាផ្នែកៗ។ / More than 12 keep spans; trim in batches.</p>}
              <button type="button" className={subtle} disabled={!analysis.has_audio || !keepSpans.length || Boolean(shortKeepSpans) || keepSpans.length > 12} onClick={applyKeepSpans}>យកចន្លោះរក្សាទៅ Timeline / Replace timeline with keep spans</button>
              <p className="text-[11px] text-slate-500">ជំនួសបញ្ជី clips បច្ចុប្បន្ន ហើយអ្នកត្រូវចុច Export ដើម្បីរក្សាឯកសារ។ / Replaces the current clip list; export when ready.</p>
            </div>}
          </div>
          <div className={`${panel} space-y-2`}>
            <h3 className="text-xs font-semibold text-white">ប្ដូរទំហំវីដេអូដើម / Convert source aspect</h3>
            <div className="flex flex-wrap gap-2"><select aria-label="Export aspect ratio" value={aspect} onChange={event => { invalidate(); setAspect(event.target.value as typeof aspect); }} className="rounded-lg border border-[#35385d] bg-[#16182e] px-3 py-2 text-xs text-white"><option value="9:16">9:16 · TikTok / Reels</option><option value="16:9">16:9 · YouTube</option><option value="1:1">1:1 · Square</option></select><button type="button" className={subtle} disabled={!source} onClick={() => source && void run('កំពុងប្ដូរទំហំ / Converting source…', async () => setResult(await editingApi.convert(source.video_id, aspect)))}>Convert source</button></div>
            <p className="text-[11px] text-slate-500">បម្លែងវីដេអូដើមទាំងមូល / Converts the full selected source to 1080p.</p>
          </div>
        </div>
      </fieldset>

      <fieldset disabled={Boolean(busy)} className={`${panel} min-w-0 space-y-3 disabled:opacity-70`}>
        <legend className="sr-only">Ordered clip timeline</legend>
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-white">៣. Timeline <span className="text-xs font-normal text-slate-400">{clips.length}/12 clips</span></h3><span className="text-xs text-purple-200">{seconds(Math.max(0, totalDuration))} estimated output</span></div>
        {!clips.length ? <p className="rounded-lg border border-dashed border-[#35385d] p-5 text-center text-xs text-slate-400">ជ្រើសចន្លោះ រួចចុច Add clip។ / Select a range, then add a clip.</p> : <ol className="max-h-72 space-y-2 overflow-y-auto" aria-label="Timeline clip order">{clips.map((clip, index) => <li key={clip.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#35385d] bg-[#16182e] p-2.5"><span className="rounded bg-purple-500/20 px-2 py-1 text-xs font-bold text-purple-200">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs text-white" title={clip.label}>{clip.label}</p><p className="text-[11px] text-slate-400">{seconds(clip.start_time)}–{seconds(clip.end_time)} · {seconds(clip.end_time - clip.start_time)}</p></div><button type="button" className={subtle} aria-label={`Move clip ${index + 1} earlier`} disabled={index === 0} onClick={() => moveClip(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" className={subtle} aria-label={`Move clip ${index + 1} later`} disabled={index === clips.length - 1} onClick={() => moveClip(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" className={subtle} aria-label={`Remove clip ${index + 1} from timeline`} onClick={() => { invalidate(); setClips(previous => previous.filter(item => item.key !== clip.key)); }}><Trash2 className="h-3.5 w-3.5" /></button></li>)}</ol>}
        <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={fade} onChange={event => { invalidate(); setFade(event.target.checked); }} className="accent-purple-500" /> ផ្លាស់ប្ដូររលូន / 0.25s crossfade</label><button type="button" className={button} disabled={!clips.length || hasShortFade} onClick={() => void exportTimeline()}><Download className="h-4 w-4" /> នាំចេញ Timeline / Export timeline</button></div>
        {hasShortFade && <p className="text-xs text-amber-200">Crossfade ត្រូវការ clip នីមួយៗវែងជាង 0.50s។ បិទ crossfade ឬជ្រើស clip វែងជាងនេះ។ / Each clip must exceed 0.50s for crossfade.</p>}
      </fieldset>

      {busy && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-950/40 p-3 text-sm text-purple-200"><LoaderCircle className="h-4 w-4 animate-spin" />{busy}</div>}
      {error && <p role="alert" className="whitespace-pre-wrap rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs leading-relaxed text-rose-200">{error}</p>}
      {notice && <p role="status" className="text-xs leading-relaxed text-emerald-300">{notice}</p>}
      {result && <div className="grid gap-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-3 md:grid-cols-2"><video key={result.stream_url} src={result.stream_url} controls preload="metadata" className="aspect-video max-h-72 w-full rounded-lg bg-black" onError={() => setError('មិនអាចចាក់ឯកសារនាំចេញបាន។ សូមសាកល្បងតំណទាញយក ឬ Export ម្ដងទៀត។ / Export preview could not load; try the download link or export again.')} /><div className="flex flex-col items-start justify-center gap-3"><h3 className="text-sm font-semibold text-emerald-300">នាំចេញរួចរាល់ / Export ready</h3><p className="break-all text-xs text-slate-300">{result.filename}</p><p className="text-xs text-slate-400">{result.width} × {result.height} · {seconds(result.duration)}</p>{result.export_url && <a href={result.export_url} download className={button}><Download className="h-4 w-4" /> ទាញយក MP4 / Download MP4</a>}<button type="button" disabled={Boolean(busy)} className={subtle} onClick={continueEditing}>កែឯកសារនេះបន្ត / Continue editing this export</button></div></div>}
      <p className="text-[11px] leading-relaxed text-slate-500">Auto-subtitles, music និង AI highlights កំពុងរៀបចំ។ / Auto-subtitles, music and AI highlights are planned.</p>
    </section>
  );
}
