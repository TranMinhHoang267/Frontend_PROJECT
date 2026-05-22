import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Building2, Users, AlertTriangle, ArrowRight,
  CheckCircle2, Loader2, ArrowUpRight
} from "lucide-react";
import { adminJobService } from "../../services/adminJob.service";
import { adminCompanyService } from "../../services/adminCompany.service";
import { employerService } from "../../services/employer.service";

interface Job {
  id: number;
  title: string;
  status: "pending" | "approved" | "rejected" | "paused";
  createdAt: string;
  company?: { name: string; logo_url?: string | null };
}

interface Company {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  logo_url: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsData, companiesData] = await Promise.all([
          adminJobService.getAllJobs(),
          adminCompanyService.getAllCompanies()
        ]);
        setJobs(jobsData as Job[]);
        setCompanies(companiesData as Company[]);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingJobs = jobs.filter(j => j.status === "pending");
  const pendingCompanies = companies.filter(c => c.status === "pending");
  const approvedJobsCount = jobs.filter(j => j.status === "approved").length;
  const approvedCompaniesCount = companies.filter(c => c.status === "approved").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-[#1e3fae] mb-4" />
        <p className="font-bold text-slate-500">Đang tải số liệu thống kê hệ thống...</p>
      </div>
    );
  }

  // Activity feed items (recent approved/rejected or added)
  const recentActivities = [
    ...jobs.slice(0, 3).map(j => ({
      id: `job-${j.id}`,
      type: "job",
      title: j.title,
      subtitle: j.company?.name ?? "Doanh nghiệp ẩn danh",
      status: j.status,
      time: j.createdAt,
      logo: j.company?.logo_url,
    })),
    ...companies.slice(0, 3).map(c => ({
      id: `company-${c.id}`,
      type: "company",
      title: c.name,
      subtitle: "Yêu cầu đăng ký tài khoản",
      status: c.status,
      time: c.created_at,
      logo: c.logo_url,
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Tổng Quan Hệ Thống</h1>
        <p className="text-slate-500 font-medium text-sm">Xem số liệu thống kê hoạt động và xét duyệt hồ sơ nhanh chóng.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Jobs */}
        <div
          onClick={() => navigate("/admin/jobs")}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group duration-300"
        >
          <div className="absolute right-[-10px] bottom-[-10px] opacity-15 transition-transform duration-500 group-hover:scale-110">
            <AlertTriangle className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Tin tuyển dụng chờ duyệt</span>
            <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black">{pendingJobs.length}</h3>
            <p className="text-xs text-white/80 font-medium flex items-center gap-1">
              Cần xử lý gấp <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

        {/* Pending Companies */}
        <div
          onClick={() => navigate("/admin/companies")}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group duration-300"
        >
          <div className="absolute right-[-10px] bottom-[-10px] opacity-15 transition-transform duration-500 group-hover:scale-110">
            <Building2 className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Doanh nghiệp chờ duyệt</span>
            <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black">{pendingCompanies.length}</h3>
            <p className="text-xs text-white/80 font-medium flex items-center gap-1">
              Quản lý tài khoản doanh nghiệp <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

        {/* Total Jobs */}
        <div
          onClick={() => navigate("/admin/jobs")}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-sky-700 p-5 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group duration-300"
        >
          <div className="absolute right-[-10px] bottom-[-10px] opacity-15 transition-transform duration-500 group-hover:scale-110">
            <Briefcase className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Tổng số tin tuyển dụng</span>
            <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black">{jobs.length}</h3>
            <p className="text-xs text-white/80 font-medium">Đã hoạt động: {approvedJobsCount} tin</p>
          </div>
        </div>

        {/* Total Companies */}
        <div
          onClick={() => navigate("/admin/companies")}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-750 p-5 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group duration-300"
        >
          <div className="absolute right-[-10px] bottom-[-10px] opacity-15 transition-transform duration-500 group-hover:scale-110">
            <Users className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Tổng số doanh nghiệp</span>
            <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black">{companies.length}</h3>
            <p className="text-xs text-white/80 font-medium">Đang hoạt động: {approvedCompaniesCount} đối tác</p>
          </div>
        </div>
      </div>

      {/* Grid Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">Thống kê đăng tin tuyển dụng</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">Xu hướng tuyển dụng 6 tháng gần nhất</p>
            </div>
            <span className="text-xs font-bold text-[#1e3fae] bg-[#1e3fae]/10 px-2.5 py-1 rounded-lg">Năm 2026</span>
          </div>

          {/* Simple Simulated Chart */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
            {[
              { month: "Th 1", value: 45, color: "bg-slate-200" },
              { month: "Th 2", value: 65, color: "bg-slate-200" },
              { month: "Th 3", value: 85, color: "bg-slate-200" },
              { month: "Th 4", value: 110, color: "bg-[#1e3fae]" },
              { month: "Th 5", value: jobs.length || 30, color: "bg-gradient-to-t from-[#1e3fae] to-sky-400" },
              { month: "Th 6 (Dự kiến)", value: 50, color: "bg-dashed bg-slate-100 border-2 border-slate-200 border-dashed" }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                <div className="relative w-full flex justify-center">
                  {/* Tooltip */}
                  <span className="absolute top-[-28px] scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white font-bold text-[10px] px-2 py-1 rounded shadow pointer-events-none">
                    {item.value} tin
                  </span>
                  {/* Bar */}
                  <div
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-90 ${item.color}`}
                    style={{ height: `${(item.value / 120) * 100}%`, minHeight: "8px" }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">Yêu cầu chờ duyệt</h3>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse border border-amber-200">Gấp</span>
            </div>

            {/* List */}
            <div className="space-y-3.5 divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {pendingJobs.length === 0 && pendingCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-slate-500 text-sm font-semibold">Tất cả sạch sẽ!</p>
                  <p className="text-slate-400 text-xs mt-0.5">Không còn hồ sơ nào đang chờ duyệt.</p>
                </div>
              ) : (
                <>
                  {pendingJobs.slice(0, 2).map(j => (
                    <div key={j.id} className="flex items-start justify-between pt-3 gap-2">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs leading-tight line-clamp-1">{j.title}</p>
                          <p className="text-slate-400 text-[10px] font-medium leading-normal mt-0.5">{j.company?.name ?? "Đối tác"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/admin/jobs")}
                        className="text-[10px] font-bold text-[#1e3fae] hover:underline shrink-0"
                      >
                        Duyệt
                      </button>
                    </div>
                  ))}
                  {pendingCompanies.slice(0, 2).map(c => (
                    <div key={c.id} className="flex items-start justify-between pt-3 gap-2">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-[#1e3fae]" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs leading-tight line-clamp-1">{c.name}</p>
                          <p className="text-slate-400 text-[10px] font-medium leading-normal mt-0.5">Yêu cầu xác thực hồ sơ</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/admin/companies")}
                        className="text-[10px] font-bold text-[#1e3fae] hover:underline shrink-0"
                      >
                        Duyệt
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/jobs")}
            className="w-full mt-4 h-10 border border-slate-200 hover:border-[#1e3fae]/30 hover:bg-slate-50 text-slate-650 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            Đến danh sách duyệt <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Recent activity log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-900 text-lg mb-5 leading-tight">Hoạt động gần đây trên hệ thống</h3>
        <div className="space-y-4">
          {recentActivities.map((act) => {
            const logo = act.logo ? employerService.getLogoUrl(act.logo) : "";
            return (
              <div key={act.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : act.type === "job" ? (
                      <Briefcase className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{act.title}</h4>
                    <p className="text-slate-400 text-xs mt-0.5 font-medium">{act.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(act.time).toLocaleDateString("vi-VN")}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{new Date(act.time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    act.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : act.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}>
                    {act.status === "approved" ? "Đã duyệt" : act.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
