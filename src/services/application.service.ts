import { apiClient } from '../config/axios';

export interface Application {
  id: string;                    // ✅ UUID string, không phải number
  cover_letter?: string | null;
  note_by_recruiter?: string | null;
  cv_url?: string | null;
  status: 'submitted' | 'under_review' | 'interview' | 'accepted' | 'rejected';
  applied_at: string;            
  updatedAt?: string;
  job?: {
    id: string;                  //   ✅ UUID string
    title: string;
    location: string | null;
    job_type?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    deadline?: string | null;
    company?: {
      name: string;
      logo_url?: string | null;
    };
  };
}

export const applicationService = {
  apply: async (data: { job_id: string; cover_letter?: string }) => {
    const res = await apiClient.post('/applications', data);
    return res.data;
  },

  getApplications: async (): Promise<Application[]> => {
    const res = await apiClient.get('/applications');
    const raw = res.data;

    // API trả về: { status, data: { total_items, total_pages, current_page, applications[] } }
    if (Array.isArray(raw?.data?.applications)) return raw.data.applications;
    if (Array.isArray(raw?.data))               return raw.data;
    if (Array.isArray(raw?.applications))       return raw.applications;
    if (Array.isArray(raw))                     return raw;
    return [];
  },

  getApplicationDetail: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}`);
    return res.data?.data ?? res.data;
  },

  withdrawApplication: async (id: string) => {
    const res = await apiClient.delete(`/applications/${id}`);
    return res.data;
  },
};