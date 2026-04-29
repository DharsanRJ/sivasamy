import { create } from 'zustand';
import { AppView, Persona, Skill, PracticeTask, User } from '../types';
import { fetchDashboardData, updateSkillAPI } from '../lib/api';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  isInitialized: boolean;
  setIsInitialized: (val: boolean) => void;
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
  generateAITasks: () => Promise<void>;
  isGeneratingTasks: boolean;

  loadDashboard: () => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isInitialized: false,
  setIsInitialized: (val) => set({ isInitialized: val }),
  view: 'onboarding',
  setView: (view) => set({ view }),
  persona: null,
  setPersona: (persona) => set({ persona }),
  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  streak: 0,
  setStreak: (streak) => set({ streak }),
  
  skills: [],
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
  
  practiceTasks: [],
  setPracticeTasks: (tasks) => set({ practiceTasks: tasks }),
  isGeneratingTasks: false,
  
  generateAITasks: async () => {
    const user = get().user;
    if (!user) return;
    
    set({ isGeneratingTasks: true });
    try {
      // Import api dynamically or use the top level import if we had it
      // Let's assume we imported generateTasksAPI at the top already. Wait, let me check top imports.
      // I'll just use a local require or fetch if needed, but I'll add the import via another call.
      const { generateTasksAPI } = await import('../lib/api');
      const response = await generateTasksAPI(user.id);
      
      if (response?.data?.tasks) {
        // Map AI response to frontend model
        const newTasks: PracticeTask[] = response.data.tasks.map((t: any, index: number) => ({
          id: `ai-task-${Date.now()}-${index}`,
          title: t.title,
          description: t.description,
          relatedSkillId: get().skills[0]?.id || 'unknown', // Best effort match or pass along
          difficulty: t.difficulty,
          status: 'Pending',
          type: 'Project',
          duration: `${t.duration_minutes}m`,
          criteria: t.criteria || []
        }));
        
        set({ practiceTasks: newTasks });
      }
    } catch (e) {
      console.error("Failed to generate AI tasks", e);
    } finally {
      set({ isGeneratingTasks: false });
    }
  },

  loadDashboard: async () => {
    const user = get().user;
    if (!user) return false;
    try {
      const data = await fetchDashboardData(user.id);
      if (data.skills && data.skills.length > 0) {
        set({ skills: data.skills });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to load dashboard data from API, using mock.", error);
      return false;
    }
  }
}));

// Expose store to window for E2E testing
if (import.meta.env.DEV) {
  (window as any).useAppStore = useAppStore;
}
