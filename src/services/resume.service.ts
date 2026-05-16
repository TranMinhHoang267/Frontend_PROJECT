import { apiClient } from '../config/axios';

export interface CvFile {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  isDefault: boolean;
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

  // Lấy URL xem trước (link trực tiếp đến file tĩnh, không cần auth header)
  getViewUrl: (cv: CvFile): string => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
    // Bỏ phần /api ở cuối để lấy base URL của server (vd: http://localhost:3000)
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    // fileUrl từ backend luôn có dạng /uploads/resumes/resume-xxx.pdf
    return `${baseUrl}${cv.fileUrl}`;
  }
};
