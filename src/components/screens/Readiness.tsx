import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SectionHeader } from '../ui';
import { RADAR_DATA } from '../../data/mock';

export const Readiness = () => {
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
            <div className="card-header-label">
              <span>CRITICAL GAPS</span>
            </div>
            <div className="space-y-4">
              {[
                { skill: 'Distributed Systems', gap: '7/10', priority: 'High' },
                { skill: 'System Design', gap: '9/10', priority: 'High' },
                { skill: 'Cloud Native', gap: '5/10', priority: 'Medium' }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-brand-bg/50 rounded border border-brand-border group hover:border-brand-accent transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[13px] font-bold text-brand-text">{item.skill}</span>
                    <span className="text-[11px] font-mono text-brand-accent">{item.gap}</span>
                  </div>
                  <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-brand-border">
                     <div className="h-full bg-brand-accent" style={{ width: item.skill === 'System Design' ? '90%' : item.skill === 'Cloud Native' ? '50%' : '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-accent to-blue-600 rounded-lg p-6 text-brand-bg shadow-xl flex flex-col justify-between h-[240px]">
            <div>
              <h4 className="text-xl font-bold uppercase tracking-tight leading-none mb-2">Portfolio Locked</h4>
              <p className="text-brand-bg/80 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                Metrics mapped to public validation link.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-bg/20 p-4 rounded border border-brand-bg/10 backdrop-blur-sm">
                <p className="text-[9px] uppercase font-bold opacity-70 mb-1">Artifacts</p>
                <p className="text-2xl font-black font-mono tracking-tighter text-brand-bg italic">12</p>
              </div>
              <div className="bg-brand-bg/20 p-4 rounded border border-brand-bg/10 backdrop-blur-sm">
                <p className="text-[9px] uppercase font-bold opacity-70 mb-1">Validation</p>
                <p className="text-2xl font-black font-mono tracking-tighter text-brand-bg italic">88%</p>
              </div>
            </div>
            <button className="w-full py-2.5 bg-brand-bg text-brand-accent rounded font-bold text-xs uppercase tracking-widest mt-4 hover:brightness-125 transition-all">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
