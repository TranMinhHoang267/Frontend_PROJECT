import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Bell, LogOut, ChevronDown, Settings } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/auth.service";

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logoutStore = useAuthStore(state => state.logout);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
      await authService.logout();
    } catch (e) {
      console.error(e);
    } finally {
      logoutStore();
      navigate('/login');
    }
  };

  const navItems = [
    { to: '/admin', label: 'Bảng điều khiển', icon: 'dashboard', end: true },
    { to: '/admin/users', label: 'Quản lý Người dùng', icon: 'group', end: false },
    { to: '/admin/companies', label: 'Quản lý Công ty', icon: 'apartment', end: false },
    { to: '/admin/jobs', label: 'Quản lý Việc làm', icon: 'work', end: false },
    { to: '/admin/reports', label: 'Báo cáo & Thống kê', icon: 'bar_chart', end: false },
  ];


  const adminName = user?.fullName ?? "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <div className="relative flex min-h-screen w-full overflow-x-hidden bg-[#f6f6f8] text-slate-900 font-display">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-slate-200 bg-white h-screen sticky top-0 hidden md:flex transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[88px]' : 'w-64'}`}>
        {/* Logo */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-6'} py-5 border-b border-slate-100 transition-all duration-300`}>
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1e3fae] text-white flex-shrink-0">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          {!isSidebarCollapsed && (
            <div className="whitespace-nowrap">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">RecruitHub</h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Hệ thống quản trị</p>
            </div>
          )}
        </div>

        {/* Navigation */}
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

        {/* Logout at bottom */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-[15px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut className="w-[22px] h-[22px] transition-transform duration-300 group-hover:scale-110" />
              <span className="whitespace-nowrap">Đăng xuất</span>
            </button>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="flex items-center justify-center p-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 sticky top-0 z-10 w-full transition-all duration-300">
          <div className="flex items-center gap-4 flex-1">
            {/* Collapse toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-[#1e3fae] hover:bg-blue-50 transition-colors hidden md:flex items-center justify-center focus:outline-none"
              title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Search bar */}
            <div className="max-w-xl w-full hidden sm:block">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3fae] transition-colors text-[20px]">search</span>
                <input
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] transition-all text-sm outline-none"
                  placeholder="Tìm kiếm hệ thống..."
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Right header area */}
          <div className="flex items-center gap-3 ml-4">
            {/* Notification bell */}
            <button className="size-9 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Settings */}
            <button className="size-9 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition">
              <Settings className="w-5 h-5" />
            </button>

            {/* Admin Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="size-8 rounded-full bg-[#1e3fae] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{adminInitial}</span>
                </div>
                <div className="flex-col items-start hidden sm:flex">
                  <p className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[120px]">{adminName}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">Quản trị viên</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{adminName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email ?? "admin@recruithub.vn"}</p>
                  </div>
                  <div className="py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
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

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8 bg-[#f6f6f8]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
