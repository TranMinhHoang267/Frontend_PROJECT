import { useState, useEffect } from "react";
import { Loader2, Users, Eye, PauseCircle, PlayCircle, ChevronRight, Search } from "lucide-react";
import { jobService } from "../../services/job.service";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Applicant {
  id: number;
  full_name: string;
  email: string;
  createdAt: string;
}

interface JobWithApplicants {
  id: number;
  title: string;
  location: string | null;
  job_type: string | null;
  job_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: "approved" | "paused";
  deadline: string | null;
  updatedAt: string;
  applicantCount?: number;
  applicants?: Applicant[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}tr` : String(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  if (min) return `Từ ${fmt(min)} VND`;
  return `Đến ${fmt(max!)} VND`;
};

const timeLeft = (deadline: string | null) => {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return { label: "Đã hết hạn", urgent: true };
  const days = Math.floor(diff / 86400000);
  if (days === 0) return { label: "Hết hạn hôm nay", urgent: true };
  return { label: `Còn ${days} ngày`, urgent: days <= 3 };
};

const JOB_COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed"];
const JobIcon = ({ title, id }: { title: string; id: number }) => (
  <div
    className="size-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold"
    style={{ background: JOB_COLORS[id % JOB_COLORS.length] }}
  >
    {title.charAt(0).toUpperCase()}
  </div>
);

// ─── Applicant Drawer ─────────────────────────────────────────────────────────
const ApplicantDrawer = ({
  job,
  applicants,
  loading,
  onClose,
}: {
  job: JobWithApplicants;
  applicants: Applicant[];
  loading: boolean;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
    <div
      className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Drawer Header */}
      <div className="flex items-start justify-between p-6 border-b border-slate-100">
        <div>
          <h2 className="font-black text-slate-900 text-base">{job.title}</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {job.location ?? "Không xác định"} • {job.job_type ?? ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="size-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Count Banner */}
      <div className="mx-6 mt-5 mb-1 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Users className="w-5 h-5 text-[#1e3fae] flex-shrink-0" />
        <span className="text-sm font-bold text-[#1e3fae]">
          {loading ? "Đang tải..." : `${applicants.length} ứng viên đã nộp hồ sơ`}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-[#1e3fae]" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600">Chưa có ứng viên nộp hồ sơ</p>
            <p className="text-slate-400 text-sm mt-1">Tin đăng đang được lan tỏa đến ứng viên.</p>
          </div>
        ) : (
          applicants.map((ap, i) => (
            <div key={ap.id} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
              <div className="size-10 rounded-full bg-[#1e3fae]/10 text-[#1e3fae] flex items-center justify-center font-bold text-sm flex-shrink-0">
                {ap.full_name?.charAt(0)?.toUpperCase() ?? String(i + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{ap.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{ap.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] font-semibold text-slate-400">
                  {new Date(ap.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function JobsManager() {
  const [jobs, setJobs] = useState<JobWithApplicants[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drawer state
  const [selectedJob, setSelectedJob] = useState<JobWithApplicants | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Load approved + paused jobs
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const [approvedRes, pausedRes] = await Promise.all([
          jobService.getMyJobs({ limit: 50, status: "approved" }),
          jobService.getMyJobs({ limit: 50, status: "paused" }),
        ]);
        const approvedJobsRaw = approvedRes.data?.jobs ?? approvedRes.jobs ?? [];
        const pausedJobsRaw = pausedRes.data?.jobs ?? pausedRes.jobs ?? [];
        setJobs([...approvedJobsRaw, ...pausedJobsRaw]);
      } catch {
        showToast("err", "Không thể tải danh sách công việc.");
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  // Open drawer + load applicants
  const openDrawer = async (job: JobWithApplicants) => {
    setSelectedJob(job);
    setApplicants([]);
    setLoadingApplicants(true);
    try {
      const res = await jobService.getApplicants(job.id);
      setApplicants(res.data ?? res ?? []);
    } catch {
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Toggle pause
  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const res = await jobService.togglePause(id);
      setJobs(j => j.map(x => x.id === id ? { ...x, status: res.status } : x));
      showToast("ok", res.message);
    } catch {
      showToast("err", "Không thể thay đổi trạng thái.");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 px-6 md:px-10 font-display text-slate-900 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Applicant Drawer */}
      {selectedJob && (
        <ApplicantDrawer
          job={selectedJob}
          applicants={applicants}
          loading={loadingApplicants}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý công việc</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi các vị trí đã được duyệt và quản lý hồ sơ ứng viên.</p>
        </div>
        <a href="/recruiter/post-job" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] shadow-md shadow-[#1e3fae]/20 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span> Đăng tin mới
        </a>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Tổng tin đăng", value: jobs.length, icon: "work", color: "bg-blue-50 text-[#1e3fae]" },
          { label: "Đang hoạt động", value: jobs.filter(j => j.status === "approved").length, icon: "check_circle", color: "bg-green-50 text-green-600" },
          { label: "Tạm dừng", value: jobs.filter(j => j.status === "paused").length, icon: "pause_circle", color: "bg-amber-50 text-amber-600" },
          { label: "Tổng ứng viên", value: "—", icon: "group", color: "bg-indigo-50 text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên vị trí, địa điểm..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm transition-all"
        />
      </div>

      {/* ── Job List ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3fae]" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-300">work_outline</span>
          </div>
          <p className="font-bold text-slate-700 mb-1">Chưa có công việc đã được duyệt</p>
          <p className="text-slate-400 text-sm mb-5">Tin đăng của bạn đang chờ Admin xét duyệt.</p>
          <a href="/recruiter/post-job" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span> Đăng tin mới
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map(job => {
            const dl = timeLeft(job.deadline);
            return (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all"
              >
                {/* Icon + Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <JobIcon title={job.title} id={job.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{job.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${job.status === "approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {job.status === "approved" ? "Đang tuyển" : "Tạm dừng"}
                      </span>
                      {dl && (
                        <span className={`text-[10px] font-semibold ${dl.urgent ? "text-red-500" : "text-slate-400"}`}>
                          {dl.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {job.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-[13px]">payments</span>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                      {job.job_type && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {job.job_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Applicant count pill */}
                <button
                  onClick={() => openDrawer(job)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#1e3fae] hover:bg-[#1e3fae] hover:text-white transition-all border border-blue-100 hover:border-transparent font-semibold text-sm flex-shrink-0"
                >
                  <Users className="w-4 h-4" />
                  Xem ứng viên
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Chi tiết
                  </button>
                  <button
                    onClick={() => handleToggle(job.id)}
                    disabled={togglingId === job.id}
                    title={job.status === "paused" ? "Mở lại" : "Tạm dừng"}
                    className="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors disabled:opacity-50"
                  >
                    {togglingId === job.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : job.status === "paused" ? (
                      <PlayCircle className="w-4 h-4" />
                    ) : (
                      <PauseCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
