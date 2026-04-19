import { create } from 'zustand';
import { AppView, Persona, Skill, PracticeTask, User } from '../types';
import { INITIAL_SKILLS, MOCK_PRACTICE_TASKS } from '../data/mock';
import { fetchDashboardData, updateSkillAPI } from '../lib/api';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
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
  updateSkill: (id: string, updates: Partial<Skill>) => Promise<void>;
  
  practiceTasks: PracticeTask[];
  setPracticeTasks: (tasks: PracticeTask[]) => void;

  loadDashboard: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
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
  updateSkill: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      skills: state.skills.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
    
    // Sync with API
    if (updates.proficiency !== undefined && updates.status !== undefined) {
      try {
        await updateSkillAPI(id, updates.proficiency, updates.status);
      } catch (e) {
        console.error("Failed to update skill API", e);
      }
    }
  },
  
  practiceTasks: MOCK_PRACTICE_TASKS,
  setPracticeTasks: (tasks) => set({ practiceTasks: tasks }),

  loadDashboard: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const data = await fetchDashboardData(user.id);
      if (data.skills && data.skills.length > 0) {
        set({ skills: data.skills });
      }
    } catch (error) {
      console.error("Failed to load dashboard data from API, using mock.", error);
    }
  }
}));
