/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Database, Scale, FlaskConical, Target, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { uploadResumeAPI } from './lib/api';

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
  const { view, setView, streak, user, setUser, skills, isInitialized, setIsInitialized, loadDashboard } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute user level from mastered skills
  const masteredCount = skills.filter(s => s.status === 'Mastered').length;
  const getLevel = (n: number) => {
    if (n >= 9) return { label: 'Level 4: Architect', pct: 95 };
    if (n >= 6) return { label: 'Level 3: Engineer', pct: (n - 6) / 3 * 100 };
    if (n >= 3) return { label: 'Level 2: Practitioner', pct: (n - 3) / 3 * 100 };
    return { label: 'Level 1: Recruit', pct: n / 3 * 100 };
  };
  const { label: levelLabel, pct: levelPct } = getLevel(masteredCount);

  const handleLogout = async () => {
    const { supabase } = await import('./lib/supabase');
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '', currentStreak: 0 });
        const hasData = await loadDashboard();
        if (hasData) {
          setView('dashboard');
        } else {
          setView('onboarding');
        }
      } else {
        setView('onboarding');
      }
      setIsInitialized(true);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '', currentStreak: 0 });
      } else {
        setUser(null);
        setView('onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, loadDashboard, setView, setIsInitialized]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      setUploadSuccess(false);
      try {
        await uploadResumeAPI(user.id, file);
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          loadDashboard();
        }, 3000); 
      } catch (err: any) {
        console.error("Failed to upload resume", err);
        alert("Upload Failed: " + err.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
      </div>
    );
  }

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
          <div className="flex items-center gap-2 mb-1">
            <div className="streak-badge">🔥 {streak} DAY STREAK</div>
          </div>
          <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold mt-1 truncate">{user?.email}</p>
          <p className="text-[10px] text-brand-muted leading-relaxed uppercase tracking-widest font-bold mt-2 mb-2">{levelLabel}</p>
          <div className="h-1 w-full bg-brand-border rounded-full mt-2 overflow-hidden mb-4">
            <div className="h-full bg-brand-accent rounded-full transition-all duration-700" style={{ width: `${Math.max(levelPct, 5)}%` }} />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".pdf" 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-2 border text-[10px] uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded mb-2 ${uploadSuccess ? 'bg-brand-success/10 border-brand-success text-brand-success' : 'bg-brand-bg border-brand-border hover:border-brand-accent text-brand-muted hover:text-brand-text'}`}
          >
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : (uploadSuccess ? <CheckCircle2 size={12} /> : <UploadCloud size={12} />)}
            {isUploading ? 'Parsing...' : (uploadSuccess ? 'Resume Uploaded!' : 'Upload Resume')}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-brand-bg border border-brand-border hover:border-red-400/50 hover:text-red-400 text-brand-muted rounded text-[10px] uppercase font-bold tracking-widest transition-all"
          >
            Logout
          </button>
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
