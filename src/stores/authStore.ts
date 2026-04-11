import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
  [key: string]: unknown; // Phục vụ thêm các field động nếu cần
}

interface AuthState {
  user: User | null;
  token: string | null;         // Đây là Access Token
  refreshToken: string | null;  // Đây là Refresh Token
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateAvatar: (avatarUrl: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
       user: null,
       token: null,
       refreshToken: null,
       isAuthenticated: false,
       setAuth: (user, token, refreshToken) => set({ user, token, refreshToken, isAuthenticated: true }),
       updateAvatar: (avatarUrl) => set(state => state.user ? { user: { ...state.user, avatar: avatarUrl } } : {}),
       logout: () => {
         // XÓA SẠCH TOÀN BỘ ở Client (Trình duyệt): user, access token và refresh token
         set({ 
           user: null, 
           token: null,          // Xóa hoàn toàn Access Token
           refreshToken: null,   // Xóa hoàn toàn Refresh Token khỏi localStorage
           isAuthenticated: false 
         });
         // Sau khi set({ ... }), zustand-persist sẽ tự động xóa sạch dữ liệu tương ứng ở localStorage
       },
    }),
    {
       name: 'auth-storage', 
    }
  )
);
