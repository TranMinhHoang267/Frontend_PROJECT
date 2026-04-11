import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { employerApplicationService } from "../../services/employerApplication.service";
import type { EmployerApplication } from "../../services/employerApplication.service";

const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  submitted: { label: "MỚI", classes: "bg-blue-100 text-[#1e3fae]" },
  under_review: { label: "ĐANG XEM XÉT", classes: "bg-purple-100 text-[#6b21a8]" },
  interview: { label: "PHỎNG VẤN", classes: "bg-yellow-100 text-[#a16207]" },
  accepted: { label: "ĐÃ TUYỂN", classes: "bg-green-100 text-[#15803d]" },
  rejected: { label: "TỪ CHỐI", classes: "bg-red-100 text-[#b91c1c]" }
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
      
      console.log("[CandidatesManager] Applicants từ API:", res);

      const data: EmployerApplication[] = Array.isArray(res) ? res : [];
      setApplicants(data);
      
      // Đếm stats từ dữ liệu thực
      if (data.length > 0) {
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

  const handleViewProfile = (app: EmployerApplication, currId: string | number) => {
    console.log("[handleViewProfile] navigating with id:", currId, "| full app object:", app);
    navigate(`/recruiter/candidates/${currId}`, { state: { initialApp: app } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900 mb-2 font-display tracking-tight">Quản lý Ứng viên</h1>
        <p className="text-slate-600">Theo dõi và quản lý các hồ sơ ứng tuyển từ các tin tuyển dụng của bạn.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center mb-6 overflow-x-auto gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id !== "all" ? stats[tab.id] : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                isActive 
                  ? "bg-[#1e3fae] text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label} {count != null && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Ứng viên</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Vị trí ứng tuyển</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày nộp</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">Không có ứng viên nào.</td>
                </tr>
              ) : (
                applicants.map((app) => {
                  const statusConf = STATUS_CONFIG[app.status] || { label: app.status, classes: "bg-slate-100 text-slate-700" };
                  
                  // Safe initial extract
                  const candidateAny = app.candidate;
                  const fullName = candidateAny?.full_name || `${candidateAny?.first_name || 'N'} ${candidateAny?.last_name || 'A'}`;
                  const names = fullName.trim().split(" ");
                  const initial = names[0] ? names[0].charAt(0) : "N";
                  const lastNameInitial = names.length > 1 ? names[names.length - 1].charAt(0) : "";
                  const avatarLetters = `${initial}${lastNameInitial}`.toUpperCase();

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const appAny = app as any;
                  const currId = appAny.application_id || appAny.id || appAny._id || "unknown";
                  console.log("[CandidatesManager] currId:", currId);
                  return (
                    <tr key={currId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0 text-[#1e3fae] font-bold text-sm">
                            {candidateAny?.avatar_url ? (
                              <img src={candidateAny.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            ) : avatarLetters}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {fullName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{candidateAny?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-700">{app.title || app.job?.title || "Không rõ vị trí"}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-500 text-sm">
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString('vi-VN') : "12/10/2023"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${statusConf.classes}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => handleViewProfile(app, currId)}
                          className="text-[#1e3fae] font-bold text-sm hover:underline"
                        >
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && applicants.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Hiển thị <strong className="text-slate-900">1-{applicants.length}</strong> của <strong className="text-slate-900">53</strong> ứng viên</span>
            <div className="flex items-center gap-1.5">
              <button className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">&lt;</button>
              <button className="size-8 rounded-lg bg-[#1e3fae] text-white flex items-center justify-center font-medium">1</button>
              <button className="size-8 rounded-lg border border-transparent hover:bg-slate-50 text-slate-700 flex items-center justify-center font-medium">2</button>
              <button className="size-8 rounded-lg border border-transparent hover:bg-slate-50 text-slate-700 flex items-center justify-center font-medium">3</button>
              <span className="text-slate-400">...</span>
              <button className="size-8 rounded-lg border border-transparent hover:bg-slate-50 text-slate-700 flex items-center justify-center font-medium">11</button>
              <button className="size-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">&gt;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
