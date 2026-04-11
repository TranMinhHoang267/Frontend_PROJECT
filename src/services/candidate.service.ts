import { apiClient } from '../config/axios';

// ---- Interfaces ----
export interface CandidateProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  website?: string;
  linkedin_url?: string;
}

// Chỉ bio, website, linkedin_url có thể xóa (DELETE)
export type ClearableField = 'bio' | 'website' | 'linkedin_url';

// Update payload có thể sửa: full_name, phone, headline, bio, website, linkedin_url
export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  website?: string;
  linkedin_url?: string;
}

// ---- Service ----
export const candidateService = {
  // GET /api/candidate/profile
  getProfile: async (): Promise<CandidateProfile> => {
    const response = await apiClient.get('/candidate/profile');
    return response.data?.data ?? response.data;
  },

  // PUT /api/candidate/profile
  updateProfile: async (payload: UpdateProfilePayload): Promise<CandidateProfile> => {
    const response = await apiClient.put('/candidate/profile', payload);
    return response.data?.data ?? response.data;
  },

  // DELETE /api/candidate/profile — xóa các trường được chỉ định
  clearFields: async (fields: ClearableField[]): Promise<void> => {
    await apiClient.delete('/candidate/profile', { data: { fields } });
  },
};
