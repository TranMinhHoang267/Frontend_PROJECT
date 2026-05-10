import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2, ArrowLeft,
  FileText, CheckCircle, Gift, Cpu,
} from "lucide-react";
import { jobService } from "../../services/job.service";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Skill { id: number; name: string }

interface JobDetail {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  salary_min: number | null;
  salary_max: number | null;
  location: string | null;
  job_type: string | null;
  job_level: string | null;
  deadline: string | null;
  status: "pending" | "approved" | "paused" | "rejected";
  rejection_reason: string | null;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const salaryText = (min: number | null, max: number | null) => {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}N`;
    return String(n);
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  if (min) return `Từ ${fmt(min)} VND`;
  return `Đến ${fmt(max!)} VND`;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: "Chờ duyệt",    color: "bg-amber-100 text-amber-700 border-amber-300" },
  approved: { label: "Đang tuyển",   color: "bg-green-100 text-green-700 border-green-300" },
  paused:   { label: "Tạm dừng",    color: "bg-slate-100 text-slate-500 border-slate-300" },
  rejected: { label: "Bị từ chối",  color: "bg-red-100 text-red-600 border-red-300" },
};

const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-blue-50 text-[#1e3fae] border border-blue-100/50">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="md:pl-12">
      {children}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RecruiterJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob]       = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");



  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await jobService.getJobDetail(id);
        setJob(res?.data ?? res);
      } catch {
        setError("Không tìm thấy tin đăng hoặc bạn không có quyền xem.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-[#1e3fae]" />
    </div>
  );

  if (error || !job) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <p className="text-slate-400 text-lg">{error || "Không tìm thấy tin đăng."}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-5 py-2.5 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] transition-all">
        Quay lại
      </button>
    </div>
  );

  const meta = STATUS_META[job.status] ?? STATUS_META.pending;
  const deadline = job.deadline ? new Date(job.deadline) : null;
  const isPastDeadline = deadline && deadline < new Date();

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 md:px-10 font-display text-slate-900 relative">
      {/* Back */}
      <button
        onClick={() => navigate("/recruiter/jobs")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại quản lý công việc
      </button>

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-black text-slate-900 leading-snug">{job.title}</h1>
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${meta.color}`}>
                {meta.label}
              </span>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-3 mt-3">
              {job.location && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                  {job.location}
                </span>
              )}
              {job.job_type && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                  {job.job_type}
                </span>
              )}
              {job.job_level && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">trending_up</span>
                  {job.job_level}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
                {salaryText(job.salary_min, job.salary_max)}
              </span>
              {deadline && (
                <span className={`flex items-center gap-1.5 text-sm font-semibold ${isPastDeadline ? "text-red-500" : "text-slate-500"}`}>
                  <span className="material-symbols-outlined text-[18px]">{isPastDeadline ? "event_busy" : "event"}</span>
                  {isPastDeadline ? "Đã hết hạn: " : "Hạn nộp: "}
                  {deadline.toLocaleDateString("vi-VN")}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="material-symbols-outlined text-[16px]">history</span>
                Đăng ngày {new Date(job.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rejected reason */}
      {job.status === "rejected" && job.rejection_reason && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-sm font-bold text-red-600 mb-1">Lý do từ chối:</p>
          <p className="text-sm text-red-500">{job.rejection_reason}</p>
        </div>
      )}

      <div className="grid gap-5">
        {/* Skills */}
        {job.skills?.length > 0 && (
          <Section title="Kỹ năng yêu cầu" icon={Cpu}>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(s => (
                <span key={s.id} className="px-4 py-1.5 rounded-xl bg-blue-50 text-[#1e3fae] text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                  {s.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Description */}
        {job.description && (
          <Section title="Mô tả công việc" icon={FileText}>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </Section>
        )}

        {/* Requirements */}
        {job.requirements && (
          <Section title="Yêu cầu ứng viên" icon={CheckCircle}>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
          </Section>
        )}

        {/* Benefits */}
        {job.benefits && (
          <Section title="Quyền lợi" icon={Gift}>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.benefits}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
