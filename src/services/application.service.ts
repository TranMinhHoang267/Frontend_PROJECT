import { apiClient } from '../config/axios';

export interface Application {
  id: number;
  job_id: number;
  resume_id?: number | null;
  cover_letter?: string | null;
  note_by_recruiter?: string | null;
  status: 'submitted' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
  job?: {
    id: number;
    title: string;
    location: string | null;
    company?: {
      name: string;
      logo_url?: string | null;
    };
  };
  journey?: {
    step: 'applied' | 'review' | 'interview' | 'decision';
    status: 'completed' | 'in_progress' | 'upcoming';
    date?: string;
  }[];
}

export const applicationService = {
  // POST /api/applications
  apply: async (data: { job_id: number; resume_id?: number; cover_letter?: string }) => {
    const res = await apiClient.post('/applications', data);
    return res.data;
  },

  // GET /api/applications
  getApplications: async () => {
    const res = await apiClient.get('/applications');
    // Giả sử API trả về { status: "success", data: Application[] } hoặc Application[] trực tiếp
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/applications/:id
  getApplicationDetail: async (id: number | string) => {
    const res = await apiClient.get(`/applications/${id}`);
    return res.data?.data ?? res.data;
  },

  // DELETE /api/applications/:id
  withdrawApplication: async (id: number | string) => {
    const res = await apiClient.delete(`/applications/${id}`);
    return res.data;
  }
};
