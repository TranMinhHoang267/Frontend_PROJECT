import { apiClient } from '../config/axios';

export interface CvFile {
  id: string;
  file_name?: string; 
  file_url?: string;
  file_size?: string;
  created_at: string;
  is_default?: boolean;
}

export const resumeService = {
  // Lấy tất cả CV
  getAll: async (): Promise<CvFile[]> => {
    // Ghi chú: Sử dụng GET /resumes, nếu backend báo 404 thì đổi thành GET /resumes/upload
    const res = await apiClient.get('/resumes');
    return res.data?.data ?? res.data ?? [];
  },

  // Upload CV
  upload: async (file: File): Promise<CvFile> => {
    const fd = new FormData();
    fd.append('cv', file); // Phải khớp với .single('cv')
    const res = await apiClient.post('/resumes/upload', fd);
    return res.data?.data ?? res.data;
  },

  // Đặt CV chính (mặc định)
  setDefault: async (id: string): Promise<void> => {
    await apiClient.patch(`/resumes/${id}/default`); 
  },

  // Xóa CV
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/resumes/${id}`);
  },

  // Lấy URL xem trước hoặc tải file
  getViewUrl: (cv: CvFile): string => {
    const url = cv.file_url;
    if (url && url.startsWith('http')) return url;

    // Đường dẫn tĩnh: /uploads/resumes/filename
    const filename = cv.file_name || cv.id;
    const staticPath = `/uploads/resumes/${filename}`;
    
    if (url && url.startsWith('/')) {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      return `${apiUrl.replace(/\/api\/?$/, '')}${url}`;
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${apiUrl.replace(/\/api\/?$/, '')}${staticPath}`;
  }
};
