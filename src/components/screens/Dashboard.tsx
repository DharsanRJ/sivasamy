import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ArrowRight, AlertTriangle, BarChart3, ShieldAlert, FlaskConical, Zap, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SectionHeader, cn } from '../ui';
import { fetchLogsAPI } from '../../lib/api';

export const Dashboard = () => {
  const { setView, loadDashboard, user, skills } = useAppStore();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboard();
      fetchLogsAPI(user.id).then(r => setLogs(r.data || [])).catch(() => {});
    }
  }, [user, loadDashboard]);

  // Computed values from real skill data
  const criticalGaps = [...skills]
    .filter(s => s.proficiency <= 2)
    .sort((a, b) => a.proficiency - b.proficiency)
    .slice(0, 3);

  const masteredOrPracticing = skills.filter(s => s.status === 'Mastered' || s.status === 'Practicing').length;
  const retentionScore = skills.length > 0 ? Math.round((masteredOrPracticing / skills.length) * 100) : 0;

  const weakestSkill = [...skills].sort((a, b) => a.proficiency - b.proficiency)[0];

  // Format log timestamp
  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const logColor = (title: string) => {
    if (title?.toLowerCase().includes('review')) return 'bg-brand-accent';
    if (title?.toLowerCase().includes('failed')) return 'bg-red-400';
    return 'bg-brand-success';
  };

  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex justify-between items-start mb-8">
        <SectionHeader title="Dashboard Command" description={skills.length > 0 ? `Tracking ${skills.length} skills. Focus on your weakest areas.` : 'Upload your resume to get started.'} />
        <div className="flex gap-2">
          <div className="px-4 py-2 glass flex items-center gap-2">
            <Calendar size={14} className="text-brand-muted" />
            <span className="text-sm font-medium">{skills.length} SKILLS TRACKED</span>
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
            {weakestSkill ? (
              <>
                <div className="card-header-label">
                  <div className="flex items-center gap-2 text-brand-accent">
                    <AlertTriangle size={16} />
                    <span>PRIORITY FOCUS: WEAKEST SKILL</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{weakestSkill.name}</h3>
                <p className="text-brand-muted text-sm mb-6 max-w-md leading-relaxed">
                  Currently at Level {weakestSkill.proficiency}/5 ({weakestSkill.status}). Go to the Lab to generate a targeted practice task for this skill.
                </p>
                <button 
                  onClick={() => setView('lab')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Launch Lab <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="card-header-label">
                  <div className="flex items-center gap-2 text-brand-accent">
                    <FileText size={16} />
                    <span>GET STARTED</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Upload Your Resume to Begin</h3>
                <p className="text-brand-muted text-sm mb-6 max-w-md leading-relaxed">
                  Use the "Upload Resume" button in the sidebar. The AI will extract your skills and populate your Matrix automatically.
                </p>
                <button onClick={() => setView('tracker')} className="btn-primary inline-flex items-center gap-2">
                  Go to Matrix <ArrowRight size={18} />
                </button>
              </>
            )}
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
                {criticalGaps.length > 0 ? criticalGaps.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-2 hover:bg-brand-bg/50 rounded-md cursor-pointer transition-colors group" onClick={() => setView('tracker')}>
                    <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent">{skill.name}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= skill.proficiency ? "bg-brand-accent shadow-[0_0_8px_var(--color-brand-accent)]" : "bg-brand-border")} />
                      ))}
                    </div>
                  </div>
                )) : (
                  <p className="text-brand-muted text-xs py-4 text-center">No critical gaps — great work!</p>
                )}
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
                <div className="text-4xl font-bold font-mono mb-1">{retentionScore}%</div>
                <div className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Skill Mastery Score</div>
              </div>
              <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${retentionScore}%` }}
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
                  <span>SKILL DISTRIBUTION</span>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                {(['Mastered', 'Practicing', 'Learning', 'Backlog'] as const).map(status => {
                  const count = skills.filter(s => s.status === status).length;
                  const pct = skills.length > 0 ? (count / skills.length) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span className="text-brand-muted">{status}</span>
                        <span className="text-brand-text">{count}</span>
                      </div>
                      <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
                        <div className="h-full bg-brand-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {skills.length === 0 && (
                <p className="text-brand-muted text-[10px] text-center mt-4 uppercase">Upload resume to see distribution</p>
              )}
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
            {logs.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-brand-border">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="pl-6 relative">
                    <div className={cn("absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-brand-bg shadow-sm", logColor(log.task_title))} />
                    <p className="text-[10px] text-brand-muted font-mono uppercase">{formatTime(log.completed_at)}</p>
                    <p className="text-sm text-brand-text font-medium leading-tight mt-0.5">{log.task_title}</p>
                    {log.feedback && <p className="text-[10px] text-brand-muted mt-1 leading-relaxed line-clamp-2">{log.feedback}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-muted text-xs text-center py-6">No activity yet. Upload a resume or complete a lab task!</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
