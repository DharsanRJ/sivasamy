export type Persona = 'Job Switcher' | 'Fresher' | 'Upskilling Engineer';
export type SkillStatus = 'Backlog' | 'Learning' | 'Practicing' | 'Mastered';
export type AppView = 'onboarding' | 'dashboard' | 'tracker' | 'evaluation' | 'lab' | 'readiness';

export interface User {
  id: string;
  email: string;
  persona?: Persona;
  targetRole?: string;
  currentStreak: number;
}

export interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5
  status: SkillStatus;
  lastReviewed: string;
  category: string;
}

export interface PracticeTask {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  status: 'Pending' | 'Completed';
  tags: string[];
}
