import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Camera, Loader2 } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      <aside className="flex w-72 flex-col border-r border-slate-200 bg-white h-screen sticky top-0 hidden md:flex">
        <div className="flex items-center gap-3 px-8 py-6 border-b border-slate-100">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1e3fae] text-white">
            <span className="material-symbols-outlined text-xl">work</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Recruiter Pro</h2>
        </div>
        
        <div className="flex flex-col gap-1 p-4 grow">
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Điều hướng</h3>
          </div>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/recruiter">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Bảng điều khiển</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/recruiter/jobs">
            <span className="material-symbols-outlined">work</span>
            <span className="text-sm font-medium">Quản lý công việc</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/recruiter/candidates">
            <span className="material-symbols-outlined">group</span>
            <span className="text-sm font-medium">Ứng viên</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/recruiter/post-job">
            <span className="material-symbols-outlined">add_box</span>
            <span className="text-sm font-medium">Đăng tin tuyển dụng</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/recruiter/company-profile">
            <span className="material-symbols-outlined">apartment</span>
            <span className="text-sm font-medium">Hồ sơ công ty</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 sticky top-0 z-10 w-full">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3fae] transition-colors">search</span>
              <input className="w-full h-10 pl-10 pr-4 rounded-lg border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] transition-all text-sm outline-none" placeholder="Tìm kiếm ứng viên, vị trí..." type="text"/>
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
              <div className="flex flex-col items-start">
                <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user?.fullName ?? "Nhà tuyển dụng"}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">Nhà tuyển dụng</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-lg ml-1">expand_more</span>
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
