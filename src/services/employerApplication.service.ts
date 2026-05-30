import { apiClient } from "../config/axios";

/** Interface for job applications viewed by employers */
export interface EmployerApplication {
  id?: number | string;
  applicationId?: string;
  jobId: number;
  candidateId: number;
  resumeId?: number | string;
  coverLetter?: string;
  noteByRecruiter?: string;
  status: string;
  appliedAt: string;
  title?: string;
  candidate: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    candidateProfile?: {
      id?: string | number;
      headline?: string;
      summary?: string;
      address?: string;
      city?: string;
      gender?: string;
      dateOfBirth?: string;
      experiences?: Array<{
        id?: string | number;
        title?: string;
        jobTitle?: string;
        companyName?: string;
        company?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }>;
      educations?: Array<{
        id?: string | number;
        schoolName?: string;
        school?: string;
        major?: string;
        fieldOfStudy?: string;
        degree?: string;
        startDate?: string;
        endDate?: string;
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
  },

  // POST /api/smart/scoring-cv
  scoreCVs: async (jobId: string, reqOpt?: string) => {
    const res = await apiClient.post('/smart/scoring-cv', { jobId, reqOpt });
    return res.data;
  }
};
