/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  ChevronRight, 
  LayoutDashboard, 
  Database, 
  Scale, 
  FlaskConical, 
  Target, 
  Flame, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  MoreVertical,
  ShieldAlert,
  Search,
  ExternalLink,
  Zap,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type Persona = 'Job Switcher' | 'Fresher' | 'Upskilling Engineer';
type SkillStatus = 'Backlog' | 'Learning' | 'Practicing' | 'Mastered';

interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5
  status: SkillStatus;
  lastReviewed: string;
  category: string;
}

interface PracticeTask {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  status: 'Pending' | 'Completed';
  tags: string[];
}

// --- Mock Data ---

const INITIAL_SKILLS: Skill[] = [
  { id: '1', name: 'React.js', proficiency: 3, status: 'Practicing', lastReviewed: '2 days ago', category: 'Frontend' },
  { id: '2', name: 'TypeScript', proficiency: 2, status: 'Learning', lastReviewed: 'Yesterday', category: 'Language' },
  { id: '3', name: 'Node.js', proficiency: 1, status: 'Backlog', lastReviewed: '-', category: 'Backend' },
  { id: '4', name: 'PostgreSQL', proficiency: 4, status: 'Mastered', lastReviewed: '1 week ago', category: 'Database' },
  { id: '5', name: 'Express', proficiency: 2, status: 'Learning', lastReviewed: '4 days ago', category: 'Backend' },
  { id: '6', name: 'Tailwind CSS', proficiency: 5, status: 'Mastered', lastReviewed: '3 days ago', category: 'UI/UX' },
  { id: '7', name: 'Docker', proficiency: 1, status: 'Backlog', lastReviewed: '-', category: 'DevOps' },
  { id: '8', name: 'Unit Testing (Jest)', proficiency: 2, status: 'Learning', lastReviewed: 'Yesterday', category: 'Testing' },
];

const MOCK_PRACTICE_TASKS: PracticeTask[] = [
  {
    id: 'pt1',
    title: 'Cross-Pollination: API + Logic',
    description: 'Implement a rate-limiting middleware in Express that tracks user attempts in Redis and resets every 60 seconds.',
    difficulty: 'Intermediate',
    estimatedTime: '45 mins',
    status: 'Pending',
    tags: ['Express', 'Node.js', 'Logic']
  },
  {
    id: 'pt2',
    title: 'UI Integration: Animation + State',
    description: 'Create a complex multi-step form using Framer Motion with progressive disclosure based on prior inputs.',
    difficulty: 'Advanced',
    estimatedTime: '1 hr 30 mins',
    status: 'Pending',
    tags: ['React', 'Framer Motion']
  }
];

const RADAR_DATA = [
  { subject: 'Frontend', A: 80, B: 110, fullMark: 150 },
  { subject: 'Backend', A: 40, B: 130, fullMark: 150 },
  { subject: 'Database', A: 90, B: 100, fullMark: 150 },
  { subject: 'DevOps', A: 20, B: 110, fullMark: 150 },
  { subject: 'System Design', A: 30, B: 120, fullMark: 150 },
  { subject: 'Soft Skills', A: 85, B: 90, fullMark: 150 },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-[13px] font-medium",
      active ? "bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20" : "text-brand-muted hover:text-brand-text hover:bg-brand-surface"
    )}
  >
    <Icon size={16} className={cn(active ? "text-brand-bg" : "text-brand-muted group-hover:text-brand-text")} />
    <span>{label}</span>
  </button>
);

const SectionHeader = ({ title, description }: { title: string, description?: string }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold tracking-tight text-brand-text">{title}</h1>
    {description && <p className="text-brand-muted mt-1 text-sm">{description}</p>}
  </div>
);

// --- main App ---

export default function App() {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'tracker' | 'evaluation' | 'lab' | 'readiness'>('onboarding');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [streak, setStreak] = useState(12);

  // --- Handlers ---

  const handleStartOnboarding = (p: Persona) => {
    setPersona(p);
    setOnboardingStep(2);
  };

  const handleFinishOnboarding = () => {
    setView('dashboard');
  };

  // --- Renderers ---

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-brand-text">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full glass p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Zap size={120} />
          </div>

          {onboardingStep === 1 ? (
            <div className="space-y-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-accent rounded-xl mb-6 shadow-lg shadow-brand-accent/20 rotate-3">
                  <GraduationCap className="text-brand-bg" size={32} />
                </div>
                <h1 className="text-4xl font-black text-brand-text uppercase italic tracking-tighter">Initialize Matrix</h1>
                <p className="text-brand-muted mt-2 text-sm uppercase tracking-widest font-bold">Phase 01: Persona Selection</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { id: 'Job Switcher' as Persona, icon: Briefcase, desc: 'Seeking rapid role pivot' },
                  { id: 'Fresher' as Persona, icon: Users, desc: 'Building core bedrock' },
                  { id: 'Upskilling Engineer' as Persona, icon: Target, desc: 'Surgical skill upgrades' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleStartOnboarding(p.id)}
                    className="p-6 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent transition-all text-left group"
                  >
                    <p.icon size={20} className="text-brand-muted group-hover:text-brand-accent mb-4" />
                    <h3 className="font-bold text-brand-text text-sm uppercase italic">{p.id}</h3>
                    <p className="text-[11px] text-brand-muted mt-2 leading-relaxed">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : onboardingStep === 2 ? (
            <div className="space-y-10">
              <div>
                <button 
                  onClick={() => setOnboardingStep(1)} 
                  className="text-[10px] font-bold text-brand-muted hover:text-brand-accent uppercase tracking-widest mb-6 inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={12} /> Back to Selection
                </button>
                <h2 className="text-3xl font-black text-brand-text uppercase italic">Mission Parameters</h2>
                <p className="text-brand-muted text-sm mt-1 uppercase tracking-widest font-bold">Phase 02: Goal Calibration</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Target Objective</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Architect at Tier 1 Product Company"
                    className="w-full px-4 py-4 bg-brand-bg rounded border border-brand-border focus:border-brand-accent outline-none text-sm transition-colors"
                  />
                </div>
                
                <div className="grid gap-3">
                  {[
                    { id: 'assess', icon: FlaskConical, title: 'TECHNICAL ASSESSMENT', subtitle: '40 core calibration prompts' },
                    { id: 'resume', icon: Database, title: 'RESUME INGESTION', subtitle: 'AI-powered mapping & gap detection' },
                    { id: 'skip', icon: ChevronRight, title: 'AUTOPILOT START', subtitle: 'Pre-populate with role defaults' }
                  ].map((opt) => (
                    <button 
                      key={opt.id}
                      onClick={() => setOnboardingStep(3)}
                      className="flex items-center gap-5 p-5 rounded bg-brand-surface border border-brand-border hover:border-brand-accent text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded bg-brand-bg flex items-center justify-center border border-brand-border group-hover:border-brand-accent/50">
                        <opt.icon size={18} className="text-brand-muted group-hover:text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-text text-xs uppercase tracking-wider">{opt.title}</h4>
                        <p className="text-[10px] text-brand-muted uppercase mt-0.5">{opt.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-success/10 rounded-full mb-4 border border-brand-success/20">
                <CheckCircle2 className="text-brand-success" size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-brand-text uppercase italic">System Active</h2>
                <p className="text-brand-muted mt-2 text-sm uppercase tracking-widest font-bold">Calibration Complete</p>
              </div>
              <p className="text-brand-muted max-w-sm mx-auto text-sm leading-relaxed">
                Mapped 12 capability nodes and 4 execution modules based on your vector. The engine is ready.
              </p>
              <button 
                onClick={handleFinishOnboarding}
                className="btn-primary w-full max-w-xs py-4 shadow-xl shadow-brand-accent/20"
              >
                ACCESS DASHBOARD
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-brand-border bg-brand-bg sticky top-0 h-screen p-6 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-brand-accent rounded-md flex items-center justify-center shadow-lg shadow-brand-accent/20">
            <span className="text-brand-bg font-bold">S</span>
          </div>
          <span className="text-lg font-black tracking-tighter uppercase">SkillStack <span className="opacity-50">Command</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="DASHBOARD" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={Database} label="MATRIX" active={view === 'tracker'} onClick={() => setView('tracker')} />
          <SidebarItem icon={Scale} label="EVALUATION" active={view === 'evaluation'} onClick={() => setView('evaluation')} />
          <SidebarItem icon={FlaskConical} label="LAB" active={view === 'lab'} onClick={() => setView('lab')} />
          <SidebarItem icon={Target} label="READINESS" active={view === 'readiness'} onClick={() => setView('readiness')} />
        </nav>

        <div className="p-4 bg-brand-surface border border-brand-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="streak-badge">🔥 {streak} DAY STREAK</div>
          </div>
          <p className="text-[10px] text-brand-muted leading-relaxed uppercase tracking-widest font-bold mt-2">Level 4: Architect</p>
          <div className="h-1 w-full bg-brand-border rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-brand-accent w-3/4 rounded-full" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
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
          )}

          {view === 'tracker' && (
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
                        {INITIAL_SKILLS.filter(s => s.status === status).length}
                      </span>
                    </div>
                    {INITIAL_SKILLS.filter(s => s.status === status).map((skill) => (
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
          )}

          {view === 'evaluation' && (
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
          )}

          {view === 'lab' && (
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
          )}

          {view === 'readiness' && (
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
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
