import React from 'react';
import { BookOpen, Check, Download, Film, Layout, Mic, Scissors, Users } from 'lucide-react';

interface PipelineStepperProps { currentStep: number }

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentStep }) => {
  const stages = [
    { number: 1, kh: 'គំនិតរឿង', en: 'Story', icon: BookOpen },
    { number: 2, kh: 'តួអង្គ', en: 'Characters', icon: Users },
    { number: 3, kh: 'ប្លង់សាច់រឿង', en: 'Scenes', icon: Layout },
    { number: 4, kh: 'ការចលនា', en: 'Animation', icon: Film },
    { number: 5, kh: 'សំឡេង', en: 'Voice', icon: Mic },
    { number: 6, kh: 'កែសម្រួល', en: 'Editing', icon: Scissors },
    { number: 7, kh: 'នាំចេញ', en: 'Export', icon: Download },
  ];
  const stage = Math.min(7, Math.max(1, currentStep));
  return (
    <section className="studio-card min-w-0 overflow-x-auto px-3.5 py-2.5" aria-labelledby="production-pipeline-title">
      <div className="mb-2 flex items-center justify-between gap-2"><h2 id="production-pipeline-title" className="text-[11px] font-semibold text-slate-200">ដំណាក់កាលផលិត <span className="ml-1 text-[10px] font-normal text-slate-500">Production pipeline</span></h2><span className="text-[9px] text-violet-300">Stage {stage} / 7</span></div>
      <ol className="relative grid min-w-[420px] grid-cols-7 gap-1" aria-label="Production stages">
        {stages.map(({ number, kh, en, icon: Icon }) => {
          const complete = number < stage;
          const active = number === stage;
          return <li key={number} aria-current={active ? 'step' : undefined} className="relative flex flex-col items-center gap-1">
            {number < 7 && <span aria-hidden="true" className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-3 h-px ${complete ? 'bg-emerald-500/30' : 'bg-[#2b2d46]'}`} />}
            <span className={`relative flex h-6 w-6 items-center justify-center rounded-full border ${complete ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300' : active ? 'border-violet-400/70 bg-violet-500/20 text-violet-200 ring-2 ring-violet-500/10' : 'border-[#30324d] bg-[#181a2c] text-slate-600'}`}>{complete ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}</span>
            <span className={`text-center text-[10px] font-medium leading-[1.25] ${active ? 'text-violet-200' : complete ? 'text-slate-300' : 'text-slate-500'}`}>{kh}<span className="mt-0.5 block text-[8px] font-normal text-slate-500">{en}</span></span>
            <span className="sr-only">{complete ? 'Completed' : active ? 'Current stage' : 'Upcoming'}</span>
          </li>;
        })}
      </ol>
    </section>
  );
};
