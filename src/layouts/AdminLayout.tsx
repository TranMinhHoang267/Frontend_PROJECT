import { Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, Briefcase, Tags, Settings, ShieldAlert, LogOut } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/auth.service";

export default function AdminLayout() {
  const navigate = useNavigate();
  const logoutStore = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    try {
      // 1. Gửi request Logout lên Server (Server của bạn sẽ giữ lại refresh_token)
      await authService.logout();
    } catch (e) {
      console.error(e);
    } finally {
      // 2 & 3. Xóa sạch mọi thông tin (User, Access Token, Refresh Token) ở Client (localStorage)
      logoutStore();
      navigate('/login');
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <ShieldAlert className="w-6 h-6 text-emerald-500 mr-2" />
          <span className="font-bold text-xl text-white">Admin Hub</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <a href="#" className="flex items-center px-3 py-2.5 bg-slate-800 text-white rounded-md group">
              <LayoutDashboard className="w-5 h-5 mr-3 text-emerald-500" />
              Overview
            </a>
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Management
            </div>
            <a href="/admin/companies" className="flex items-center px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white group transition">
              <UserCheck className="w-5 h-5 mr-3 text-slate-400 group-hover:text-emerald-500 transition" />
              Employers
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white group transition">
              <Users className="w-5 h-5 mr-3 text-slate-400 group-hover:text-emerald-500 transition" />
              Candidates
            </a>
            <a href="/admin/jobs" className="flex items-center px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white group transition">
              <Briefcase className="w-5 h-5 mr-3 text-slate-400 group-hover:text-emerald-500 transition" />
              Job Postings
            </a>
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System
            </div>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white group transition">
              <Tags className="w-5 h-5 mr-3 text-slate-400 group-hover:text-emerald-500 transition" />
              Categories & Skills
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-md hover:bg-slate-800 hover:text-white group transition">
              <Settings className="w-5 h-5 mr-3 text-slate-400 group-hover:text-emerald-500 transition" />
              Settings
            </a>
          </nav>
        </div>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-end px-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium text-gray-900">System Admin</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-500">
              <span className="text-emerald-700 font-bold text-sm">A</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
