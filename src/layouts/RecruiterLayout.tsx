import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { Camera, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { avatarService } from "../services/avatar.service";
import { authService } from "../services/auth.service";

export default function RecruiterLayout() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logoutStore = useAuthStore(state => state.logout);
  const updateAvatar = useAuthStore(state => state.updateAvatar);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { to: '/recruiter', label: 'Bảng điều khiển', icon: 'dashboard', end: true },
    { to: '/recruiter/jobs', label: 'Quản lý công việc', icon: 'work', end: false },
    { to: '/recruiter/candidates', label: 'Ứng viên', icon: 'group', end: false },
    { to: '/recruiter/post-job', label: 'Đăng tin tuyển dụng', icon: 'add_box', end: false },
    { to: '/recruiter/company-profile', label: 'Hồ sơ công ty', icon: 'apartment', end: false },
  ];

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
      alert("Lỗi khi xóa ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Avatar cá nhân (khác logo công ty)
  const avatarUrl = avatarService.toAbsUrl(user?.avatar);

  return (
    <div className="relative flex min-h-screen w-full overflow-x-hidden bg-[#f6f6f8] text-slate-900 font-display">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-slate-200 bg-white h-screen sticky top-0 hidden md:flex transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[88px]' : 'w-64'}`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-6'} py-5 border-b border-slate-100 transition-all duration-300`}>
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1e3fae] text-white flex-shrink-0">
            <span className="material-symbols-outlined text-xl">work</span>
          </div>
          {!isSidebarCollapsed && <h2 className="text-lg font-bold tracking-tight whitespace-nowrap">Recruiter</h2>}
        </div>
        
        <nav className="flex flex-col gap-1.5 p-4 grow overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && (
            <div className="px-3 pt-2 pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Điều hướng</h3>
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3.5 px-3.5'} py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#1e3fae]/10 text-[#1e3fae] font-bold shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <span className={`material-symbols-outlined transition-transform duration-300 group-hover:scale-110 ${isSidebarCollapsed ? 'text-[24px]' : 'text-[22px]'}`}>{item.icon}</span>
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 sticky top-0 z-10 w-full transition-all duration-300">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-[#1e3fae] hover:bg-blue-50 transition-colors hidden md:flex items-center justify-center focus:outline-none"
              title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <div className="max-w-xl w-full hidden sm:block">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3fae] transition-colors">search</span>
                <input className="w-full h-10 pl-10 pr-4 rounded-lg border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] transition-all text-sm outline-none" placeholder="Tìm kiếm ứng viên, vị trí..." type="text"/>
              </div>
            </div>
          </div>

          {/* Account Dropdown — Avatar cá nhân của nhà tuyển dụng */}
          <div className="relative ml-6" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            >
              {/* Avatar vòng tròn */}
              <div className="size-9 rounded-full overflow-hidden flex-shrink-0 bg-[#1e3fae] border-2 border-slate-200 flex items-center justify-center">
                {avatarUrl ? (
                  <img className="w-full h-full object-cover" src={avatarUrl} alt="avatar" />
                ) : (
                  <span className="text-white font-bold text-sm">{user?.fullName?.charAt(0) ?? "R"}</span>
                )}
              </div>
              <div className="flex flex-col items-start hidden sm:flex">
                <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user?.fullName ?? "Nhà tuyển dụng"}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">Nhà tuyển dụng</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg ml-1 hidden sm:block">expand_more</span>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                {/* Avatar upload header */}
                <div className="px-4 py-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* Avatar lớn + camera overlay */}
                    <div
                      className="relative size-14 rounded-full overflow-hidden bg-[#1e3fae] flex items-center justify-center flex-shrink-0 cursor-pointer group"
                      onClick={() => avatarInputRef.current?.click()}
                      title="Đổi ảnh đại diện"
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover group-hover:opacity-70 transition" />
                      ) : (
                        <span className="text-white font-bold text-lg">{user?.fullName?.charAt(0)?.toUpperCase() ?? "R"}</span>
                      )}
                      {uploadingAvatar ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
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

                {/* Menu items */}
                <a href="/recruiter/company-profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 text-xl">apartment</span>
                  Hồ sơ công ty
                </a>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto rounded-tl-xl p-8 bg-[#f6f6f8]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
