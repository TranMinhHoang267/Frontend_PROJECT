import { useState, useEffect } from "react";
import { Plus, X, Loader2, CheckCircle2, Trash2, Eye, PauseCircle, PlayCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { jobService } from "../../services/job.service";
import type { CreateJobPayload } from "../../services/job.service";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Job {
  id: string;
  title: string;
  location: string | null;
  jobType: string | null;
  jobLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  status: "pending" | "approved" | "rejected" | "paused";
  updatedAt: string;
  skills?: { name: string }[];
  deadline?: string | null;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
}

// ─── Schema ─────────────────────────────────────────────────────────────────
const jobSchema = z.object({
  title: z.string().min(3, "Vui lòng nhập tiêu đề từ 3 ký tự trở lên."),
  job_type: z.string().min(1),
  job_level: z.string().min(1),
  deadline: z.string().min(1, "Vui lòng chọn hạn chót."),
  location: z.string().min(1, "Vui lòng nhập địa điểm."),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
});
type JobFormValues = z.infer<typeof jobSchema>;

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Job["status"] }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: "Chờ duyệt",  cls: "bg-amber-50  text-amber-700  border-amber-200" },
    approved: { label: "Đã duyệt",   cls: "bg-green-50  text-green-700  border-green-200" },
    rejected: { label: "Từ chối",    cls: "bg-red-50    text-red-700    border-red-200"   },
    paused:   { label: "Tạm dừng",   cls: "bg-slate-100 text-slate-600  border-slate-200" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ─── Salary helper ───────────────────────────────────────────────────────────
const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}tr` : String(n));
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  if (min) return `Từ ${fmt(min)} VND`;
  return `Đến ${fmt(max!)} VND`;
};

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

// ─── Job Icon ─────────────────────────────────────────────────────────────────
const JOB_COLORS = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed"];
const JobIcon = ({ title, id }: { title: string; id: string }) => {
  const color = JOB_COLORS[id.length % JOB_COLORS.length];
  return (
    <div className="size-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-lg font-bold" style={{ background: color }}>
      {title.charAt(0).toUpperCase()}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function JobManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "manage" ? "manage" : "post";
  const [tab, setTab] = useState<"post" | "manage">(initialTab);

  const changeTab = (t: "post" | "manage") => {
    setTab(t);
    setSearchParams(t === "manage" ? { tab: "manage" } : {}, { replace: true });
  };

  // ── Form state ──
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // ── Job list state ──
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { job_type: "Toàn thời gian", job_level: "Junior" },
  });

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load jobs ──
  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await jobService.getMyJobs({ limit: 50 });
      setJobs(res.data?.jobs ?? res.jobs ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (tab === "manage") loadJobs();
  }, [tab]);

  // ── Skill logic ──
  const handleAddSkill = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (e) e.preventDefault();
    const val = skillInput.trim();
    if (!val || skills.includes(val)) return;
    setSkills([...skills, val]);
    setSkillInput("");
  };
  const removeSkill = (sk: string) => setSkills(skills.filter(s => s !== sk));

  // ── Handle Edit Click ──
  const handleEditClick = (job: Job) => {
    setEditingJobId(job.id);
    setTab("post");
    
    // Format deadline for input[type="date"]
    let deadlineStr = "";
    if (job.deadline) {
      deadlineStr = new Date(job.deadline).toISOString().split('T')[0];
    }

    reset({
      title: job.title,
      job_type: job.jobType || "Toàn thời gian",
      job_level: job.jobLevel || "Junior",
      location: job.location || "",
      description: job.description || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      salary_min: job.salaryMin !== null ? String(job.salaryMin) : "",
      salary_max: job.salaryMax !== null ? String(job.salaryMax) : "",
      deadline: deadlineStr,
    });

    setSkills(job.skills?.map(s => s.name) || []);
    setIsNegotiable(job.salaryMin === null && job.salaryMax === null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    reset({
      title: "",
      job_type: "Toàn thời gian",
      job_level: "Junior",
      location: "",
      description: "",
      requirements: "",
      benefits: "",
      salary_min: "",
      salary_max: "",
      deadline: "",
    });
    setSkills([]);
    setIsNegotiable(true);
  };

  // ── Submit ──
  const onSubmit = async (data: JobFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateJobPayload = {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        salaryMin: isNegotiable ? null : (data.salary_min ? Number(data.salary_min) : null),
        salaryMax: isNegotiable ? null : (data.salary_max ? Number(data.salary_max) : null),
        location: data.location,
        jobType: data.job_type,
        jobLevel: data.job_level,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        skills,
      };

      if (editingJobId) {
        await jobService.updateJob(editingJobId, payload);
        showToast("ok", "Cập nhật thành công! Tin đang chờ duyệt lại.");
        setEditingJobId(null);
      } else {
        await jobService.createJob(payload);
        showToast("ok", "Đăng tin thành công! Đang chờ Admin duyệt.");
      }

      reset();
      setSkills([]);
      setIsNegotiable(true);
      changeTab("manage");
      loadJobs();
    } catch (err) {
      const ae = err as AxiosError<{ message: string }>;
      showToast("err", ae.response?.data?.message ?? "Thao tác thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle pause ──
  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await jobService.togglePause(id);
      setJobs(prev => prev.map(x => x.id === id ? { ...x, status: res.status } : x));
      showToast("ok", res.message);
    } catch {
      showToast("err", "Không thể thay đổi trạng thái.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa tin đăng này?")) return;
    setDeletingId(id);
    try {
      await jobService.deleteJob(id);
      setJobs(prev => prev.filter(x => x.id !== id));
      showToast("ok", "Đã xóa tin đăng.");
    } catch {
      showToast("err", "Không thể xóa tin đăng.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJobs = filterStatus === "all" ? jobs : jobs.filter(j => j.status === filterStatus);

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto py-8 px-6 md:px-10 font-display text-slate-900 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all ${toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{editingJobId ? "Chỉnh sửa Tin tuyển dụng" : "Quản lý Tin tuyển dụng"}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {editingJobId ? "Cập nhật thông tin chi tiết cho tin tuyển dụng của bạn." : "Theo dõi và quản lý hiệu quả các vị trí đang tuyển dụng."}
          </p>
        </div>
        {tab === "manage" && (
          <button onClick={() => { handleCancelEdit(); changeTab("post"); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] shadow-md shadow-[#1e3fae]/20 transition-all">
            <Plus className="w-4 h-4" /> Đăng tin mới
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-slate-200 mb-7">
        {[
          { key: "post",   label: editingJobId ? "Cập nhật tin" : "Đăng tin mới" },
          { key: "manage", label: "Quản lý tin nháp" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === "post" && !editingJobId) handleCancelEdit();
              changeTab(t.key as "post" | "manage");
            }}
            className={`pb-3 px-1 mr-4 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? "border-[#1e3fae] text-[#1e3fae]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ TAB 1: ĐĂNG TIN ══════════════════ */}
      {tab === "post" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card: Basic Info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-8 rounded-lg bg-blue-50 text-[#1e3fae] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">article</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Thông tin cơ bản</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tiêu đề công việc</label>
                    <input
                      {...register("title")}
                      type="text"
                      className={`w-full h-11 px-4 rounded-xl border ${errors.title ? "border-red-400" : "border-slate-200"} bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm transition-all`}
                      placeholder="Vd: Senior Frontend Developer (React/Next.js)"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>
                  {/* Type + Level */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Loại hình làm việc</label>
                      <div className="relative">
                        <select {...register("job_type")} className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm appearance-none cursor-pointer">
                          <option>Toàn thời gian</option>
                          <option>Bán thời gian</option>
                          <option>Thực tập</option>
                          <option>Từ xa (Remote)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Cấp bậc</label>
                      <div className="relative">
                        <select {...register("job_level")} className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm appearance-none cursor-pointer">
                          <option>Intern / Fresher</option>
                          <option>Junior</option>
                          <option>Middle</option>
                          <option>Senior</option>
                          <option>Manager</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
                      </div>
                    </div>
                  </div>
                  {/* Location + Deadline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Địa điểm</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                        <input {...register("location")} type="text" className={`w-full h-11 pl-9 pr-4 rounded-xl border ${errors.location ? "border-red-400" : "border-slate-200"} bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm`} placeholder="Thành phố hoặc Địa chỉ cụ thể" />
                      </div>
                      {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Hạn chót ứng tuyển</label>
                      <input {...register("deadline")} type="date" className={`w-full h-11 px-4 rounded-xl border ${errors.deadline ? "border-red-400" : "border-slate-200"} bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm text-slate-600`} />
                      {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Job Detail */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </div>
                  <h2 className="text-sm font-bold">Chi tiết công việc</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mô tả công việc</label>
                    <textarea {...register("description")} rows={5} className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm resize-none" placeholder="Mô tả các nhiệm vụ chính..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Yêu cầu ứng viên</label>
                    <textarea {...register("requirements")} rows={5} className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm resize-none" placeholder="Kinh nghiệm, kỹ năng cần thiết..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Quyền lợi</label>
                    <textarea {...register("benefits")} rows={4} className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm resize-none" placeholder="Chế độ đãi ngộ, bảo hiểm, du lịch..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Right (1/3) */}
            <div className="space-y-5">
              {/* Salary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </div>
                  <h2 className="text-sm font-bold">Lương & Kỹ năng</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mức lương (VND)</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <input {...register("salary_min")} type="text" disabled={isNegotiable} className="h-10 px-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400" placeholder="Từ" />
                      <input {...register("salary_max")} type="text" disabled={isNegotiable} className="h-10 px-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400" placeholder="Đến" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isNegotiable} onChange={e => setIsNegotiable(e.target.checked)} className="w-4 h-4 rounded text-[#1e3fae] border-slate-300 focus:ring-[#1e3fae]" />
                      <span className="text-xs font-semibold text-slate-600">Thỏa thuận</span>
                    </label>
                  </div>

                  <hr className="border-slate-100" />

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Kỹ năng yêu cầu</label>
                    {/* Existing skill tags */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {skills.map(sk => (
                          <div key={sk} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                            {sk}
                            <button type="button" onClick={() => removeSkill(sk)} className="hover:text-red-500 ml-0.5 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm"
                        placeholder="Nhập kỹ năng và nhấn Enter"
                      />
                      <button type="button" onClick={() => handleAddSkill()} className="absolute right-2 top-1/2 -translate-y-1/2 size-6 rounded-lg bg-[#1e3fae] text-white flex items-center justify-center hover:bg-blue-700 transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip card */}
              <div className="bg-[#1e3fae] rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  </div>
                  <h3 className="text-sm font-bold">Mẹo cho nhà tuyển dụng</h3>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">Tin tuyển dụng có hình ảnh văn phòng và mô tả quyền lợi rõ ràng thường nhận được nhiều hơn 40% lượt ứng tuyển chất lượng.</p>
              </div>

              {/* Action buttons */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] shadow-md shadow-[#1e3fae]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">rocket_launch</span>}
                {editingJobId ? "Cập nhật tin" : "Đăng tin ngay"}
              </button>
              {editingJobId && (
                <button type="button" onClick={handleCancelEdit} className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ══════════════════ TAB 2: QUẢN LÝ ══════════════════ */}
      {tab === "manage" && (
        <div>
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ duyệt" },
              { key: "approved", label: "Đã duyệt" },
              { key: "paused", label: "Tạm dừng" },
              { key: "rejected", label: "Từ chối" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${filterStatus === f.key ? "bg-[#1e3fae] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loadingJobs ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#1e3fae]" />
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">work_outline</span>
              </div>
              <p className="font-bold text-slate-700 mb-1">Chưa có tin đăng nào</p>
              <p className="text-slate-400 text-sm mb-5">Bắt đầu đăng tin để tìm ứng viên phù hợp</p>
              <button onClick={() => setTab("post")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] transition-all">
                <Plus className="w-4 h-4" /> Đăng tin tuyển dụng
              </button>
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <JobIcon title={job.title} id={job.id} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-snug line-clamp-2 text-slate-900 min-h-[2.5rem]">{job.title}</h3>
                        <span className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {timeAgo(job.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {job.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {job.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-[14px]">payments</span>
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button 
                      onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#1e3fae] text-white text-xs font-semibold hover:bg-[#162f8c] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </button>
                    <button 
                      onClick={() => handleEditClick(job)}
                      className="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-[#1e3fae] hover:bg-blue-50 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    {/* Toggle pause (only for approved/paused) */}
                    {(job.status === "approved" || job.status === "paused") && (
                      <button
                        onClick={() => handleToggle(job.id)}
                        disabled={togglingId === job.id}
                        title={job.status === "paused" ? "Mở lại" : "Tạm dừng"}
                        className="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors disabled:opacity-50"
                      >
                        {togglingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : job.status === "paused" ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingId === job.id}
                      className="size-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                    >
                      {deletingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
