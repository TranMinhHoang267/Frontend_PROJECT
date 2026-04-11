import { useState, useEffect, useCallback } from "react";
import {
  Loader2, CheckCircle2, XCircle, Eye, Trash2,
  Search, Clock, Building2, MapPin, Briefcase, FileText, CheckCircle, Navigation, Award, AlertCircle
} from "lucide-react";
import { adminJobService } from "../../services/adminJob.service";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Job {
  id: number;
  title: string;
  location: string | null;
  job_type: string | null;
  job_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  status: "pending" | "approved" | "rejected" | "paused";
  rejection_reason: string | null;
  deadline: string | null;
  createdAt: string;
  company?: { name: string; logo_url?: string | null };
  skills?: { id: number; name: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Thỏa thuận";

  const fmt = (n: number) => {
  if (n >= 1_000_000) {
    const inMillion = n / 1_000_000;
    return `${inMillion.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tr`;
  } else if (n >= 1_000) {
    const inThousand = n / 1_000;
    return `${inThousand.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} N`;
  }
  return `${n.toLocaleString("vi-VN")} đ`;
};

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
};

const StatusBadge = ({ status }: { status: Job["status"] }) => {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    pending:  { label: "Chờ duyệt",  cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", dot: "bg-amber-500" },
    approved: { label: "Đã duyệt",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500" },
    rejected: { label: "Từ chối",    cls: "bg-rose-500/10 text-rose-600 border-rose-500/20", dot: "bg-rose-500" },
    paused:   { label: "Tạm dừng",   cls: "bg-slate-500/10 text-slate-600 border-slate-500/20", dot: "bg-slate-500" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls} transition-all duration-300 hover:shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} relative`}>
         {status === 'pending' && <span className={`absolute inset-0 rounded-full ${s.dot} animate-ping opacity-75`} />}
      </span>
      {s.label}
    </span>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({
  job,
  onConfirm,
  onClose,
  loading,
}: {
  job: Job;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-rose-600" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-xl tracking-tight mb-2">Từ chối xét duyệt</h3>
        <p className="text-slate-500 text-sm mb-5 leading-relaxed">
          Bạn đang từ chối đăng tin <span className="font-bold text-slate-800">"{job.title}"</span>. Vui lòng cung cấp lý do để Nhà tuyển dụng khắc phục.
        </p>
        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lý do từ chối <span className="text-rose-500">*</span></label>
           <textarea
             rows={4}
             value={reason}
             onChange={e => setReason(e.target.value)}
             className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-sm resize-none transition-all duration-300"
             placeholder="Ví dụ: Nội dung vi phạm tiêu chuẩn cộng đồng, thiếu thông tin mức lương..."
           />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Job Detail Drawer ────────────────────────────────────────────────────────
const JobDetailDrawer = ({
  job,
  onClose,
  onApprove,
  onReject,
  loading,
}: {
  job: Job;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-40 flex justify-end animate-in fade-in duration-300" onClick={onClose}>
    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" />
    <div
      className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      onClick={e => e.stopPropagation()}
    >
      {/* Drawer Header */}
      <div className="flex items-start justify-between p-6 md:p-8 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 sticky top-0 z-10 backdrop-blur-xl">
        <div className="flex-1 pr-6 space-y-3">
          <StatusBadge status={job.status} />
          <h2 className="font-extrabold text-slate-900 text-2xl leading-tight tracking-tight">{job.title}</h2>
          <div className="flex items-center gap-4 flex-wrap">
            {job.company?.name && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Building2 className="w-4 h-4 text-emerald-500" />
                {job.company.name}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <MapPin className="w-4 h-4 text-blue-500" />
                {job.location}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">
        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Loại hình", value: job.job_type ?? "—", icon: Briefcase, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Cấp bậc", value: job.job_level ?? "—", icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Mức lương", value: formatSalary(job.salary_min, job.salary_max), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Hạn nộp", value: job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "—", icon: Clock, color: "text-rose-500", bg: "bg-rose-50" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-sm font-bold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Skills List */}
        {job.skills && job.skills.length > 0 && (
          <div className="animate-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-3 tracking-wide">
              <Navigation className="w-4 h-4 text-indigo-500" />
              YÊU CẦU KỸ NĂNG
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(skill => (
                <span key={skill.id} className="px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100/50 transition-colors shadow-sm">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Content Rendering */}
        {[
          { title: "MÔ TẢ CÔNG VIỆC", content: job.description, icon: FileText, color: "text-blue-500" },
          { title: "YÊU CẦU ỨNG VIÊN", content: job.requirements, icon: Award, color: "text-emerald-500" },
          { title: "QUYỀN LỢI ĐƯỢC HƯỞNG", content: job.benefits, icon: CheckCircle, color: "text-amber-500" }
        ].map((section, idx) => section.content && (
          <div key={idx} className="animate-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: `${(idx + 2) * 100}ms` }}>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-3 tracking-wide">
              <section.icon className={`w-4 h-4 ${section.color}`} />
              {section.title}
            </h3>
            <div className="prose prose-sm prose-slate max-w-none bg-slate-50 rounded-2xl p-6 border border-slate-100 leading-relaxed text-slate-700 shadow-inner">
              <ul className="space-y-2 m-0 p-0 list-none">
                {section.content.split('\n').filter(r => r.trim()).map((req, i) => (
                  <li key={i} className="flex items-start gap-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full pl-5">
                    {req.replace(/^[-*•]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Rejection Reason display */}
        {job.rejection_reason && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm mt-4 animate-in fade-in duration-300">
            <h3 className="flex items-center gap-2 text-sm font-bold text-rose-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              Lý do từ chối trước đó
            </h3>
            <p className="text-sm text-rose-800 leading-relaxed font-medium">{job.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      {job.status === "pending" && (
        <div className="p-6 md:p-8 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] flex gap-4 sticky bottom-0 z-10 backdrop-blur-xl">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-rose-50 disabled:hover:text-rose-600"
          >
            <XCircle className="w-5 h-5" /> Từ chối
          </button>
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shadow-emerald-500/25 disabled:opacity-50 disabled:hover:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Duyệt tin ngay
          </button>
        </div>
      )}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminJobReview() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [search, setSearch] = useState("");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const apiData = await adminJobService.getAllJobs(filterStatus === "all" ? undefined : filterStatus);
      // NOTE: Fix TS Type check. apiData returns unknown[] from services. We safely cast it.
      const parsedData = (apiData as unknown) as Job[];
      setJobs(parsedData ?? []);
    } catch {
      showToast("err", "Không thể tải danh sách tin đăng.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleApprove = async (job: Job) => {
    setActionLoading(true);
    try {
      await adminJobService.reviewJob(job.id, "approved");
      showToast("ok", `Tuyệt vời! Đã duyệt tin: "${job.title}"`);
      setSelectedJob(null);
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch {
      showToast("err", "Duyệt thất bại. Vui lòng thử lại sau.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (job: Job, reason: string) => {
    setActionLoading(true);
    try {
      await adminJobService.reviewJob(job.id, "rejected", reason);
      showToast("ok", `Đã từ chối tin: "${job.title}"`);
      setShowRejectModal(false);
      setSelectedJob(null);
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch {
      showToast("err", "Từ chối thất bại. Vui lòng thử lại sau.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.company?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = jobs.filter(j => j.status === "pending").length;

  return (
    <div className="min-h-full max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 duration-300 ${toast.type === "ok" ? "bg-emerald-600 text-white shadow-emerald-600/20" : "bg-rose-600 text-white shadow-rose-600/20"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {showRejectModal && selectedJob && (
        <RejectModal
          job={selectedJob}
          loading={actionLoading}
          onClose={() => setShowRejectModal(false)}
          onConfirm={(reason) => handleReject(selectedJob, reason)}
        />
      )}

      {selectedJob && !showRejectModal && (
        <JobDetailDrawer
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApprove={() => handleApprove(selectedJob)}
          onReject={() => setShowRejectModal(true)}
          loading={actionLoading}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Duyệt Tin Tuyển Dụng</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm pl-12">Quản lý và xét duyệt các vị trí việc làm mới nhất.</p>
        </div>
        {pendingCount > 0 && filterStatus === "pending" && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200/60 text-amber-700 rounded-xl shadow-sm animate-pulse">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold">{pendingCount} tin đang chờ duyệt</span>
          </div>
        )}
      </div>

      {/* ── Filter + Search Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-slate-100/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto hide-scrollbar">
          {[
            { key: "pending",  label: "Chờ duyệt", count: filterStatus === "all" ? jobs.filter(j=>j.status==='pending').length : null },
            { key: "approved", label: "Đã duyệt" },
            { key: "rejected", label: "Từ chối" },
            { key: "all",      label: "Tất cả" },
          ].map(f => {
            const active = filterStatus === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${active ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                {f.label}
                {f.count !== null && f.key === 'pending' && <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>{pendingCount}</span>}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm công việc, công ty..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* ── Job List Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="relative w-16 h-16 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-50" />
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 relative z-10" />
          </div>
          <p className="font-bold text-slate-500">Đang tải danh sách...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-extrabold text-slate-700 text-lg">Trống rỗng!</p>
          <p className="text-slate-400 font-medium mt-1">Không tìm thấy tin đăng nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest min-w-[250px]">Thông tin việc làm</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest hidden md:table-cell">Nhà tuyển dụng</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest hidden lg:table-cell min-w-[150px]">Mức lương</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map(job => (
                  <tr key={job.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center">
                          <Briefcase className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1 text-base">{job.title}</p>
                          <div className="flex items-center gap-3 text-[13px] font-medium text-slate-500 flex-wrap">
                            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{job.location}</span>}
                            {job.job_type && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{job.job_type}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {job.company?.name ? (
                          <span className="font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-xs border border-slate-200">{job.company.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Ẩn danh</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <span className="text-slate-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg text-xs border border-emerald-100 whitespace-nowrap inline-block">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedJob(job)}
                          title="Xem chi tiết"
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {job.status === "pending" && (
                          <>
                            <button
                              title="Duyệt"
                              onClick={() => handleApprove(job)}
                              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              title="Từ chối"
                              onClick={() => { setSelectedJob(job); setShowRejectModal(true); }}
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          title="Xóa"
                          onClick={async () => {
                            if (confirm("Chắc chắn xóa tin đăng này vĩnh viễn?")) {
                              await adminJobService.deleteJob(job.id);
                              setJobs(prev => prev.filter(j => j.id !== job.id));
                              showToast("ok", "Đã xóa tin đăng thành công.");
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

