import { useState, useEffect } from "react";
import { 
  Users, CheckCircle,
  TrendingUp, TrendingDown, ArrowRight, Loader2,
  FileText
} from "lucide-react";
import { employerService } from "../../services/employer.service";
import type { DashboardStats } from "../../services/employer.service";
import { Link } from "react-router-dom";
import { avatarService } from "../../services/avatar.service";
// ─── Components ─────────────────────────────────────────────────────────────

const StatCard = ({ title, value, trend, icon: Icon, colorClass, bgClass }: { title: string; value: string | number; trend?: number; icon: React.ElementType; colorClass: string; bgClass: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${bgClass} transition-colors group-hover:brightness-95`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-slate-500 text-sm font-medium mb-1">{title}</span>
      <span className="text-3xl font-black text-slate-900">{value}</span>
    </div>
  </div>
);

const CustomBarChart = () => {
  // Mock data for the bar chart
  const data = [40, 60, 45, 80, 55, 90, 75, 60, 85, 70, 95, 80];
  return (
    <div className="relative h-48 w-full mt-8 flex items-end justify-between gap-1 px-1">
      {data.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="w-full relative">
             <div 
              className="w-full bg-[#1e3fae] bg-opacity-20 rounded-t-lg transition-all duration-500 group-hover:bg-opacity-40" 
              style={{ height: `${h}%` }}
            />
            <div 
              className="absolute bottom-0 w-full bg-[#1e3fae] rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm" 
              style={{ height: `${h * 0.4}%` }}
            />
          </div>
        </div>
      ))}
      {/* Labels overlay */}
      <div className="absolute -bottom-8 w-full flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Ngày 1</span>
        <span>Ngày 7</span>
        <span>Ngày 14</span>
        <span>Ngày 21</span>
        <span>Ngày 30</span>
      </div>
    </div>
  );
};

const StatusProgress = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-slate-600">{label}</span>
        <span className="text-xs font-black text-slate-900">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RecruiterDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await employerService.getDashboard();
        setData(res);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#1e3fae] animate-spin" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Chào mừng trở lại, Nhà tuyển dụng!</h1>
          <p className="text-slate-500 text-sm mt-1">Đây là tình hình quy trình tuyển dụng của bạn hôm nay.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Tổng tin đăng" 
          value={data.jobs.total} 
          trend={12} 
          icon={FileText} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50"
        />
        <StatCard 
          title="Tổng hồ sơ" 
          value={data.applications.total} 
          trend={5.4} 
          icon={Users} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50"
        />
        <StatCard 
          title="Tin đang hoạt động" 
          value={data.jobs.approved} 
          trend={-2} 
          icon={CheckCircle} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50"
        />
        <StatCard 
          title="Tỷ lệ thành công" 
          value={data.successRate} 
          trend={18} 
          icon={TrendingUp} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 pb-12 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">Tổng quan hồ sơ</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Xu hướng trong 30 ngày qua</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all">
              <option>30 ngày qua</option>
              <option>7 ngày qua</option>
            </select>
          </div>
          <CustomBarChart />
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-black text-slate-900 mb-6">Phân bổ trạng thái</h2>
          <div className="space-y-6 flex-1">
            <StatusProgress label="Ứng viên mới" count={data.applications.submitted} total={data.applications.total} color="bg-blue-500" />
            <StatusProgress label="Đang xem xét" count={data.applications.under_review} total={data.applications.total} color="bg-amber-500" />
            <StatusProgress label="Đang phỏng vấn" count={data.applications.interview} total={data.applications.total} color="bg-indigo-500" />
            <StatusProgress label="Đã tuyển" count={data.applications.accepted} total={data.applications.total} color="bg-emerald-500" />
          </div>
          <Link to="/recruiter/candidates" className="mt-8 text-center text-xs font-bold text-[#1e3fae] hover:underline">
            Xem phân tích chi tiết
          </Link>
        </div>
      </div>

      {/* Recent Applicants */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Ứng viên gần đây</h2>
          <Link to="/recruiter/candidates" className="text-xs font-bold text-[#1e3fae] flex items-center gap-1 hover:underline">
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Tên ứng viên</th>
                <th className="px-6 py-4">Vị trí ứng tuyển</th>
                <th className="px-6 py-4">Ngày nộp</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.recentApplications.slice(0, 3).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-blue-50 text-[#1e3fae] border border-blue-100 flex items-center justify-center font-black text-xs">
                        {app.candidate?.avatarUrl ? (
                          <img src={avatarService.toAbsUrl(app.candidate.avatarUrl)} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          app.candidate.fullName.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-none">{app.candidate.fullName}</span>
                        <span className="text-[11px] text-slate-400 mt-1">{app.candidate.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-600">{app.jobTitle}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500">
                      {new Date(app.appliedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      app.status === 'interview' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {app.status === 'submitted' ? 'Mới' :
                       app.status === 'under_review' ? 'Đang xem xét' :
                       app.status === 'interview' ? 'Phỏng vấn' :
                       app.status === 'accepted' ? 'Đã tuyển' : 'Từ chối'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
