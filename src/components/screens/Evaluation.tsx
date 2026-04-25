import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scale, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SectionHeader } from '../ui';
import { useAppStore } from '../../store/useAppStore';
import { calibrateSkillAPI } from '../../lib/api';

export const Evaluation = () => {
  const { skills, updateSkill } = useAppStore();
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [targetLevel, setTargetLevel] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);

  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  const handleEvaluate = async () => {
    if (!selectedSkillId) return;
    setIsLoading(true);
    setResult(null);
    try {
      const response = await calibrateSkillAPI(selectedSkillId);
      if (response.data) setCalibrationData(response.data);
    } catch (e) {
      alert('Failed to generate evaluation question. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (answer === calibrationData.correct_answer) {
      setResult('pass');
      if (selectedSkill) {
        updateSkill(selectedSkillId, { proficiency: targetLevel, status: targetLevel === 5 ? 'Mastered' : selectedSkill.status });
      }
    } else {
      setResult('fail');
    }
    setCalibrationData(null);
  };

  const handleReset = () => { setResult(null); setCalibrationData(null); };

  return (
    <motion.div 
      key="evaluation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <SectionHeader title="Skill Evaluation Hub" description="Select a skill to prove your proficiency via AI-generated challenge." />
      
      <div className="glass overflow-hidden">
        <div className="bg-brand-surface p-6 md:p-8 border-b border-brand-border">
          <div className="flex flex-col gap-6">
            {skills.length === 0 ? (
              <p className="text-brand-muted text-sm text-center py-4">No skills found. Upload your resume or add skills on the Matrix tab first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] block mb-2">Select Skill to Evaluate</label>
                  <select
                    value={selectedSkillId}
                    onChange={e => { setSelectedSkillId(e.target.value); setResult(null); setCalibrationData(null); }}
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-accent rounded text-sm text-brand-text"
                  >
                    <option value="">-- Choose a skill --</option>
                    {skills.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Level {s.proficiency})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] block mb-2">Target Level: {targetLevel}</label>
                  <input
                    type="range" min="1" max="5" value={targetLevel}
                    onChange={e => setTargetLevel(Number(e.target.value))}
                    className="w-full h-2 bg-brand-border rounded-full appearance-none cursor-pointer accent-brand-accent mt-3"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-brand-muted uppercase">
                    <span>L1: Beginner</span><span>L3: Mid</span><span>L5: Master</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-12 space-y-8">

          {/* Result states */}
          {result === 'pass' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="text-brand-success" size={48} />
              <h3 className="text-2xl font-black uppercase italic">Calibration Passed!</h3>
              <p className="text-brand-muted text-sm">Your proficiency for <strong className="text-brand-text">{selectedSkill?.name}</strong> has been upgraded to Level {targetLevel}.</p>
              <button onClick={handleReset} className="btn-primary mt-4">Evaluate Another Skill</button>
            </motion.div>
          )}

          {result === 'fail' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center">
              <AlertTriangle className="text-orange-400" size={48} />
              <h3 className="text-2xl font-black uppercase italic">Calibration Failed</h3>
              <p className="text-brand-muted text-sm">Skill level remains unchanged. Study more and try again!</p>
              <button onClick={handleReset} className="btn-primary mt-4">Try Again</button>
            </motion.div>
          )}

          {/* AI Question */}
          {calibrationData && !result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="card-header-label">
                <div className="flex items-center gap-2"><Scale size={16} /><span>AI CALIBRATION QUESTION</span></div>
              </div>
              <p className="text-brand-text italic border-l-2 border-brand-accent pl-4 py-2 text-sm leading-relaxed font-medium">
                {calibrationData.question}
              </p>
              <div className="grid gap-3">
                {calibrationData.options.map((opt: string, i: number) => (
                  <button key={i} onClick={() => handleAnswer(opt)}
                    className="text-left p-4 bg-brand-surface border border-brand-border hover:border-brand-accent hover:bg-brand-accent/5 rounded transition-all text-sm text-brand-text">
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Start button */}
          {!calibrationData && !result && (
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={handleReset} className="px-6 py-2.5 rounded-md font-bold text-brand-muted hover:text-brand-text transition-all text-sm uppercase tracking-widest">Reset</button>
              <button
                onClick={handleEvaluate}
                disabled={!selectedSkillId || isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : 'Start Calibration'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
