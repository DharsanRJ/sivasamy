import { Skill, PracticeTask } from '../types';

export const INITIAL_SKILLS: Skill[] = [
  { id: '1', name: 'React.js', proficiency: 3, status: 'Practicing', lastReviewed: '2 days ago', category: 'Frontend' },
  { id: '2', name: 'TypeScript', proficiency: 2, status: 'Learning', lastReviewed: 'Yesterday', category: 'Language' },
  { id: '3', name: 'Node.js', proficiency: 1, status: 'Backlog', lastReviewed: '-', category: 'Backend' },
  { id: '4', name: 'PostgreSQL', proficiency: 4, status: 'Mastered', lastReviewed: '1 week ago', category: 'Database' },
  { id: '5', name: 'Express', proficiency: 2, status: 'Learning', lastReviewed: '4 days ago', category: 'Backend' },
  { id: '6', name: 'Tailwind CSS', proficiency: 5, status: 'Mastered', lastReviewed: '3 days ago', category: 'UI/UX' },
  { id: '7', name: 'Docker', proficiency: 1, status: 'Backlog', lastReviewed: '-', category: 'DevOps' },
  { id: '8', name: 'Unit Testing (Jest)', proficiency: 2, status: 'Learning', lastReviewed: 'Yesterday', category: 'Testing' },
];

export const MOCK_PRACTICE_TASKS: PracticeTask[] = [
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

export const RADAR_DATA = [
  { subject: 'Frontend', A: 80, B: 110, fullMark: 150 },
  { subject: 'Backend', A: 40, B: 130, fullMark: 150 },
  { subject: 'Database', A: 90, B: 100, fullMark: 150 },
  { subject: 'DevOps', A: 20, B: 110, fullMark: 150 },
  { subject: 'System Design', A: 30, B: 120, fullMark: 150 },
  { subject: 'Soft Skills', A: 85, B: 90, fullMark: 150 },
];
