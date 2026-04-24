import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, MoreVertical, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { calibrateSkillAPI } from '../../lib/api';
import { SectionHeader, cn } from '../ui';
import { SkillStatus } from '../../types';

export const Tracker = () => {
  const { skills, updateSkill } = useAppStore();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [pendingUpdate, setPendingUpdate] = useState<{skillId: string, prof: number, status: string} | null>(null);

  const handleProficiencyClick = async (skill: any, newProf: number) => {
    if (newProf >= 4 && newProf > skill.proficiency) {
      setIsCalibrating(true);
      try {
        const response = await calibrateSkillAPI(skill.id);
        if (response.data) {
          setCalibrationData(response.data);
          setPendingUpdate({ skillId: skill.id, prof: newProf, status: newProf === 5 ? 'Mastered' : skill.status });
        }
      } catch (e) {
        console.error("Calibration failed", e);
      } finally {
        setIsCalibrating(false);
      }
    } else {
      updateSkill(skill.id, { proficiency: newProf, status: newProf === 5 ? 'Mastered' : skill.status });
    }
  };

  const handleAnswerOption = (answer: string) => {
    if (answer === calibrationData.correct_answer) {
      if (pendingUpdate) {
        updateSkill(pendingUpdate.skillId, { proficiency: pendingUpdate.prof, status: pendingUpdate.status });
      }
    } else {
      alert(`Calibration Failed.\n\nExplanation: ${calibrationData.explanation}\n\nSkill remains un-upgraded.`);
    }
    setCalibrationData(null);
    setPendingUpdate(null);
  };

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
                      <button 
                        key={i} 
                        onClick={() => handleProficiencyClick(skill, i)}
                        className={cn("h-1.5 rounded-full flex-1 transition-all hover:scale-[1.2]", i <= skill.proficiency ? "bg-brand-accent shadow-[0_0_5px_var(--color-brand-accent)]" : "bg-brand-border cursor-pointer")} 
                      />
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

      {/* Loading Overlay */}
      {isCalibrating && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="flex flex-col items-center gap-4 text-brand-accent">
              <Loader2 className="animate-spin" size={32} />
              <p className="font-bold uppercase tracking-widest text-xs">Generating Calibration Vector...</p>
           </div>
        </div>
      )}

      {/* Calibration Modal */}
      {calibrationData && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 max-w-lg w-full space-y-6 border border-brand-accent/50 shadow-2xl shadow-brand-accent/20"
          >
            <h3 className="text-xl font-black text-brand-text uppercase italic tracking-tight">Calibration Protocol</h3>
            <p className="text-sm text-brand-muted leading-relaxed font-medium">{calibrationData.question}</p>
            <div className="space-y-3">
              {calibrationData.options.map((opt: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => handleAnswerOption(opt)}
                  className="w-full text-left p-4 bg-brand-surface border border-brand-border hover:border-brand-accent hover:bg-brand-accent/5 rounded transition-all text-sm text-brand-text"
                >
                  {opt}
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setCalibrationData(null); setPendingUpdate(null); }} 
              className="text-[10px] text-brand-muted hover:text-brand-text uppercase font-bold tracking-widest transition-colors w-full text-center mt-4"
            >
              Abort Calibration
            </button>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};
