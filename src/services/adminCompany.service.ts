import { apiClient } from '../config/axios';

const unpackCompanies = (res: { data: { data?: { companies?: unknown[]; } | unknown[]  } }) => {
  const inner = res.data?.data;
  if (!inner) return [];
  if (Array.isArray(inner)) return inner as unknown[];
  if ('companies' in (inner as object)) return (inner as { companies: unknown[] }).companies ?? [];
  return [];
};

export const adminCompanyService = {
  // GET /api/admin/companies?status=pending|approved|rejected
  getAllCompanies: async (status?: string) => {
    const res = await apiClient.get('/admin/companies', { params: status ? { status } : {} });
    return unpackCompanies(res);
  },



  // PATCH /api/admin/companies/:id/review
  reviewCompany: async (id: number | string, action: 'approved' | 'rejected', reason?: string) => {
    const res = await apiClient.patch(`/admin/companies/${id}/review`, { action, reason });
    return res.data;
  },
};
