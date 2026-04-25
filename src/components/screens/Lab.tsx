import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { SectionHeader } from '../ui';
import { useAppStore } from '../../store/useAppStore';
import { submitLabLogAPI } from '../../lib/api';

export const Lab = () => {
  const { practiceTasks, isGeneratingTasks, generateAITasks, user } = useAppStore();
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const activeTask = practiceTasks[0];
  
  return (
    <motion.div 
      key="lab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]"
    >
      <div className="flex flex-col h-full gap-6">
        <SectionHeader title="AI Execution Zone" description="Proving capability through cross-pollinated builds." />
        
        <div className="flex-1 bg-brand-bg rounded-lg p-8 overflow-auto text-brand-muted font-mono text-sm leading-relaxed border border-brand-border shadow-2xl relative flex flex-col">
          <div className="absolute top-0 right-0 p-4">
            <span className="flex items-center gap-2 px-3 py-1 bg-brand-success/10 text-brand-success rounded-full text-[10px] font-bold border border-brand-success/20">
              <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" /> ENGINE: GEMINI-1.5-FLASH
            </span>
          </div>
          
          <div className="flex-1 space-y-6">
            {practiceTasks.length > 0 ? (
              practiceTasks.map((task, i) => (
                <div key={task.id} className="mb-8 border-b border-brand-border pb-8 last:border-0">
                  <div className="p-4 bg-brand-surface rounded border border-brand-border mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-brand-accent font-bold mb-1 uppercase text-[10px] tracking-widest">Target Integration</p>
                        <p className="text-brand-text text-lg font-bold font-sans tracking-tight">{task.title}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-brand-bg border border-brand-border">
                        {task.difficulty} • {task.duration}
                      </span>
                    </div>
                  </div>

                  <p className="text-brand-accent opacity-60 italic mb-2">// GENERATED_SCENARIO_v{i + 1}</p>
                  <p className="mb-4">{task.description}</p>
                  
                  {task.criteria && task.criteria.length > 0 && (
                    <div className="space-y-3 pl-4 border-l-2 border-brand-border">
                      {task.criteria.map((c, j) => (
                         <p key={j} className="text-brand-muted"><span className="text-brand-text font-bold">{j+1}.</span> {c}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-brand-muted">No active lab tasks. Generate a new simulation.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-brand-border">
            <button 
              onClick={generateAITasks}
              disabled={isGeneratingTasks}
              className="w-full py-3 bg-brand-surface border border-brand-border hover:border-brand-accent text-brand-text font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isGeneratingTasks ? 'GENERATING...' : 'GENERATE NEW LAB TASKS'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full gap-6">
        <div className="glass p-8 flex flex-col h-full">
          <div className="card-header-label">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>SUBMISSION PORTAL</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-8 mt-4">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Artifact Repository</label>
               <input 
                type="url" 
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/project" 
                className="w-full px-4 py-3 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-brand-text text-sm transition-colors"
               />
               <input 
                type="url" 
                value={demoUrl}
                onChange={e => setDemoUrl(e.target.value)}
                placeholder="Loom / Demo / Gist Link" 
                className="w-full px-4 py-3 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-brand-text text-sm transition-colors"
               />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Technical Reflection</label>
              <textarea 
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="Detail the technical blocker encountered..."
                className="w-full h-32 px-4 py-3 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-brand-text text-sm transition-colors resize-none"
              />
            </div>
          </div>

          <div className="mt-8">
            {submitSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="text-brand-success mx-auto mb-2" size={32} />
                <p className="text-brand-success font-bold text-sm uppercase tracking-widest">Submission Logged!</p>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  if (!user || !activeTask) return;
                  setIsSubmitting(true);
                  try {
                    const feedback = `GitHub: ${githubUrl || 'N/A'} | Demo: ${demoUrl || 'N/A'} | Reflection: ${reflection || 'N/A'}`;
                    await submitLabLogAPI(user.id, activeTask.title, feedback);
                    setSubmitSuccess(true);
                    setGithubUrl(''); setDemoUrl(''); setReflection('');
                  } catch (err: any) {
                    alert('Submit failed: ' + err.message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting || !activeTask}
                className="btn-primary w-full py-4 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>COMPLETE INTEGRATION <ArrowRight size={18} /></>}
              </button>
            )}
            <p className="text-center text-[10px] text-brand-muted mt-4 italic uppercase tracking-widest font-bold">
              Successful submission is logged to your activity feed
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
