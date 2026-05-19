import { apiClient } from '../config/axios';

export interface RecruiterInfo {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export interface CompanyProfileData {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  size: string | null;
  status: string;
  rejection_reason: string | null;
  recruiter: RecruiterInfo;
}

export interface UpdateCompanyPayload {
  name?: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  size?: string;
}

export interface DashboardStats {
  jobs: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paused: number;
  };
  applications: {
    total: number;
    submitted: number;
    under_review: number;
    interview: number;
    accepted: number;
    rejected: number;
  };
  successRate: string;
  recentApplications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    candidate: { fullName: string; email: string; avatarUrl: string | null };
    jobTitle: string;
  }>;
}

export const employerService = {
  getProfile: async (): Promise<CompanyProfileData> => {
    const res = await apiClient.get('/employer/profile');
    return res.data?.data ?? res.data;
  },

  updateProfile: async (data: UpdateCompanyPayload): Promise<CompanyProfileData> => {
    const res = await apiClient.put('/employer/profile', data);
    return res.data?.data ?? res.data;
  },

  updateLogo: async (file: File): Promise<{ logo_url: string }> => {
    const fd = new FormData();
    fd.append('logo', file);
    const res = await apiClient.put('/employer/logo', fd);
    return res.data?.data ?? res.data;
  },

  deleteLogo: async (): Promise<void> => {
    await apiClient.delete('/employer/logo');
  },

  // Hàm chuyển đổi đường dẫn logo cục bộ thành URL hoàn chỉnh
  getLogoUrl: (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/employer/dashboard');
    return res.data?.data ?? res.data;
  }
};
