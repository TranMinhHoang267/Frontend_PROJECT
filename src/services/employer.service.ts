import { apiClient } from '../config/axios';

export interface RecruiterInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CompanyProfileData {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  size: string | null;
  status: string;
  rejectionReason: string | null;
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

  updateLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const fd = new FormData();
    fd.append('logo', file);
    const res = await apiClient.put('/employer/logo', fd);
    const d = res.data?.data ?? res.data;
    // Backend trả { logo_url: '...' } — map sang camelCase
    if (d && d.logo_url && !d.logoUrl) {
      d.logoUrl = d.logo_url;
    }
    return d;
  },

  deleteLogo: async (): Promise<void> => {
    await apiClient.delete('/employer/logo');
  },

  // Chuyển path tương đối (/uploads/logos/xxx.webp) thành URL đầy đủ
  getLogoUrl: (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Bỏ /api ở cuối base URL để ghép đúng đường dẫn file tĩnh
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '')
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/employer/dashboard');
    return res.data?.data ?? res.data;
  },
};
