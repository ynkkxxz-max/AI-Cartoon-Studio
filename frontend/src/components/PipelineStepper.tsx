import React from 'react';
import { Check, BookOpen, Users, Layout, Film, Mic, Scissors, Download } from 'lucide-react';

interface PipelineStepperProps {
  currentStep: number;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, labelKh: 'គំនិតរឿង', labelEn: 'Story', icon: BookOpen },
    { num: 2, labelKh: 'តួអង្គ', labelEn: 'Characters', icon: Users },
    { num: 3, labelKh: 'រៀបចំប្លង់សាច់រឿង', labelEn: 'Scenes', icon: Layout },
    { num: 4, labelKh: 'ការចលនា', labelEn: 'Animation', icon: Film },
    { num: 5, labelKh: 'សំឡេង (KH/EN/CN)', labelEn: 'Voice', icon: Mic },
    { num: 6, labelKh: 'កែសម្រួល', labelEn: 'Editing', icon: Scissors },
    { num: 7, labelKh: 'នាំចេញ', labelEn: 'Export', icon: Download },
  ];

  return (
    <div className="bg-[#111327] rounded-2xl border border-[#1f2343] p-3.5 shadow-md">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
          <span>ដំណាក់កាលផលិត</span>
          <span className="text-[11px] font-normal text-slate-400">(Production Pipeline)</span>
        </h4>
        <span className="text-xs text-purple-400 font-bold font-mono">
          Stage {currentStep} / 7
        </span>
      </div>

      <div className="flex items-center justify-between relative px-5">
        {/* Connecting horizontal line */}
        <div className="absolute top-4 left-10 right-10 h-[2px] bg-[#1f2343] -z-0" />

        {steps.map((step) => {
          const isDone = currentStep > step.num;
          const isActive = currentStep === step.num;
          const Icon = step.icon;

          return (
            <div key={step.num} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-2 ring-emerald-500/40'
                    : isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/60 ring-2 ring-purple-400 scale-110'
                    : 'bg-[#15172f] border border-[#23274c] text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="flex flex-col items-center mt-1.5 text-center">
                <span
                  className={`text-[11px] font-bold leading-tight ${
                    isActive ? 'text-purple-300' : isDone ? 'text-slate-100' : 'text-slate-400'
                  }`}
                >
                  {step.labelKh}
                </span>
                <span className="text-[9.5px] text-slate-500 leading-tight font-medium">
                  {step.labelEn}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
