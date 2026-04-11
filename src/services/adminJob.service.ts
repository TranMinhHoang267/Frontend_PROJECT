import { apiClient } from '../config/axios';

// Backend response: { status: 'success', count: N, data: { jobs: [], total_items, ... } }
// OR for detail: { status: 'success', data: <job object> }
const unpackJobs = (res: { data: { data?: { jobs?: unknown[]; } | unknown[]  } }) => {
  const inner = res.data?.data;
  if (!inner) return [];
  // getAllJobs returns { jobs: [...], total_items, ... }
  if (Array.isArray(inner)) return inner as unknown[];
  if ('jobs' in (inner as object)) return (inner as { jobs: unknown[] }).jobs ?? [];
  return [];
};

export const adminJobService = {
  // GET /api/admin/jobs?status=pending
  getPendingJobs: async () => {
    const res = await apiClient.get('/admin/jobs', { params: { status: 'pending' } });
    return unpackJobs(res);
  },

  // GET /api/admin/jobs?status=xxx
  getAllJobs: async (status?: string) => {
    const res = await apiClient.get('/admin/jobs', { params: status ? { status } : {} });
    return unpackJobs(res);
  },

  // GET /api/admin/jobs/:id
  getJobDetail: async (id: number | string) => {
    const res = await apiClient.get(`/admin/jobs/${id}`);
    return res.data?.data ?? res.data;
  },

  // PATCH /api/admin/jobs/:id/review  { action: 'approved'|'rejected', reason?: string }
  reviewJob: async (id: number | string, action: 'approved' | 'rejected', reason?: string) => {
    const res = await apiClient.patch(`/admin/jobs/${id}/review`, { action, reason });
    return res.data;
  },

  // DELETE /api/admin/jobs/:id
  deleteJob: async (id: number | string) => {
    const res = await apiClient.delete(`/admin/jobs/${id}`);
    return res.data;
  },
};
