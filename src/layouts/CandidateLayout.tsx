import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { Bell, LogOut, User, ChevronDown, Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { avatarService } from "../services/avatar.service";
import { authService } from "../services/auth.service";

export default function CandidateLayout() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logoutStore = useAuthStore(state => state.logout);
  const updateAvatar = useAuthStore(state => state.updateAvatar);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      // 1. Gửi request Logout chính thức lên Server (giữ refresh_token trên Database)
      await authService.logout();
    } catch (e) {
      console.error(e);
    } finally {
      // 2 & 3. Xóa sạch mọi thông tin (User, Access Token, Refresh Token) ở Client (localStorage)
      logoutStore();
      navigate('/login');
    }
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const newUrl = await avatarService.update(file);
      updateAvatar(newUrl);
    } catch (err) {
      console.error("Lỗi đổi avatar:", err);
      alert("Lỗi khi đổi ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;
    if (!confirm("Bạn có chắc muốn xóa ảnh đại diện?")) return;
    try {
      setUploadingAvatar(true);
      await avatarService.remove();
      updateAvatar("");
    } catch (err) {
      console.error("Lỗi xóa avatar:", err);
      alert("Lỗi khi xóa ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarUrl = avatarService.toAbsUrl(user?.avatar);

  const navItems = [
    { to: '/candidate', label: 'Bảng điều khiển', icon: 'dashboard', end: true },
    { to: '/candidate/recommended', label: 'Gợi ý cho bạn', icon: 'magic_button', end: false },
    { to: '/candidate/applications', label: 'Đơn ứng tuyển', icon: 'work', end: false },
    { to: '/candidate/saved', label: 'Việc làm đã lưu', icon: 'bookmark', end: false },
    { to: '/candidate/find', label: 'Tìm kiếm', icon: 'search', end: false },
  ];

  return (
    <div className="font-display min-h-screen bg-[#f6f6f8] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="text-[#1e3fae]">
            <svg className="size-7" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
            </svg>
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">RecruitHub</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Điều hướng</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1e3fae]/10 text-[#1e3fae] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* ===== Topbar ===== */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="text-sm font-semibold text-slate-700">
            Xin chào, <span className="text-[#1e3fae]">{user?.fullName || 'Ứng viên'}!</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="size-9 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div className="size-7 rounded-full overflow-hidden bg-[#1e3fae] flex items-center justify-center flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[120px] truncate">
                  {user?.fullName || 'Ứng viên'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  {/* User info + Avatar Upload */}
                  <div className="px-4 py-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {/* Avatar lớn với nút camera */}
                      <div
                        className="relative size-14 rounded-full overflow-hidden bg-[#1e3fae] flex items-center justify-center flex-shrink-0 cursor-pointer group"
                        onClick={() => avatarInputRef.current?.click()}
                        title="Đổi ảnh đại diện"
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover group-hover:opacity-70 transition" />
                        ) : (
                          <span className="text-white font-bold text-lg">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                        )}
                        {/* Overlay camera */}
                        {uploadingAvatar ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3fae] text-white rounded-lg text-[11px] font-bold hover:bg-[#162f8c] transition"
                          >
                            <Camera className="w-3 h-3" />
                            Đổi ảnh
                          </button>
                          {avatarUrl && (
                            <button
                              onClick={handleDeleteAvatar}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg text-[11px] font-bold hover:bg-red-100 transition"
                            >
                              <span className="text-[13px] leading-none">✕</span>
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/candidate/profile'); }}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Hồ sơ cá nhân
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
