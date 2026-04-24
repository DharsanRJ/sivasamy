import { supabase } from './supabase';
import { Skill, PracticeTask } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Fetches the JWT token from Supabase session to pass to the FastAPI backend.
 */
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  };
}

export const fetchDashboardData = async (userId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/users/${userId}/dashboard`, { headers });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data from API');
  }
  
  return response.json(); // { skills, recent_logs }
};

export const updateSkillAPI = async (skillId: string, proficiency: number, status: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ proficiency, status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update skill');
  }
  
  return response.json();
};

export const generateTasksAPI = async (userId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/users/${userId}/generate-tasks`, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate tasks');
  }
  
  return response.json();
};
