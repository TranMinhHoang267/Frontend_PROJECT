import { apiClient } from '../config/axios';

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  companyId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter?: string | null;
  status: 'submitted' | 'under_review' | 'interview' | 'accepted' | 'rejected' | 'pending';
  appliedAt: string;            
  updatedAt?: string;
  job?: {
    id: string;
    title: string;
    location: string | null;
    jobType?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    deadline?: string | null;
    company?: {
      name: string;
      logoUrl?: string | null;
    };
  };
}

export const applicationService = {
  apply: async (data: { jobId: string; resumeId?: string; coverLetter?: string }) => {
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

  deleteRejectedApplication: async (id: string) => {
    const res = await apiClient.delete(`/applications/${id}/rejected`);
    return res.data;
  },
  
  getPreviousApplication: async (jobId: string) => {
    const res = await apiClient.get(`/applications/job/${jobId}/previous`);
    return res.data?.data ?? res.data;
  },
};