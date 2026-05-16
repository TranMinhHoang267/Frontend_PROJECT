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
  getPublicJobsList: async (params?: { company_id?: number | string; limit?: number; search?: string }) => {
    const res = await apiClient.get('/public/jobs', { params });
    return res.data?.data ?? res.data ?? [];
  },
};
