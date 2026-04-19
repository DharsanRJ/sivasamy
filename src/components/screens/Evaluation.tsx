import React from 'react';
import { motion } from 'motion/react';
import { Database, ShieldAlert, Scale } from 'lucide-react';
import { SectionHeader } from '../ui';

export const Evaluation = () => {
  return (
    <motion.div 
      key="evaluation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <SectionHeader title="Skill Evaluation Hub" description="Deep calibration utilizing the strict 1-5 Confidence Scale." />
      
      <div className="glass overflow-hidden">
        <div className="bg-brand-surface p-6 md:p-8 border-b border-brand-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-bg rounded-lg flex items-center justify-center border border-brand-border shadow-inner">
                <Database className="text-brand-accent" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold">SQL Indexing & Optimization</h3>
                <p className="text-brand-muted text-xs font-mono uppercase mt-1">Last evaluated 14 days ago</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-400/10 text-orange-400 px-4 py-2 rounded border border-orange-400/20 text-xs font-bold uppercase tracking-widest">
               <ShieldAlert size={14} /> Calibration Required
            </div>
          </div>
        </div>

        <div className="p-6 md:p-12 space-y-12">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-brand-muted uppercase tracking-[0.2em]">Current Confidence</label>
              <span className="text-4xl font-black text-brand-accent mono">Level 3</span>
            </div>
            <div className="relative">
              <input 
                type="range" 
                min="1" max="5" defaultValue="3"
                className="w-full h-2 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-accent"
              />
              <div className="flex justify-between mt-4 text-[10px] font-bold text-brand-muted uppercase tracking-tighter">
                <span>L1: Beginner</span>
                <span>L2: Junior</span>
                <span>L3: Mid-Level</span>
                <span>L4: Senior</span>
                <span>L5: Master</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-bg/50 rounded-lg p-6 md:p-8 space-y-6 border border-brand-border">
            <div className="card-header-label">
               <div className="flex items-center gap-2">
                <Scale size={16} />
                <span>CALIBRATION PROMPTS</span>
               </div>
            </div>
            <p className="text-brand-text italic border-l-2 border-brand-accent pl-4 py-2 text-sm leading-relaxed">
              "To achieve Level 4, you must explain the internal B-tree traversal of a composite index without referencing documentation."
            </p>
            
            <div className="grid gap-3">
              {[
                "I can explain this in under 2 minutes to a junior.",
                "I had to Google basic syntax in the last 7 days.",
                "I have implemented this in a production project.",
                "I can architect a system from scratch using this."
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-3 p-4 bg-brand-surface rounded border border-brand-border hover:border-brand-accent cursor-pointer transition-all">
                  <input type="checkbox" className="w-4 h-4 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent" />
                  <span className="text-sm font-medium text-brand-muted">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button className="px-6 py-2.5 rounded-md font-bold text-brand-muted hover:text-brand-text transition-all text-sm uppercase tracking-widest">Cancel</button>
            <button className="btn-primary">Submit Score</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
