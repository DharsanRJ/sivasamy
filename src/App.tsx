/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Database, Scale, FlaskConical, Target } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

// Store
import { useAppStore } from './store/useAppStore';

// UI Components
import { SidebarItem } from './components/ui';

// Screen Components
import { Onboarding } from './components/screens/Onboarding';
import { Dashboard } from './components/screens/Dashboard';
import { Tracker } from './components/screens/Tracker';
import { Evaluation } from './components/screens/Evaluation';
import { Lab } from './components/screens/Lab';
import { Readiness } from './components/screens/Readiness';

export default function App() {
  const { view, setView, streak } = useAppStore();

  if (view === 'onboarding') {
    return <Onboarding />;
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
          {view === 'dashboard' && <Dashboard />}
          {view === 'tracker' && <Tracker />}
          {view === 'evaluation' && <Evaluation />}
          {view === 'lab' && <Lab />}
          {view === 'readiness' && <Readiness />}
        </AnimatePresence>
      </main>
    </div>
  );
}
