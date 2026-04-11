import { apiClient } from '../config/axios';

export const avatarService = {
  /** PUT /api/avatar — Upload hoặc thay avatar (field name: 'avatar') */
  update: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('avatar', file);

    const res = await apiClient.put('/avatar', fd);
    // Backend trả về { status: 'success', data: { avatar_url: '...' } }
    return res.data?.data?.avatar_url ?? res.data?.avatar_url;
  },

  /** DELETE /api/avatar — Xóa avatar */
  remove: async (): Promise<void> => {
    await apiClient.delete('/avatar');
  },

  /** Tạo URL tuyệt đối từ đường dẫn relative */
  toAbsUrl: (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  },
};
