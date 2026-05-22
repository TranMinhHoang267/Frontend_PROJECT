import { apiClient } from '../config/axios';

// ---- Interfaces ----
export interface CandidateProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string; // "YYYY-MM-DD"
  gender?: string;
}

// Các trường có thể xóa (DELETE)
export type ClearableField = 'bio' | 'address' | 'city' | 'dateOfBirth' | 'gender';

// Update payload
export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  gender?: string;
}

// ---- Service ----
export const candidateService = {
  // GET /api/candidate/profile
  getProfile: async (): Promise<CandidateProfile> => {
    const response = await apiClient.get('/candidate/profile');
    const data = response.data?.data ?? response.data;
    // Map BE -> FE
    return {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      headline: data.headline,
      bio: data.summary,
      address: data.address,
      city: data.city,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : undefined,
      gender: data.gender,
    };
  },

  // PUT /api/candidate/profile
  updateProfile: async (payload: UpdateProfilePayload): Promise<CandidateProfile> => {
    // Map FE -> BE
    const bePayload = {
      fullName: payload.full_name,
      phone: payload.phone,
      headline: payload.headline,
      summary: payload.bio,
      address: payload.address,
      city: payload.city,
      gender: payload.gender,
      ...(payload.dateOfBirth ? { dateOfBirth: payload.dateOfBirth } : {}),
    };
    const response = await apiClient.put('/candidate/profile', bePayload);
    const data = response.data?.data ?? response.data;
    // Map BE -> FE
    return {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      headline: data.headline,
      bio: data.summary,
      address: data.address,
      city: data.city,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : undefined,
      gender: data.gender,
    };
  },

  // DELETE /api/candidate/profile — xóa các trường được chỉ định
  clearFields: async (fields: ClearableField[]): Promise<void> => {
    // Map FE -> BE
    const beFields = fields.map(f => {
      if (f === 'bio') return 'summary';
      return f;
    });
    await apiClient.delete('/candidate/profile', { data: { fields: beFields } });
  },

  // GET /api/bookmarks
  getBookmarks: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get('/bookmarks', { params });
    return res.data?.data ?? res.data ?? { bookmarks: [], total_items: 0, total_pages: 0, current_page: 1 };
  },

  // POST /api/bookmarks/:jobId
  toggleBookmark: async (jobId: string | number) => {
    const res = await apiClient.post(`/bookmarks/${jobId}`);
    return res.data;
  },
};
