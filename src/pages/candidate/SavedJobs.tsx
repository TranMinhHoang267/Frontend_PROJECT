import { Heart, MapPin, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { candidateService } from "../../services/candidate.service";
import { useNavigate } from "react-router-dom";
import { employerService } from "../../services/employer.service";

interface SavedJobItem {
  bookmarkId: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    location?: string;
    jobType?: string;
    jobLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    deadline?: string;
    status?: string;
    company?: { name: string; logoUrl?: string; city?: string };
  };
}

const JOB_COLORS = ["#1e3fae", "#0891b2", "#059669", "#7c3aed", "#d97706", "#dc2626"];
const jobColor = (id: string) => JOB_COLORS[id.length % JOB_COLORS.length];

const formatSalary = (min?: number, max?: number): string => {
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

// ─── Job Card (same style as RecommendedJobs) ─────────────────────────────────
function SavedJobCard({
  item,
  onApply,
  onRemove,
}: {
  item: SavedJobItem;
  onApply: (job: SavedJobItem["job"]) => void;
  onRemove: (jobId: string, title: string) => void;
}) {
  const { job, savedAt } = item;
  const logoUrl     = employerService.getLogoUrl(job.company?.logoUrl);
  const companyName = job.company?.name || "Công ty bảo mật";
  const location    = job.location || job.company?.city || "";
  const salary      = formatSalary(job.salaryMin, job.salaryMax);
  const savedDate   = new Date(savedAt).toLocaleDateString("vi-VN");

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:border-[#1e3fae]/30 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer min-h-[210px]"
      onClick={() => onApply(job)}
    >
      {/* ── Logo + Title + Company ── */}
      <div className="flex items-start gap-3.5">
        {/* Logo — larger 56px */}
        <div
          className="w-14 h-14 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
          style={!logoUrl ? { background: jobColor(job.id) } : {}}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1.5 bg-white" />
          ) : (
            <span className="text-white text-xl font-black">{job.title.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Đã lưu {savedDate}
            </span>
            {job.jobType && (
              <span className="text-[10px] font-bold text-[#1e3fae] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {job.jobType}
              </span>
            )}
            {job.jobLevel && (
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                {job.jobLevel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-[14.5px] leading-snug line-clamp-2 group-hover:text-[#1e3fae] transition-colors mb-0.5">
            {job.title}
          </h3>
          {/* Company */}
          <p className="text-[12px] text-slate-400 font-medium truncate" title={companyName}>
            {companyName}
          </p>
        </div>
      </div>

      {/* ── Salary + Location ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
          {salary}
        </span>
        {location && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {location.length > 18 ? location.slice(0, 18) + "..." : location}
          </span>
        )}
      </div>

      {/* ── Remove + spacer ── */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-50">
        <span className="text-[11px] text-slate-400 font-medium">Nhấn để ứng tuyển</span>
        <button
          onClick={e => { e.stopPropagation(); onRemove(job.id, job.title); }}
          title="Bỏ lưu"
          className="flex items-center gap-1.5 text-[11.5px] font-semibold text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        >
          <Heart className="w-3.5 h-3.5 fill-red-400" />
          Bỏ lưu
        </button>
      </div>

      {/* ── Apply button — hover only ── */}
      <div className="overflow-hidden transition-all duration-200 ease-out max-h-0 group-hover:max-h-12 opacity-0 group-hover:opacity-100">
        <button
          onClick={e => { e.stopPropagation(); onApply(job); }}
          className="w-full h-9 bg-[#1e3fae] hover:bg-[#162f8c] text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm shadow-[#1e3fae]/20 flex items-center justify-center"
        >
          Ứng tuyển ngay →
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SavedJobs() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks]   = useState<SavedJobItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PER_PAGE = 9;

  const fetchSavedJobs = async (page: number) => {
    setLoading(true);
    try {
      const res = await candidateService.getBookmarks({ page, limit: PER_PAGE });
      setBookmarks(res.bookmarks || []);
      setTotalPages(res.total_pages || 1);
      setTotalItems(res.total_items || 0);
      setCurrentPage(res.current_page || page);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSavedJobs(currentPage); }, [currentPage]);

  const handleApply  = (job: SavedJobItem["job"]) => navigate(`/candidate/apply/${job.id}`, { state: { job, from: '/candidate/saved' } });

  const handleRemove = async (jobId: string, title: string) => {
    if (!window.confirm(`Bỏ lưu công việc "${title}"?`)) return;
    try {
      await candidateService.toggleBookmark(jobId);
      if (bookmarks.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
      else fetchSavedJobs(currentPage);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const buildPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const res: (number | "...")[] = [1];
    if (currentPage > 3) res.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) res.push(i);
    if (currentPage < totalPages - 2) res.push("...");
    res.push(totalPages);
    return res;
  };

  return (
    <div className="max-w-[1100px] mx-auto py-6 px-4 md:px-8 space-y-5 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Việc làm đã lưu</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bạn đang lưu{" "}
            <span className="font-bold text-[#1e3fae]">{totalItems} việc làm</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/candidate/recommended")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#1e3fae]/30 text-[#1e3fae] rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          Khám phá thêm
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin w-10 h-10 text-[#1e3fae]" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-red-300" />
          </div>
          <p className="font-bold text-slate-700 mb-1">Chưa có việc làm nào được lưu</p>
          <p className="text-slate-400 text-sm mb-5">Lưu các việc làm bạn quan tâm để ứng tuyển sau.</p>
          <button
            onClick={() => navigate("/candidate/recommended")}
            className="px-6 py-2.5 bg-[#1e3fae] hover:bg-[#162f8c] text-white font-bold rounded-xl transition-all shadow-md shadow-[#1e3fae]/20 text-sm"
          >
            Tìm việc làm ngay
          </button>
        </div>
      ) : (
        <>
          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map(item => (
              <SavedJobCard
                key={item.bookmarkId}
                item={item}
                onApply={handleApply}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm font-bold text-base"
              >‹</button>

              {buildPages().map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p as number)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm border ${
                      currentPage === p
                        ? "bg-[#1e3fae] text-white border-[#1e3fae] shadow-md shadow-[#1e3fae]/25"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >{p}</button>
                )
              )}

              <span className="px-3 h-9 flex items-center rounded-full border border-slate-200 bg-white text-slate-500 text-[12px] font-semibold shadow-sm">
                {currentPage} / {totalPages} trang
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm font-bold text-base"
              >›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
