import { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2, Building2, SlidersHorizontal, X, Heart, ChevronDown } from "lucide-react";
import { jobService } from "../../services/job.service";
import type { SearchJobResult } from "../../services/job.service";
import { candidateService } from "../../services/candidate.service";
import { useNavigate, useSearchParams } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────
const JOB_TYPES  = ["Full-time", "Part-time", "Remote", "Freelance", "Intern"];
const JOB_LEVELS = ["Intern", "Fresher", "Junior", "Middle", "Senior", "Manager", "Director"];
const SALARY_OPTIONS = [
  { label: "Tất cả mức lương", value: "" },
  { label: "Dưới 5 triệu",     value: "5000000" },
  { label: "5 - 10 triệu",     value: "10000000" },
  { label: "10 - 20 triệu",    value: "20000000" },
  { label: "20 - 30 triệu",    value: "30000000" },
  { label: "Trên 30 triệu",    value: "99000000" },
];

const JOB_COLORS = ["#1e3fae", "#0891b2", "#059669", "#7c3aed", "#d97706", "#dc2626"];
const jobColor = (id: string | number) => JOB_COLORS[String(id).length % JOB_COLORS.length];

const fmtSalary = (min?: number, max?: number): string => {
  const f = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}N`;
    return String(n);
  };
  if (min && max) return `${f(min)} - ${f(max)} triệu`;
  if (min)        return `Từ ${f(min)} triệu`;
  if (max)        return `Tới ${f(max)} triệu`;
  return "Thỏa thuận";
};

// Pure helper — avoids calling Date.now() inside component render (ESLint react-hooks/purity)
const checkExpiringSoon = (deadline?: string): boolean => {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
};

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({
  job,
  bookmarked,
  onApply,
  onBookmark,
}: {
  job: SearchJobResult;
  bookmarked: boolean;
  onApply: (job: SearchJobResult) => void;
  onBookmark: (id: string | number) => void;
}) {
  const logoUrl     = job.company?.logoUrl ?? "";
  const companyName = job.company?.name || "Công ty bảo mật";
  const location    = job.location || job.company?.city || "";
  const salary      = fmtSalary(job.salaryMin, job.salaryMax);
  const skills      = job.skills ?? [];

  const isExpiringSoon = checkExpiringSoon(job.deadline);

  return (
    <div
      onClick={() => onApply(job)}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:border-[#1e3fae]/30 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
    >
      {/* Logo + Title + Company */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden"
          style={!logoUrl ? { background: jobColor(job.id) } : {}}
        >
          {logoUrl
            ? <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1 bg-white" />
            : <span className="text-white text-lg font-black">{job.title.charAt(0).toUpperCase()}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {job.jobType && (
              <span className="text-[10px] font-bold text-[#1e3fae] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {job.jobType}
              </span>
            )}
            {isExpiringSoon && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                Sắp hết hạn
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 text-[13.5px] leading-snug line-clamp-2 group-hover:text-[#1e3fae] transition-colors">
            {job.title}
          </h3>
          <p className="text-[11.5px] text-slate-400 font-medium mt-0.5 truncate" title={companyName}>
            {companyName}
          </p>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 3).map(sk => (
            <span key={sk.id} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200">
              {sk.name}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-[#1e3fae] border border-blue-100">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Salary + Location + Heart */}
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
        <button
          onClick={e => { e.stopPropagation(); onBookmark(job.id); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            bookmarked ? "text-red-500 bg-red-50" : "text-slate-300 hover:text-red-400 hover:bg-red-50"
          }`}
        >
          <Heart className={`w-4 h-4 ${bookmarked ? "fill-red-500" : ""}`} />
        </button>
      </div>

      {/* Hover apply button */}
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
export default function SearchJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Form state (from URL or empty)
  const [keyword,  setKeyword]  = useState(searchParams.get("keyword")  || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [jobType,  setJobType]  = useState(searchParams.get("jobType")  || "");
  const [jobLevel, setJobLevel] = useState(searchParams.get("jobLevel") || "");
  const [salary,   setSalary]   = useState(searchParams.get("salary")   || "");
  const [showFilters, setShowFilters] = useState(false);

  // Result state
  const [jobs, setJobs]         = useState<SearchJobResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Load bookmarks
  useEffect(() => {
    candidateService.getBookmarks({ limit: 200 }).then(res => {
      const ids = new Set<string>(
        (res.bookmarks || []).map((b: { job?: { id?: string | number } }) => String(b.job?.id || ""))
      );
      setBookmarkedIds(ids);
    }).catch(() => {});
  }, []);

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true);
    setSearched(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: 9 };
      if (keyword.trim()) params.keyword  = keyword.trim();
      if (location.trim()) params.location = location.trim();
      if (jobType)  params.jobType  = jobType;
      if (jobLevel) params.jobLevel = jobLevel;
      if (salary)   params.salary   = parseInt(salary);

      // Sync URL
      const urlP: Record<string, string> = {};
      if (keyword.trim()) urlP.keyword  = keyword.trim();
      if (location.trim()) urlP.location = location.trim();
      if (jobType)  urlP.jobType  = jobType;
      if (jobLevel) urlP.jobLevel = jobLevel;
      if (salary)   urlP.salary   = salary;
      if (p > 1)    urlP.page     = String(p);
      setSearchParams(urlP, { replace: true });

      const res = await jobService.searchJobs(params as Parameters<typeof jobService.searchJobs>[0]);
      setJobs(res.jobs);
      setTotalPages(res.total_pages);
      setTotalItems(res.total_items);
      setPage(res.current_page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [keyword, location, jobType, jobLevel, salary, setSearchParams]);

  // Auto-search if URL has params on first load
  useEffect(() => {
    if (searchParams.get("keyword") || searchParams.get("location")) {
      doSearch(parseInt(searchParams.get("page") || "1"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch(1);
  };

  // Gọi search ngay với giá trị filter mới (không chờ React re-render setState)
  const applyFilter = (overrides: {
    jobType?: string; jobLevel?: string; salary?: string;
  }) => {
    const jt  = overrides.jobType  !== undefined ? overrides.jobType  : jobType;
    const jl  = overrides.jobLevel !== undefined ? overrides.jobLevel : jobLevel;
    const sal = overrides.salary   !== undefined ? overrides.salary   : salary;

    // Update state
    if (overrides.jobType  !== undefined) setJobType(overrides.jobType);
    if (overrides.jobLevel !== undefined) setJobLevel(overrides.jobLevel);
    if (overrides.salary   !== undefined) setSalary(overrides.salary);

    // Build params và search ngay
    setLoading(true);
    setSearched(true);
    const params: Record<string, string | number> = { page: 1, limit: 9 };
    if (keyword.trim()) params.keyword  = keyword.trim();
    if (location.trim()) params.location = location.trim();
    if (jt)  params.jobType  = jt;
    if (jl)  params.jobLevel = jl;
    if (sal) params.salary   = parseInt(sal);

    jobService.searchJobs(params as Parameters<typeof jobService.searchJobs>[0])
      .then(res => {
        setJobs(res.jobs);
        setTotalPages(res.total_pages);
        setTotalItems(res.total_items);
        setPage(res.current_page);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const clearFilters = () => {
    applyFilter({ jobType: "", jobLevel: "", salary: "" });
  };
  const hasFilters = jobType || jobLevel || salary;


  const handleApply = (job: SearchJobResult) =>
    navigate(`/candidate/apply/${job.id}`, { state: { job, from: '/candidate/search' } });
  const handleBookmark = async (id: string | number) => {
    try {
      await candidateService.toggleBookmark(id);
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (next.has(String(id))) next.delete(String(id));
        else next.add(String(id));
        return next;
      });
    } catch (e) { console.error(e); }
  };

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
      <div>
        <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Tìm kiếm việc làm</h1>
        <p className="text-slate-500 text-sm mt-0.5">Tìm việc theo tên, công ty, kỹ năng, địa điểm và mức lương</p>
      </div>

      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Main search row */}
        <div className="flex gap-3">
          {/* Keyword */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Tên vị trí, kỹ năng, công ty..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm transition-all shadow-sm"
            />
          </div>

          {/* Location */}
          <div className="w-52 relative hidden sm:block">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Địa điểm..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm transition-all shadow-sm"
            />
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`h-11 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all shadow-sm whitespace-nowrap ${
              showFilters || hasFilters
                ? "border-[#1e3fae] bg-[#1e3fae]/5 text-[#1e3fae]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
            {hasFilters && (
              <span className="w-4 h-4 bg-[#1e3fae] text-white rounded-full text-[10px] font-black flex items-center justify-center">
                {[jobType, jobLevel, salary].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Search button */}
          <button
            type="submit"
            className="h-11 px-6 bg-[#1e3fae] hover:bg-[#162f8c] text-white font-bold rounded-xl transition-colors shadow-sm shadow-[#1e3fae]/20 text-sm whitespace-nowrap flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
        </div>

        {/* Location mobile */}
        <div className="sm:hidden relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Địa điểm..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none text-sm transition-all shadow-sm"
          />
        </div>

        {/* ── Expanded Filters ── */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Job Type */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Hình thức làm việc</label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => applyFilter({ jobType: jobType === t ? "" : t })}
                      className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        jobType === t
                          ? "bg-[#1e3fae] text-white border-[#1e3fae]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#1e3fae]/40 hover:text-[#1e3fae]"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Job Level */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Cấp bậc</label>
                <div className="flex flex-wrap gap-2">
                  {JOB_LEVELS.map(l => (
                    <button
                      key={l} type="button"
                      onClick={() => applyFilter({ jobLevel: jobLevel === l ? "" : l })}
                      className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        jobLevel === l
                          ? "bg-[#1e3fae] text-white border-[#1e3fae]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#1e3fae]/40 hover:text-[#1e3fae]"
                      }`}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Mức lương</label>
                <div className="flex flex-wrap gap-2">
                  {SALARY_OPTIONS.slice(1).map(opt => (
                    <button
                      key={opt.value} type="button"
                      onClick={() => applyFilter({ salary: salary === opt.value ? "" : opt.value })}
                      className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        salary === opt.value
                          ? "bg-[#1e3fae] text-white border-[#1e3fae]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#1e3fae]/40 hover:text-[#1e3fae]"
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="flex justify-end">
                <button
                  type="button" onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      {/* ── Results ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin w-10 h-10 text-[#1e3fae]" />
        </div>
      ) : !searched ? (
        /* Empty state — before any search */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[#1e3fae]" />
          </div>
          <p className="font-bold text-slate-700 mb-1 text-lg">Tìm kiếm việc làm phù hợp</p>
          <p className="text-slate-400 text-sm max-w-sm">Nhập từ khóa, địa điểm hoặc sử dụng bộ lọc để tìm công việc mơ ước.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-bold text-slate-700 mb-1">Không tìm thấy kết quả</p>
          <p className="text-slate-400 text-sm">Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc.</p>
        </div>
      ) : (
        <>
          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Tìm thấy <span className="font-bold text-slate-900">{totalItems.toLocaleString("vi-VN")}</span> việc làm
              {keyword && <> cho <span className="font-bold text-[#1e3fae]">"{keyword}"</span></>}
            </p>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                bookmarked={bookmarkedIds.has(String(job.id))}
                onApply={handleApply}
                onBookmark={handleBookmark}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); doSearch(Math.max(1, page - 1)); }}
                disabled={page === 1}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm font-bold text-base"
              >‹</button>

              {buildPages().map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                ) : (
                  <button key={p}
                    onClick={() => { setPage(p as number); doSearch(p as number); }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm border ${
                      page === p
                        ? "bg-[#1e3fae] text-white border-[#1e3fae] shadow-md shadow-[#1e3fae]/25"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >{p}</button>
                )
              )}

              <span className="px-3 h-9 flex items-center rounded-full border border-slate-200 bg-white text-slate-500 text-[12px] font-semibold shadow-sm">
                {page} / {totalPages} trang
              </span>

              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); doSearch(Math.min(totalPages, page + 1)); }}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm font-bold text-base"
              >›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
