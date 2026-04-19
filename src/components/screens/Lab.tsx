import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { SectionHeader } from '../ui';

export const Lab = () => {
  return (
    <motion.div 
      key="lab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]"
    >
      <div className="flex flex-col h-full gap-6">
        <SectionHeader title="AI Execution Zone" description="Proving capability through cross-pollinated builds." />
        
        <div className="flex-1 bg-brand-bg rounded-lg p-8 overflow-auto text-brand-muted font-mono text-sm leading-relaxed border border-brand-border shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4">
            <span className="flex items-center gap-2 px-3 py-1 bg-brand-success/10 text-brand-success rounded-full text-[10px] font-bold border border-brand-success/20">
              <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" /> ENGINE: GPT-4-MINI
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-brand-surface rounded border border-brand-border">
              <p className="text-brand-accent font-bold mb-2 uppercase text-[10px] tracking-widest">Target Integration</p>
              <p className="text-brand-text text-lg font-bold font-sans tracking-tight">Automated Performance Pipeline</p>
            </div>

            <p className="text-brand-accent opacity-60 italic">// GENERATED_SCENARIO_v12.4</p>
            <p>
              Combine your recent <span className="text-brand-text underline underline-offset-4 decoration-brand-accent">Python Automation</span> research with <span className="text-brand-text underline underline-offset-4 decoration-brand-accent">PostgreSQL Optimization</span>.
            </p>

            <div className="space-y-4 pl-4 border-l-2 border-brand-border">
              <p className="text-brand-muted">1. Extract 10,000 mock user credentials from <span className="text-brand-text font-bold">users_v2.csv</span> using a custom Python script.</p>
              <p className="text-brand-muted">2. Implement an upsert logic that prevents duplicate entries based on email hashing.</p>
              <p className="text-brand-muted">3. Write a SQL query to identify "orphaned" sessions that haven't refreshed their TTL token in 5 minutes.</p>
            </div>

            <p className="text-orange-400/80 text-[11px] uppercase font-bold tracking-widest">! CONSTRAINT: Do not use ORMs. Use raw psycopg2 for database interactions.</p>
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
                placeholder="https://github.com/user/project" 
                className="w-full px-4 py-3 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-brand-text text-sm transition-colors"
               />
               <input 
                type="url" 
                placeholder="Loom / Demo / Gist Link" 
                className="w-full px-4 py-3 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-brand-text text-sm transition-colors"
               />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Technical Reflection</label>
              <textarea 
                placeholder="Detail the technical blocker encountered..."
                className="w-full h-32 px-4 py-3 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-brand-text text-sm transition-colors resize-none"
              />
            </div>
          </div>

          <div className="mt-8">
            <button className="btn-primary w-full py-4 flex items-center justify-center gap-3">
              COMPLETE INTEGRATION <ArrowRight size={18} />
            </button>
            <p className="text-center text-[10px] text-brand-muted mt-4 italic uppercase tracking-widest font-bold">
              Successful submission triggers the Quality Gate streak
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
