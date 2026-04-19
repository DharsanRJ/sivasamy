import { create } from 'zustand';
import { AppView, Persona, Skill, PracticeTask } from '../types';
import { INITIAL_SKILLS, MOCK_PRACTICE_TASKS } from '../data/mock';

interface AppState {
  view: AppView;
  setView: (view: AppView) => void;
  persona: Persona | null;
  setPersona: (persona: Persona | null) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  streak: number;
  setStreak: (streak: number) => void;
  
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  
  practiceTasks: PracticeTask[];
  setPracticeTasks: (tasks: PracticeTask[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'onboarding',
  setView: (view) => set({ view }),
  persona: null,
  setPersona: (persona) => set({ persona }),
  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  streak: 12,
  setStreak: (streak) => set({ streak }),
  
  skills: INITIAL_SKILLS,
  setSkills: (skills) => set({ skills }),
  addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
  updateSkill: (id, updates) => set((state) => ({
    skills: state.skills.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  
  practiceTasks: MOCK_PRACTICE_TASKS,
  setPracticeTasks: (tasks) => set({ practiceTasks: tasks }),
}));
