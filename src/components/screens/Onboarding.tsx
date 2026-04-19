import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, GraduationCap, Briefcase, Users, Target, FlaskConical, Database, ChevronRight, CheckCircle2, ArrowRight, Github } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Persona } from '../../types';
import { supabase } from '../../lib/supabase';

export const Onboarding = () => {
  const { onboardingStep, setOnboardingStep, setPersona, setView, setUser, user } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          currentStreak: 0
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          currentStreak: 0
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      setIsAuthenticating(false);
    }
  };

  const handleStartOnboarding = (p: Persona) => {
    setPersona(p);
    setOnboardingStep(2);
  };

  const handleFinishOnboarding = () => {
    setView('dashboard');
  };

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

        {!user ? (
          <div className="space-y-10 text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-accent rounded-xl mb-6 shadow-lg shadow-brand-accent/20 rotate-3">
              <Zap className="text-brand-bg" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-brand-text uppercase italic tracking-tighter">SkillStack Identity</h1>
              <p className="text-brand-muted mt-2 text-sm uppercase tracking-widest font-bold">Secure Access Required</p>
            </div>
            <button 
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="btn-primary w-full max-w-xs py-4 shadow-xl shadow-brand-accent/20 flex items-center justify-center gap-3 mx-auto"
            >
              <Github size={20} />
              {isAuthenticating ? 'CONNECTING...' : 'CONTINUE WITH GITHUB'}
            </button>
            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">
              By connecting, you agree to the matrix protocols.
            </p>
          </div>
        ) : onboardingStep === 1 ? (
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
};
