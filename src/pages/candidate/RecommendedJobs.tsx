import { useState, useEffect } from "react";
import { Heart, MapPin, Loader2, Sparkles, Building2 } from "lucide-react";
import { jobService } from "../../services/job.service";
import { candidateService } from "../../services/candidate.service";
import { useNavigate } from "react-router-dom";
import { employerService } from "../../services/employer.service";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SkillItem { id: number | string; name: string }

interface JobItem {
  id: string | number;
  title: string;
  skills?: SkillItem[] | string;
  company?: { name?: string; logoUrl?: string; city?: string };
  location?: string;
  salaryMin?: number;  salary_min?: number;
  salaryMax?: number;  salary_max?: number;
  jobType?: string;    job_type?: string;
  jobLevel?: string;   job_level?: string;
  deadline?: string;
  createdAt?: string;
  match?: number;
  matchPercent?: number;
  matchedSkills?: string[];
  favorite?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatSalary = (job: JobItem): string => {
  const min = job.salaryMin ?? job.salary_min;
  const max = job.salaryMax ?? job.salary_max;
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}N`;
    return String(n);
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)} triệu`;
  if (min)        return `Từ ${fmt(min)} triệu`;
  if (max)        return `Tới ${fmt(max)} triệu`;
  return "Thỏa thuận";
};

const getSkills = (job: JobItem): SkillItem[] => {
  if (!job.skills) return [];
  if (Array.isArray(job.skills)) return job.skills as SkillItem[];
  if (typeof job.skills === "string" && job.skills.trim())
    return job.skills.split(",").map((s, i) => ({ id: i, name: s.trim() })).filter(s => s.name);
  return [];
};

const JOB_COLORS = ["#1e3fae", "#0891b2", "#059669", "#7c3aed", "#d97706", "#dc2626"];
const jobColor = (id: string | number) => JOB_COLORS[String(id).length % JOB_COLORS.length];

const matchBadgeStyle = (score: number) => {
  if (score >= 90) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 70) return "bg-blue-50 text-[#1e3fae] border-blue-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
};

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  job,
  onApply,
  onToggleFavorite,
}: {
  job: JobItem;
  onApply: (job: JobItem) => void;
  onToggleFavorite: (id: string | number) => void;
}) {
  const score        = job.match ?? job.matchPercent ?? 0;
  const skills       = getSkills(job);
  const matchedSet   = new Set(job.matchedSkills ?? []);
  const company      = job.company;
  const companyName  = company?.name || "Công ty bảo mật";
  const logoUrl      = employerService.getLogoUrl(company?.logoUrl);
  const location     = job.location || company?.city || "";
  const salary       = formatSalary(job);

  return (
    <div
      onClick={() => onApply(job)}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:shadow-lg hover:border-[#1e3fae]/30 hover:-translate-y-0.5 transition-all duration-200 shadow-sm group"
    >
      {/* ── Top: Logo + Title + Company ── */}
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div
          className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden"
          style={!logoUrl ? { background: jobColor(job.id) } : {}}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1 bg-white" />
          ) : (
            <span className="text-white text-lg font-black">{job.title.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          {/* Match + badges row */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${matchBadgeStyle(score)}`}>
              <Sparkles className="w-2.5 h-2.5" />
              {score}%
            </span>
          </div>

          {/* Job title */}
          <h3 className="font-bold text-slate-900 text-[13.5px] leading-snug line-clamp-2 group-hover:text-[#1e3fae] transition-colors">
            {job.title}
          </h3>

          {/* Company */}
          <p className="text-[11.5px] text-slate-400 font-medium mt-0.5 truncate" title={companyName}>
            {companyName}
          </p>
        </div>
      </div>

      {/* ── Skills (matched highlighted) ── */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 3).map(sk => {
            const isMatch = matchedSet.has(sk.name);
            return (
              <span
                key={sk.id}
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-lg border ${
                  isMatch
                    ? "bg-[#1e3fae]/8 text-[#1e3fae] border-[#1e3fae]/20 bg-blue-50"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {isMatch && "✓ "}{sk.name}
              </span>
            );
          })}
          {skills.length > 3 && (
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-[#1e3fae] border border-blue-100">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* ── Bottom: Salary + Location + Heart (luôn hiện) ── */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11.5px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
            {salary}
          </span>
          {location && (
            <span className="flex items-center gap-1 text-[11.5px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {location.length > 14 ? location.slice(0, 14) + "..." : location}
            </span>
          )}
        </div>
        {/* Heart — luôn hiển thị */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(job.id); }}
          title={job.favorite ? "Bỏ lưu" : "Lưu việc làm"}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            job.favorite
              ? "text-red-500 bg-red-50"
              : "text-slate-300 hover:text-red-400 hover:bg-red-50"
          }`}
        >
          <Heart className={`w-4 h-4 ${job.favorite ? "fill-red-500" : ""}`} />
        </button>
      </div>

      {/* ── Nút ứng tuyển — chỉ hiện khi hover (group-hover) ── */}
      <div className="overflow-hidden transition-all duration-200 ease-out max-h-0 group-hover:max-h-12 opacity-0 group-hover:opacity-100">
        <button
          onClick={e => { e.stopPropagation(); onApply(job); }}
          className="w-full h-9 bg-[#1e3fae] hover:bg-[#162f8c] text-white text-[12.5px] font-bold rounded-xl transition-colors shadow-sm shadow-[#1e3fae]/20 flex items-center justify-center mt-2"
        >
          Ứng tuyển ngay →
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecommendedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs]         = useState<JobItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [keywords, setKeywords] = useState("");
  const [page, setPage]         = useState(1);
  const PER_PAGE = 9; // 3 cols × 3 rows

  const fetchData = async () => {
    setLoading(true);
    try {
      const profile = await candidateService.getProfile();
      const profileStr = `${profile.headline || ""} ${profile.bio || ""} ${
        ((profile as Record<string, unknown>).skills as string[] || []).join(" ")
      }`.toLowerCase();
      let kw = "";
      if (profileStr.includes("backend"))  kw += "Backend ";
      if (profileStr.includes("frontend")) kw += "Frontend ";
      if (profileStr.includes("react"))    kw += "React ";
      if (profileStr.includes("node"))     kw += "NodeJS ";
      if (profileStr.includes("vue"))      kw += "Vue ";
      setKeywords(kw.trim() || profile.headline || "Phát triển phần mềm");

      const [suggestions, bookmarkData] = await Promise.all([
        jobService.getSuggestions(60),
        candidateService.getBookmarks({ limit: 200 }),
      ]);

      const bookmarkedIds = new Set(
        (bookmarkData.bookmarks || []).map(
          (b: { job?: { id?: string | number } }) => String(b.job?.id || "")
        )
      );

      setJobs(
        suggestions.map((job: JobItem) => ({
          ...job,
          match: job.matchPercent ?? job.match ?? 50,
          favorite: bookmarkedIds.has(String(job.id)),
        }))
      );
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply  = (job: JobItem) => navigate(`/candidate/apply/${job.id}`, { state: { job, from: '/candidate/recommended' } });
  const handleToggle = async (id: string | number) => {
    try {
      await candidateService.toggleBookmark(id);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, favorite: !j.favorite } : j));
    } catch (e) { console.error(e); }
  };

  const totalPages = Math.ceil(jobs.length / PER_PAGE);
  const paginated  = jobs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Pagination range with ellipsis
  const buildPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const res: (number | "...")[] = [1];
    if (page > 3) res.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) res.push(i);
    if (page < totalPages - 2) res.push("...");
    res.push(totalPages);
    return res;
  };

  return (
    <div className="max-w-[1100px] mx-auto py-6 px-4 md:px-8 space-y-5 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Việc làm gợi ý</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Dựa trên kỹ năng:{" "}
            <span className="font-bold text-[#1e3fae]">{keywords || "Phát triển phần mềm"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 shadow-sm whitespace-nowrap">
          <Building2 className="w-4 h-4 text-[#1e3fae]" />
          {loading ? "Đang tải..." : `${jobs.length} việc làm phù hợp`}
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="bg-[#f4f6fe] border border-blue-100 rounded-2xl px-4 py-3 flex gap-3 items-center">
        <Sparkles className="w-4 h-4 text-[#1e3fae] shrink-0" />
        <p className="text-slate-600 text-[13px]">
          <span className="font-bold text-slate-800">Kỹ năng ✓ xanh</span> = khớp hồ sơ của bạn •{" "}
          <span className="font-bold text-emerald-700">≥90%</span> rất phù hợp •{" "}
          <span className="font-bold text-[#1e3fae]">≥70%</span> phù hợp •{" "}
          <span className="font-bold text-amber-600">≥50%</span> tương đối
        </p>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin w-10 h-10 text-[#1e3fae]" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-bold text-slate-700 mb-1">Chưa có việc làm phù hợp</p>
          <p className="text-slate-400 text-sm">Cập nhật thêm kỹ năng trong hồ sơ để nhận gợi ý tốt hơn.</p>
        </div>
      ) : (
        <>
          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onApply={handleApply}
                onToggleFavorite={handleToggle}
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-[#1e3fae]/30 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm text-base font-bold"
              >‹</button>

              {/* Page numbers */}
              {buildPages().map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm border ${
                      page === p
                        ? "bg-[#1e3fae] text-white border-[#1e3fae] shadow-md shadow-[#1e3fae]/25"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-[#1e3fae]/30"
                    }`}
                  >{p}</button>
                )
              )}

              {/* Counter */}
              <span className="px-3 h-9 flex items-center rounded-full border border-slate-200 bg-white text-slate-500 text-[12px] font-semibold shadow-sm">
                {page} / {totalPages} trang
              </span>

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-[#1e3fae]/30 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm text-base font-bold"
              >›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
