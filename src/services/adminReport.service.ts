import { apiClient } from '../config/axios';

// ─── Exact shapes returned by AdminReportService.js ─────────────────────────

export interface SystemStats {
  users: {
    total: number;
    candidates: number;
    recruiters: number;
  };
  companies: {
    total: number;
    approved: number;
    pending: number;
  };
  jobs: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  applications: {
    total: number;
    accepted: number;
    success_rate: string; // e.g. "42%"
  };
}

// getUserGrowth → { month, candidate, recruiter, total }
export interface GrowthDataPoint {
  month: string;       // "2026-01"
  candidate: number;   // NOT "candidates"
  recruiter: number;   // NOT "recruiters"
  total: number;
}

// getApplicationsByMonth → { month, total, accepted, rejected }
export interface MonthlyApplications {
  month: string;
  total: number;       // NOT "count"
  accepted: number;
  rejected: number;
}

// getJobsByType → { jobType, count }
export interface JobsByType {
  jobType: string;     // NOT "type"
  count: number;
}

// getJobsByLevel → { jobLevel, count }
export interface JobsByLevel {
  jobLevel: string;    // NOT "level"
  count: number;
}

export const adminReportService = {
  // GET /api/admin/reports/overview
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await apiClient.get('/admin/reports/overview');
    return res.data?.data ?? res.data;
  },

  // GET /api/admin/reports/users/growth
  getUserGrowth: async (): Promise<GrowthDataPoint[]> => {
    const res = await apiClient.get('/admin/reports/users/growth');
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/admin/reports/applications/monthly
  getApplicationsByMonth: async (): Promise<MonthlyApplications[]> => {
    const res = await apiClient.get('/admin/reports/applications/monthly');
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/admin/reports/jobs/by-type
  getJobsByType: async (): Promise<JobsByType[]> => {
    const res = await apiClient.get('/admin/reports/jobs/by-type');
    return res.data?.data ?? res.data ?? [];
  },

  // GET /api/admin/reports/jobs/by-level
  getJobsByLevel: async (): Promise<JobsByLevel[]> => {
    const res = await apiClient.get('/admin/reports/jobs/by-level');
    return res.data?.data ?? res.data ?? [];
  },
};