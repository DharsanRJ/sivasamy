import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Loader2, Target } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { generateMockInterviewAPI } from '../../lib/api';
import { SectionHeader } from '../ui';
import { RADAR_DATA } from '../../data/mock';

export const Readiness = () => {
  const { user } = useAppStore();
  const [jdText, setJdText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);

  const handleGenerateInterview = async () => {
    if (!user || !jdText) return;
    setIsGenerating(true);
    try {
      const response = await generateMockInterviewAPI(user.id, jdText);
      if (response.data) {
        setInterviewData(response.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      key="readiness"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-start">
        <SectionHeader title="Readiness Analytics" description="Translating internal capability into shareable hiring assets." />
        <button className="btn-primary flex items-center gap-2">
          <ExternalLink size={18} /> EXPORT PORTFOLIO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart */}
        <div className="lg:col-span-2 glass p-8 flex flex-col">
          <div className="card-header-label">
            <span>ROLE ALIGNMENT MAP</span>
            <span className="text-brand-accent uppercase">Lead Cloud Architect</span>
          </div>
          <div className="flex-1 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Your Capability"
                  dataKey="A"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fill="#38BDF8"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Target Role"
                  dataKey="B"
                  stroke="#334155"
                  strokeWidth={2}
                  fill="#334155"
                  fillOpacity={0.1}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-brand-accent rounded-full shadow-[0_0_8px_var(--color-brand-accent)]" />
               <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Your Levels</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-brand-border rounded-full" />
               <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Industry Baseline</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass p-6">
            <div className="card-header-label mb-4">
              <span>MOCK INTERVIEW SIMULATOR</span>
            </div>
            
            {!interviewData ? (
              <div className="space-y-4">
                <textarea 
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste Target Job Description (JD) here..."
                  className="w-full h-40 bg-brand-bg/50 border border-brand-border rounded p-4 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition-colors resize-none placeholder:text-brand-muted/50"
                />
                <button 
                  onClick={handleGenerateInterview}
                  disabled={isGenerating || !jdText}
                  className="w-full py-3 bg-brand-surface border border-brand-border hover:border-brand-accent text-brand-text font-bold text-xs uppercase tracking-widest rounded flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                  {isGenerating ? 'ANALYZING GAPS & GENERATING...' : 'GENERATE INTERVIEW PLAN'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-brand-accent uppercase tracking-wider">{interviewData.title}</h4>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {interviewData.questions.map((q: any, i: number) => (
                    <div key={i} className="p-4 bg-brand-bg/50 rounded border border-brand-border">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[13px] font-bold text-brand-text leading-relaxed">Q{i + 1}. {q.question}</span>
                      </div>
                      <div className="space-y-1 mt-4 pl-3 border-l-2 border-brand-accent/30">
                        <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-2">Expected Key Points:</p>
                        {q.expected_key_points.map((point: string, j: number) => (
                          <p key={j} className="text-[11px] text-brand-muted leading-relaxed">• {point}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setInterviewData(null)}
                  className="w-full py-3 border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text transition-colors rounded text-[10px] uppercase font-bold tracking-widest mt-4"
                >
                  New Simulation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
