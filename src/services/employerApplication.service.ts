import { apiClient } from "../config/axios";

export interface EmployerApplication {
  id?: number | string;
  application_id?: string;
  job_id: number;
  candidate_id: number;
  resume_id?: number | string;
  cover_letter?: string;
  note_by_recruiter?: string;
  status: string;
  applied_at: string;
  title?: string;
  candidate: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    candidateProfile?: {
      id?: string | number;
      headline?: string;
      bio?: string;
      website?: string;
      linkedin_url?: string;
      experiences?: Array<{
        id?: string | number;
        title?: string;
        job_title?: string;
        company_name?: string;
        company?: string;
        start_date?: string;
        end_date?: string;
        description?: string;
      }>;
      educations?: Array<{
        id?: string | number;
        school_name?: string;
        school?: string;
        major?: string;
        field_of_study?: string;
        degree?: string;
        start_date?: string;
        end_date?: string;
      }>;
      skills?: Array<{ id?: string | number; name: string } | string>;
      location?: string;
    }
  };
  job?: {
    title: string;
  }
}

export const employerApplicationService = {
  // GET /api/employer/applicants?status=submitted|under_review|interview|accepted|rejected
  getApplicants: async (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get('/employer/applicants', { params });
    // Dựa theo hình: { status: 'success', data: { applications: [...] } }
    const innerData = res.data?.data;
    if (innerData && Array.isArray(innerData.applications)) return innerData.applications;
    if (res.data && Array.isArray(res.data.applications)) return res.data.applications;
    return [];
  },

  // GET /api/employer/applicants/:applicationId
  getApplicantDetail: async (id: number | string) => {
    const res = await apiClient.get(`/employer/applicants/${id}`);
    return res.data?.data ?? res.data;
  },

  // GET /api/employer/applicants/:applicationId/cv
  fetchApplicantCvBlob: async (id: number | string, mode: 'view' | 'download' = 'view') => {
    const res = await apiClient.get(`/employer/applicants/${id}/cv`, {
      params: { mode },
      responseType: 'blob'
    });
    return res.data;
  },

  // PATCH /api/employer/applicants/:applicationId/status
  updateStatus: async (id: number | string, payload: { status: string; note?: string }) => {
    const res = await apiClient.patch(`/employer/applicants/${id}/status`, payload);
    return res.data?.data ?? res.data;
  }
};
