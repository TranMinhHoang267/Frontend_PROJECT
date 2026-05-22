import { apiClient } from '../config/axios';

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: 'candidate' | 'recruiter' | 'admin';
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  users: UserItem[];
}

export const adminUserService = {
  // GET /api/admin/users?role=candidate|recruiter&is_active=true|false&keyword=...&page=1&limit=20
  getAllUsers: async (params?: {
    role?: string;
    is_active?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> => {
    const res = await apiClient.get('/admin/users', { params });
    // Response shape: { status: 'success', count: N, data: { total_items, total_pages, current_page, users } }
    const raw = res.data?.data ?? res.data;
    if (raw?.users) return raw as UsersResponse;
    // Fallback: direct array
    return { total_items: 0, total_pages: 1, current_page: 1, users: (Array.isArray(raw) ? raw : []) };
  },

  // PATCH /api/admin/users/:id/toggle-lock
  toggleLock: async (id: string) => {
    const res = await apiClient.patch(`/admin/users/${id}/toggle-lock`);
    return res.data;
  },

  // DELETE /api/admin/users/:id
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },
};
