import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Zap, GraduationCap, Briefcase, Users, Target, FlaskConical, Database, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Persona } from '../../types';
import { supabase } from '../../lib/supabase';
import { uploadResumeAPI } from '../../lib/api';

export const Onboarding = () => {
  const { onboardingStep, setOnboardingStep, setPersona, setView, setUser, user } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (isLoginMode) {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          setUser({ id: data.session.user.id, email: data.session.user.email || '', currentStreak: 0 });
        }
      } else {
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { username } }
        });
        if (error) throw error;
        if (data.session) {
          setUser({ id: data.session.user.id, email: data.session.user.email || '', currentStreak: 0 });
        } else {
          alert('Sign up successful! Check your email to verify if required.');
        }
      }
    } catch (error: any) {
      console.error('Error authenticating:', error);
      alert(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStartOnboarding = (p: Persona) => {
    setPersona(p);
    setOnboardingStep(2);
  };

  const handleOptionClick = (optId: string) => {
    if (optId === 'resume') {
      fileInputRef.current?.click();
    } else {
      setOnboardingStep(3);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      setUploadSuccess(false);
      try {
        await uploadResumeAPI(user.id, file);
        setUploadSuccess(true);
        setTimeout(() => setOnboardingStep(3), 1500);
      } catch (err: any) {
        console.error("Failed to upload resume", err);
        alert("Upload Failed: " + err.message);
      } finally {
        setIsUploading(false);
      }
    }
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
          <div className="space-y-8 py-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-accent rounded-xl mb-6 shadow-lg shadow-brand-accent/20 rotate-3">
                <Zap className="text-brand-bg" size={32} />
              </div>
              <h1 className="text-4xl font-black text-brand-text uppercase italic tracking-tighter">SkillStack</h1>
              <p className="text-brand-muted mt-2 text-sm uppercase tracking-widest font-bold">
                {isLoginMode ? 'Access Required' : 'Initialize Identity'}
              </p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4 max-w-sm mx-auto">
              {!isLoginMode && (
                <div>
                  <input 
                    type="text" 
                    placeholder="USERNAME" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border focus:border-brand-accent rounded text-sm text-brand-text uppercase tracking-wider"
                    required
                  />
                </div>
              )}
              <div>
                <input 
                  type="email" 
                  placeholder="EMAIL ADDRESS" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border focus:border-brand-accent rounded text-sm text-brand-text uppercase tracking-wider"
                  required
                />
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border focus:border-brand-accent rounded text-sm text-brand-text uppercase tracking-wider"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isAuthenticating}
                className="btn-primary w-full py-4 shadow-xl shadow-brand-accent/20 flex items-center justify-center mt-2"
              >
                {isAuthenticating ? 'AUTHENTICATING...' : isLoginMode ? 'LOGIN' : 'SIGN UP'}
              </button>
            </form>
            
            <div className="text-center">
              <button 
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-[10px] text-brand-muted hover:text-brand-accent uppercase font-bold tracking-widest transition-colors"
              >
                {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Login'}
              </button>
            </div>
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
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                />
                {[
                  { id: 'assess', icon: FlaskConical, title: 'TECHNICAL ASSESSMENT', subtitle: '40 core calibration prompts' },
                  { id: 'resume', icon: Database, title: 'RESUME INGESTION', subtitle: uploadSuccess ? 'RESUME UPLOADED! AI REVIEWING...' : (isUploading ? 'UPLOADING...' : 'AI-powered mapping & gap detection') },
                  { id: 'skip', icon: ChevronRight, title: 'AUTOPILOT START', subtitle: 'Pre-populate with role defaults' }
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => handleOptionClick(opt.id)}
                    disabled={isUploading}
                    className="flex items-center gap-5 p-5 rounded bg-brand-surface border border-brand-border hover:border-brand-accent text-left transition-all group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded bg-brand-bg flex items-center justify-center border border-brand-border group-hover:border-brand-accent/50">
                      <opt.icon size={18} className="text-brand-muted group-hover:text-brand-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-text text-xs uppercase tracking-wider">{opt.title}</h4>
                      <p className={`text-[10px] uppercase mt-0.5 ${opt.id === 'resume' && uploadSuccess ? 'text-brand-success font-bold' : 'text-brand-muted'}`}>{opt.subtitle}</p>
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
