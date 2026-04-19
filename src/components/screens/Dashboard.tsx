import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRight, AlertTriangle, BarChart3, ShieldAlert, FlaskConical, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SectionHeader, cn } from '../ui';

export const Dashboard = () => {
  const { setView, loadDashboard, user } = useAppStore();

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex justify-between items-start mb-8">
        <SectionHeader title="Dashboard Command" description="Priority execution for today. Focused on 2 target modules." />
        <div className="flex gap-2">
          <div className="px-4 py-2 glass flex items-center gap-2">
            <Calendar size={14} className="text-brand-muted" />
            <span className="text-sm font-medium">WEEK 4 / 12</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Action */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-6 relative overflow-hidden group border-l-4 border-l-brand-accent">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={80} />
            </div>
            <div className="card-header-label">
              <div className="flex items-center gap-2 text-brand-accent">
                <Clock size={16} />
                <span>NEXT STEP: 45M FOCUSED BLOCK</span>
              </div>
              <span className="mono">#442</span>
            </div>
            <h3 className="text-xl font-bold mb-4">Finalize "Redis Rate Limiter" Integration</h3>
            <p className="text-brand-muted text-sm mb-6 max-w-md leading-relaxed">
              You've mastered the theory of KV stores. Today, you prove it by wiring the middleware to our Express boilerplate.
            </p>
            <button 
              onClick={() => setView('lab')}
              className="btn-primary inline-flex items-center gap-2"
            >
              Launch Lab <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass p-5">
              <div className="card-header-label">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-orange-400" size={16} />
                  <span>CRITICAL GAPS</span>
                </div>
              </div>
              <div className="space-y-3">
                {['TypeScript Generics', 'SQL Indexing', 'Docker Compose'].map((skill, idx) => (
                  <div key={skill} className="flex items-center justify-between p-2 hover:bg-brand-bg/50 rounded-md cursor-pointer transition-colors group">
                    <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent">{skill}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= (idx === 0 ? 2 : 1) ? "bg-brand-accent shadow-[0_0_8px_var(--color-brand-accent)]" : "bg-brand-border")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass p-5">
              <div className="card-header-label">
                <div className="flex items-center gap-2 text-brand-accent">
                  <BarChart3 size={16} />
                  <span>QUALITY GATE</span>
                </div>
              </div>
              <div className="text-center py-4">
                <div className="text-4xl font-bold font-mono mb-1">92%</div>
                <div className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Retention Score</div>
              </div>
              <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  className="h-full bg-brand-success shadow-[0_0_10px_var(--color-brand-success)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-brand-surface to-brand-bg p-6 rounded-lg border border-brand-border shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="card-header-label">
                <div className="flex items-center gap-2 text-brand-accent">
                  <ShieldAlert size={14} />
                  <span>FRIDAY INTEGRATION</span>
                </div>
              </div>
              <h4 className="text-lg font-bold mb-4 italic text-brand-text">The "Cross-Pollination" Project</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Docker', 'Postgres', 'Express'].map(tag => (
                  <div key={tag} className="focus-tag px-2 py-0.5 rounded text-[10px] font-mono border border-brand-accent/30 bg-brand-accent/10 text-brand-accent">{tag}</div>
                ))}
              </div>
              <button className="w-full py-2.5 bg-brand-surface border border-brand-border text-brand-text rounded-md font-bold text-xs uppercase tracking-widest hover:border-brand-accent transition-colors">
                02d 14h 22m
              </button>
            </div>
            <div className="absolute -bottom-6 -right-6 text-brand-accent/5 rotate-12 pointer-events-none">
              <FlaskConical size={120} />
            </div>
          </div>

          <div className="glass p-6">
            <div className="card-header-label">
              <div className="flex items-center gap-2 text-brand-muted">
                <Clock size={16} />
                <span>RECENT ACTIVITY</span>
              </div>
            </div>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-brand-border">
              {[
                { time: '2h ago', text: 'Completed "Express Middleware" lab', color: 'bg-brand-success' },
                { time: '5h ago', text: 'Updated proficiency for React Hooks', color: 'bg-brand-accent' },
                { time: 'Yesterday', text: 'Failed mock interview: System Design', color: 'bg-red-400' },
              ].map((item, i) => (
                <div key={i} className="pl-6 relative">
                  <div className={cn("absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-brand-bg shadow-sm", item.color)} />
                  <p className="text-[10px] text-brand-muted font-mono uppercase">{item.time}</p>
                  <p className="text-sm text-brand-text font-medium leading-tight mt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
