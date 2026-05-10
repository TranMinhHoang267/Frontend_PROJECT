import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, Search, Mail, Calendar, 
  ArrowUpRight, Users, CheckCircle, 
  Clock, Briefcase
} from "lucide-react";
import { employerApplicationService } from "../../services/employerApplication.service";
import type { EmployerApplication } from "../../services/employerApplication.service";

const STATUS_CONFIG: Record<string, { label: string, classes: string, dot: string }> = {
  submitted: { label: "MỚI", classes: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  under_review: { label: "XEM XÉT", classes: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-500" },
  interview: { label: "PHỎNG VẤN", classes: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  accepted: { label: "ĐÃ TUYỂN", classes: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  rejected: { label: "TỪ CHỐI", classes: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" }
};

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "submitted", label: "Mới" },
  { id: "under_review", label: "Đang xem xét" },
  { id: "interview", label: "Phỏng vấn" },
  { id: "accepted", label: "Đã tuyển" },
  { id: "rejected", label: "Từ chối" },
];

export default function CandidatesManager() {
  const [activeTab, setActiveTab] = useState("all");
  const [applicants, setApplicants] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplicants();
  }, [activeTab]);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === "all" ? undefined : activeTab;
      const res = await employerApplicationService.getApplicants({ status: statusParam });
      const data: EmployerApplication[] = Array.isArray(res) ? res : [];
      setApplicants(data);
      
      // Update stats from full list if on "all" tab
      if (activeTab === "all") {
        const counts: Record<string, number> = {};
        data.forEach((app) => {
          counts[app.status] = (counts[app.status] || 0) + 1;
        });
        setStats(counts);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách ứng viên:", error);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplicants = applicants.filter(app => {
    const fullName = app.candidate?.full_name || `${app.candidate?.first_name || ''} ${app.candidate?.last_name || ''}`;
    return fullName.toLowerCase().includes(search.toLowerCase()) || 
           (app.title || app.job?.title || "").toLowerCase().includes(search.toLowerCase());
  });

  const handleViewProfile = (app: EmployerApplication) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appAny = app as any;
    const currId = appAny.application_id || appAny.id || appAny._id || "unknown";
    navigate(`/recruiter/candidates/${currId}`, { state: { initialApp: app } });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 md:px-10 font-display text-slate-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý ứng viên</h1>
        <p className="text-slate-500 mt-1.5 text-sm">Theo dõi và quản lý các hồ sơ ứng tuyển từ các vị trí đang tuyển dụng.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng hồ sơ", value: applicants.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Hồ sơ mới", value: stats.submitted || 0, icon: Clock, color: "bg-emerald-50 text-emerald-600" },
          { label: "Phỏng vấn", value: stats.interview || 0, icon: Calendar, color: "bg-amber-50 text-amber-600" },
          { label: "Đã tuyển", value: stats.accepted || 0, icon: CheckCircle, color: "bg-indigo-50 text-indigo-600" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`size-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên ứng viên, vị trí..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ứng viên</th>
                <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vị trí ứng tuyển</th>
                <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày nộp</th>
                <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="py-4 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-sm font-bold text-slate-400">Đang tải...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Users className="w-12 h-12 text-slate-300" />
                      <p className="text-sm font-bold text-slate-400">Không có ứng viên nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((app) => {
                  const status = STATUS_CONFIG[app.status] || { label: app.status, classes: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
                  const fullName = app.candidate?.full_name || `${app.candidate?.first_name || 'N'} ${app.candidate?.last_name || 'A'}`;
                  
                  return (
                    <tr key={app.application_id || app.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            {app.candidate?.avatar_url ? (
                              <img src={app.candidate.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                              <span className="text-blue-700 font-black text-sm">{fullName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{fullName}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {app.candidate?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-sm font-semibold truncate">{app.title || app.job?.title || "Không rõ vị trí"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 font-medium">
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString('vi-VN') : "---"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider border ${status.classes}`}>
                          <div className={`size-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => handleViewProfile(app)}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                          Hồ sơ <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredApplicants.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
              {filteredApplicants.length} Ứng viên
            </p>
            <div className="flex gap-1">
              <button className="size-8 rounded-lg border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="size-8 rounded-lg bg-blue-600 text-white font-bold text-xs">1</button>
              <button className="size-8 rounded-lg border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
