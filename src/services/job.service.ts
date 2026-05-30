import { apiClient } from '../config/axios';

export interface CreateJobPayload {
  title: string;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  location?: string | null;
  jobType?: string | null;
  jobLevel?: string | null;
  deadline?: string | null;
  skills?: string[];
}

export const jobService = {
  // Đăng tin mới
  createJob: async (payload: CreateJobPayload) => {
    const res = await apiClient.post('/employer/jobs', payload);
    return res.data;
  },

  // Lấy dánh sách tin đăng
  getMyJobs: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get('/employer/jobs', { params });
    return res.data;
  },

  // Chi tiết 1 tin
  getJobDetail: async (id: number | string) => {
    const res = await apiClient.get(`/employer/jobs/${id}`);
    return res.data;
  },

  // Cập nhật tin
  updateJob: async (id: number | string, payload: Partial<CreateJobPayload>) => {
    const res = await apiClient.put(`/employer/jobs/${id}`, payload);
    return res.data;
  },

  // Xóa tin
  deleteJob: async (id: number | string) => {
    const res = await apiClient.delete(`/employer/jobs/${id}`);
    return res.data;
  },

  // Dừng / Mở lại tin
  togglePause: async (id: number | string) => {
    const res = await apiClient.patch(`/employer/jobs/${id}/toggle-pause`);
    return res.data;
  },

  getApplicants: async (jobId: number | string, limit = 100) => {
    const res = await apiClient.get(`/employer/jobs/${jobId}/applicants`, { params: { limit } });
    return res.data;
  },

  deleteApplication: async (applicationId: number | string) => {
    const res = await apiClient.delete(`/employer/applicants/${applicationId}`);
    return res.data;
  },

  // API dành cho ứng viên thao tác chung
  getPublicJobs: async (params?: { search?: string; status?: string; limit?: number }) => {
    const res = await apiClient.get('/jobs', { params });
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/public/jobs/:id
  getPublicJobDetail: async (id: number | string) => {
    const res = await apiClient.get(`/public/jobs/${id}`);
    return res.data?.data ?? res.data;
  },

  // GET /api/suggestions
  getSuggestions: async (limit: number = 10) => {
    const res = await apiClient.get('/suggestions', { params: { limit } });
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/public/companies/:id
  getPublicCompany: async (id: number | string) => {
    const res = await apiClient.get(`/public/companies/${id}`);
    return res.data?.data ?? res.data;
  },

  // GET /api/public/jobs (lấy danh sách việc làm công khai cho sidebar "Việc làm tương tự")
  getPublicJobsList: async (params?: { companyId?: number | string; limit?: number; search?: string }) => {
    const res = await apiClient.get('/public/jobs', { params });
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/public/companies (lấy danh sách công ty công khai)
  getPublicCompanies: async (params?: { limit?: number; search?: string }) => {
    const res = await apiClient.get('/public/companies', { params });
    return res.data?.data ?? res.data ?? [];
  },


  // GET /api/search-jobs — tìm kiếm việc làm theo keyword/location/jobType/jobLevel/salary
  searchJobs: async (params: {
    keyword?: string;
    location?: string;
    jobType?: string;
    jobLevel?: string;
    salary?: number;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get('/search-jobs', { params });
    const d = res.data?.data ?? res.data ?? {};
    return {
      jobs:         (d.jobs        ?? []) as SearchJobResult[],
      total_items:  (d.total_items ?? 0)  as number,
      total_pages:  (d.total_pages ?? 1)  as number,
      current_page: (d.current_page ?? 1) as number,
    };
  },
};

// ─── Search result type ────────────────────────────────────────────────────────
export interface SearchJobResult {
  id: string | number;
  title: string;
  location?: string;
  jobType?: string;
  jobLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  description?: string;
  requirements?: string;
  skills?: { id: number | string; name: string }[];
  company?: { id?: number | string; name?: string; logoUrl?: string; city?: string };
}

