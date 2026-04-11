import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Lấy API URL từ file .env (ví dụ: VITE_API_BASE_URL)
 const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

  // Interceptor: Tự động gán token vào mọi Request
apiClient.interceptors.request.use((config) => {
  let token = useAuthStore.getState().token;

  // Đảm bảo token tồn tại và không phải là chuỗi "null" hoặc "undefined"
  if (token && token !== 'null' && token !== 'undefined') {
    // Xóa dấu ngoặc kép ở 2 đầu (nếu có do lỗi parse JSON/LocalStorage)
    if (typeof token === 'string') {
      token = token.replace(/^"|"$/g, '');
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Tự động xóa Content-Type mặc định nếu gửi FormData để browser tự tạo đúng boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});



// Interceptor: Xử lý lỗi Token hết hạn (401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogoutEndpoint = error.config?.url?.includes('/auth/logout');
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    const isRegisterEndpoint = error.config?.url?.includes('/auth/register');
    
    if (error.response && error.response.status === 401 && !isLogoutEndpoint && !isLoginEndpoint && !isRegisterEndpoint) {
      // Token hết hạn -> Xóa phiên đăng nhập và redirect về Login
      useAuthStore.getState().logout();
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);
