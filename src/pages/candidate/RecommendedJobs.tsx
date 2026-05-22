import { BarChart, Heart, MapPin, Loader2, Building2, Banknote } from "lucide-react";
import { useState, useEffect } from "react";
import { jobService } from "../../services/job.service";
import { candidateService } from "../../services/candidate.service";
import { Link, useNavigate } from "react-router-dom";

// Demo images to match the exact design vibe
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=2574&auto=format&fit=crop",
];

interface JobItem {
  id: string | number;
  company_id?: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  skills?: string;
  company?: { name: string; logo_url?: string; city?: string };
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  job_level?: string;
  deadline?: string;
  match?: number;
  favorite?: boolean;
}

export default function RecommendedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [candidateKeywords, setCandidateKeywords] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const jobsPerPage = 5;

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const profile = await candidateService.getProfile();
      const candidateProfileString = `${profile.headline || ''} ${profile.bio || ''} ${((profile as Record<string, unknown>).skills as string[] || []).join(' ')}`.toLowerCase();
      
      let primaryKeywords = "";
      if (candidateProfileString.includes("backend")) primaryKeywords += "Backend ";
      if (candidateProfileString.includes("frontend")) primaryKeywords += "Frontend ";
      if (candidateProfileString.includes("react")) primaryKeywords += "React ";
      if (candidateProfileString.includes("node")) primaryKeywords += "NodeJS ";
      if (candidateProfileString.includes("vue")) primaryKeywords += "Vue ";
      
      setCandidateKeywords(primaryKeywords.trim() || profile.headline || 'phát triển phần mềm');

      // Fetch suggestions and bookmarks parallelly
      const [suggestions, bookmarkData] = await Promise.all([
        jobService.getSuggestions(20),
        candidateService.getBookmarks({ limit: 100 })
      ]);
      
      const bookmarkedJobIds = new Set(
        (bookmarkData.bookmarks || []).map((b: { job?: { id?: string | number } }) => String(b.job?.id || ''))
      );
      
      const processedSuggestions = suggestions.map((job: JobItem & { matchPercent?: number }) => {
         let score = job.matchPercent;
         if (score === undefined || score === null) {
            score = 70; // fallback mặc định
         }
         return { 
            ...job, 
            match: score,
            favorite: bookmarkedJobIds.has(String(job.id))
         };
      });

      setJobs(processedSuggestions);
    } catch (err) {
      console.error("Error fetching recommended jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = (job: JobItem) => {
    navigate(`/candidate/apply/${job.id}`, { state: { job } });
  };

  const handleToggleFavorite = async (jobId: string | number) => {
    try {
      await candidateService.toggleBookmark(jobId);
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, favorite: !job.favorite } : job
        )
      );
      // Show dynamic notification if you want, but simple toggle is cleaner
    } catch (err) {
      console.error("Lỗi khi lưu/bỏ lưu việc làm:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = jobs.slice(startIndex, startIndex + jobsPerPage);

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 mb-1">Việc làm gợi ý</h1>
          <p className="text-slate-500 text-[15px]">
            Dựa trên hồ sơ của bạn <span className="font-bold text-[#1e3fae]">{candidateKeywords || 'Phát triển phần mềm'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium whitespace-nowrap shadow-sm">
          <div className="size-5 rounded-full bg-blue-50 text-[#1e3fae] flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px]">info</span>
          </div>
          Cập nhật lúc: 10:30 Hôm nay
        </div>
      </div>

      <div className="bg-[#f4f6fe] border border-blue-100 rounded-[16px] p-5 flex gap-4">
        <div className="bg-white size-12 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-[#1e3fae]">
          <BarChart className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-wider">CÁCH TÍNH ĐỘ PHÙ HỢP</h3>
          <p className="text-slate-600 text-[15px]">Chúng tôi phân tích mô tả công việc, yêu cầu kỹ năng và vị trí địa lý để đưa ra điểm số Match Score chính xác nhất cho bạn.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-[#2143ad]" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">Chưa có công việc nào phù hợp với bạn lúc này.</div>
      ) : (
        <div className="space-y-5">
          {paginatedJobs.map((job: JobItem, index: number) => {
            const matchScore = job.match || 0;
            const coverImage = COVER_IMAGES[index % COVER_IMAGES.length];
            
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

            let salaryText = 'Thỏa thuận';
            if (job.salary_min && job.salary_max) {
              salaryText = `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
            } else if (job.salary_min) {
              salaryText = `Từ ${fmt(job.salary_min)}`;
            } else if (job.salary_max) {
              salaryText = `Đến ${fmt(job.salary_max)}`;
            }

            const displayTags: string[] = [];
            
            if (job.job_type) displayTags.push(job.job_type);
            if (job.job_level) displayTags.push(job.job_level);
            
            let skillsArray: string[] = [];
            if (typeof job.skills === 'string' && job.skills.trim()) {
               skillsArray = job.skills.split(',').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(job.skills)) {
               skillsArray = job.skills.map(s => typeof s === 'object' && s !== null ? (s.name || JSON.stringify(s)) : String(s));
            }
            if (skillsArray.length > 0) displayTags.push(...skillsArray);
            
            if (displayTags.length === 0) {
               if (job.title.toLowerCase().includes('backend')) displayTags.push('Backend');
               if (job.title.toLowerCase().includes('frontend')) displayTags.push('Frontend');
               if (job.title.toLowerCase().includes('react')) displayTags.push('React');
            }

            return (
              <div key={job.id} className="bg-white border border-slate-200 rounded-[20px] flex flex-col md:flex-row overflow-hidden hover:border-[#1e3fae]/30 hover:shadow-lg transition-all duration-300 group shadow-sm h-full md:h-[220px]">
                <div className="md:w-[260px] relative h-[160px] md:h-full flex-shrink-0 border-r border-slate-100">
                  <img src={coverImage} alt={job.title} className="w-full h-full object-cover" />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-white text-[11px] font-bold shadow-sm ${
                    matchScore >= 90 ? 'bg-[#00c569]' : matchScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>
                    {matchScore}% Độ phù hợp
                  </div>
                </div>
                
                <div className="flex-1 p-6 md:p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2.5">
                      <h2 className="text-[20px] font-bold text-slate-900 group-hover:text-[#2143ad] transition-colors line-clamp-1">{job.title}</h2>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFavorite(job.id);
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Heart className={`w-6 h-6 hover:scale-110 transition-transform ${job.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium mb-4">
                      <span className="flex items-center gap-2 text-slate-500 max-w-[200px] truncate" title={job.company?.name || 'Công ty bảo mật'}>
                        <Building2 className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                        {job.company?.name || 'Công ty bảo mật'}
                      </span>
                      <span className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-4.5 h-4.5 text-slate-400" />
                        {job.location || job.company?.city || 'Thỏa thuận'}
                      </span>
                      <span className="flex items-center gap-2 text-[#2143ad] font-bold">
                        <Banknote className="w-4.5 h-4.5 text-[#2143ad]" />
                        {salaryText}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {displayTags.length > 0 ? displayTags.slice(0, 3).map((tag: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-slate-100 text-slate-600">
                          {tag}
                        </span>
                      )) : (
                        <span className="px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-slate-100 text-slate-600">
                          Xem chi tiết phần Yêu cầu
                        </span>
                      )}
                      
                      {displayTags.length > 3 && (
                        <span className="px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-blue-50 text-[#2143ad]">
                          +{displayTags.length - 3} Kỹ năng khác
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <button 
                      onClick={() => handleApply(job)}
                      className="flex-1 px-6 py-2.5 bg-[#2143ad] hover:bg-[#162f8c] text-white text-[14px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      Ứng tuyển ngay
                    </button>
                    <Link to={`/candidate/jobs/${job.id}`} className="flex-1 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 text-[14px] font-bold rounded-xl transition-all flex items-center justify-center shadow-sm">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && jobs.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="size-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
          >
            &lt;
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`size-10 rounded-xl flex items-center justify-center font-bold text-[15px] shadow-sm transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#2143ad] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="size-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
