import React from 'react';
import { motion } from 'motion/react';
import { Plus, MoreVertical } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SectionHeader, cn } from '../ui';
import { SkillStatus } from '../../types';

export const Tracker = () => {
  const { skills } = useAppStore();

  return (
    <motion.div 
      key="tracker"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
    >
      <div className="flex justify-between items-center mb-8">
        <SectionHeader title="The Matrix" description="Replace generic completion with actual capability mapping." />
        <button className="btn-primary flex items-center gap-2">
           <Plus size={16} /> ADD SKILL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(['Backlog', 'Learning', 'Practicing', 'Mastered'] as SkillStatus[]).map((status) => (
          <div key={status} className="kanban-column">
            <div className="flex justify-between items-center px-1 mb-2">
              <h3 className="font-bold text-brand-muted text-[10px] uppercase tracking-widest">{status}</h3>
              <span className="bg-brand-surface text-brand-muted text-[10px] font-bold px-2 py-0.5 rounded border border-brand-border">
                {skills.filter(s => s.status === status).length}
              </span>
            </div>
            {skills.filter(s => s.status === status).map((skill) => (
              <div key={skill.id} className="skill-pill group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] uppercase font-bold text-brand-muted py-0.5 px-1 bg-brand-bg/50 rounded">{skill.category}</span>
                  <button className="text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={14} />
                  </button>
                </div>
                <h4 className="font-bold text-brand-text mb-3 text-sm">{skill.name}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 flex-1 max-w-[80px]">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={cn("h-1 rounded-full flex-1", i <= skill.proficiency ? "bg-brand-accent shadow-[0_0_5px_var(--color-brand-accent)]" : "bg-brand-border")} />
                    ))}
                  </div>
                  <span className="text-[9px] text-brand-muted font-mono uppercase italic">{skill.lastReviewed}</span>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border border-dashed border-brand-border rounded-md text-brand-muted hover:text-brand-accent hover:border-brand-accent transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
               <Plus size={14} /> ADD {status}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
