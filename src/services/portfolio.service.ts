import { apiClient } from '../config/axios';

// ---- Education ----
export interface Education {
  id?: string;
  school_name: string;  // API field
  degree: string;
  start_date: string;   // "YYYY-MM-DD"
  end_date?: string | null;
  description?: string;
}

// ---- Experience ----
export interface Experience {
  id?: string;
  company_name: string; // API field
  position: string;
  start_date: string;   // "YYYY-MM-DD"
  end_date?: string | null;
  description?: string;
}

// ---- Skill (API uses array of strings) ----
export interface Skill {
  id?: string;
  name: string;
}

export const portfolioService = {
  // ----- EDUCATIONS -----
  getEducations: async (): Promise<Education[]> => {
    const res = await apiClient.get('/portfolio/educations');
    return res.data?.data ?? res.data ?? [];
  },
  addEducation: async (payload: Omit<Education, 'id'>): Promise<Education> => {
    const res = await apiClient.post('/portfolio/educations', payload);
    return res.data?.data ?? res.data;
  },
  updateEducation: async (id: string, payload: Partial<Omit<Education, 'id'>>): Promise<Education> => {
    const res = await apiClient.put(`/portfolio/educations/${id}`, payload);
    return res.data?.data ?? res.data;
  },
  deleteEducation: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/educations/${id}`);
  },

  // ----- EXPERIENCES -----
  getExperiences: async (): Promise<Experience[]> => {
    const res = await apiClient.get('/portfolio/experiences');
    return res.data?.data ?? res.data ?? [];
  },
  addExperience: async (payload: Omit<Experience, 'id'>): Promise<Experience> => {
    const res = await apiClient.post('/portfolio/experiences', payload);
    return res.data?.data ?? res.data;
  },
  updateExperience: async (id: string, payload: Partial<Omit<Experience, 'id'>>): Promise<Experience> => {
    const res = await apiClient.put(`/portfolio/experiences/${id}`, payload);
    return res.data?.data ?? res.data;
  },
  deleteExperience: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/experiences/${id}`);
  },

  // ----- SKILLS (API nhận mảng chuỗi) -----
  getSkills: async (): Promise<Skill[]> => {
    const res = await apiClient.get('/portfolio/skills');
    // Backend trả về mảng tên hoặc mảng object
    const raw = res.data?.data ?? res.data ?? [];
    if (typeof raw[0] === 'string') {
      return raw.map((name: string, i: number) => ({ id: String(i), name }));
    }
    return raw;
  },
  updateSkills: async (skills: string[]): Promise<Skill[]> => {
    // PUT { "skills": ["Python","Java","MySQL"] }
    const res = await apiClient.put('/portfolio/skills', { skills });
    const raw = res.data?.data ?? res.data ?? [];
    if (typeof raw[0] === 'string') {
      return raw.map((name: string, i: number) => ({ id: String(i), name }));
    }
    return raw;
  },
  deleteSkill: async (id: string): Promise<void> => {
    await apiClient.delete(`/portfolio/skills/${id}`);
  },
};
