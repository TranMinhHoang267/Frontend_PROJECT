import { Heart, MapPin, Loader2, Building2, Banknote, Calendar, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { candidateService } from "../../services/candidate.service";
import { Link, useNavigate } from "react-router-dom";

// Cover images matching the platform aesthetics
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=2574&auto=format&fit=crop",
];

interface SavedJobItem {
  bookmarkId: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    location?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    deadline?: string;
    status?: string;
    company?: {
      name: string;
      logoUrl?: string;
      city?: string;
    };
  };
}

export default function SavedJobs() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 5;

  const fetchSavedJobs = async (page: number) => {
    setLoading(true);
    try {
      const res = await candidateService.getBookmarks({ page, limit: itemsPerPage });
      setBookmarks(res.bookmarks || []);
      setTotalPages(res.total_pages || 1);
      setTotalItems(res.total_items || 0);
      setCurrentPage(res.current_page || 1);
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs(currentPage);
  }, [currentPage]);

  const handleApply = (job: SavedJobItem["job"]) => {
    navigate(`/candidate/apply/${job.id}`, { state: { job } });
  };

  const handleRemoveBookmark = async (jobId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn bỏ lưu công việc "${title}" không?`)) {
      return;
    }
    try {
      await candidateService.toggleBookmark(jobId);
      // If we are on page 1 and remove the last item, page count might change
      // A simple reload is safest and keeps pagination metadata correct
      if (bookmarks.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchSavedJobs(currentPage);
      }
    } catch (err) {
      console.error("Lỗi khi bỏ lưu tin:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 mb-1">Việc làm đã lưu</h1>
          <p className="text-slate-500 text-[15px]">
            Bạn đang lưu <span className="font-bold text-[#1e3fae]">{totalItems} việc làm</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/candidate/recommended")}
          className="flex-shrink-0 px-5 py-2.5 rounded-xl border border-[#1e3fae] text-[#1e3fae] text-sm font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
        >
          Khám phá thêm việc làm
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin w-10 h-10 text-[#2143ad]" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[20px] py-20 px-6 text-center shadow-sm">
          <div className="size-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-950 mb-1">Chưa có việc làm nào được lưu</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Lưu các việc làm bạn quan tâm khi tìm kiếm để dễ dàng quản lý và ứng tuyển sau này.
          </p>
          <button
            onClick={() => navigate("/candidate/recommended")}
            className="px-6 py-2.5 bg-[#2143ad] hover:bg-[#162f8c] text-white font-bold rounded-xl transition-all shadow-md shadow-blue-100"
          >
            Tìm việc làm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {bookmarks.map((item, index) => {
            const { job, savedAt } = item;
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
            if (job.salaryMin && job.salaryMax) {
              salaryText = `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
            } else if (job.salaryMin) {
              salaryText = `Từ ${fmt(job.salaryMin)}`;
            } else if (job.salaryMax) {
              salaryText = `Đến ${fmt(job.salaryMax)}`;
            }

            const displayTags: string[] = [];
            if (job.jobType) displayTags.push(job.jobType);

            return (
              <div key={item.bookmarkId} className="bg-white border border-slate-200 rounded-[20px] flex flex-col md:flex-row overflow-hidden hover:border-[#1e3fae]/30 hover:shadow-lg transition-all duration-300 group shadow-sm h-full md:h-[220px]">
                <div className="md:w-[260px] relative h-[160px] md:h-full flex-shrink-0 border-r border-slate-100">
                  <img src={coverImage} alt={job.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    Lưu: {new Date(savedAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                
                <div className="flex-1 p-6 md:p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2.5">
                      <h2 className="text-[20px] font-bold text-slate-900 group-hover:text-[#2143ad] transition-colors line-clamp-1">{job.title}</h2>
                      <button 
                        onClick={() => handleRemoveBookmark(job.id, job.title)}
                        className="text-red-500 hover:text-red-600 transition-colors p-1"
                        title="Bỏ lưu việc làm này"
                      >
                        <Heart className="w-6 h-6 fill-red-500 text-red-500 hover:scale-110 transition-transform" />
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
                      {displayTags.length > 0 ? displayTags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-slate-100 text-slate-600">
                          {tag}
                        </span>
                      )) : (
                        <span className="px-2.5 py-1 text-[12px] font-semibold rounded-lg bg-slate-100 text-slate-600">
                          Việc làm tốt
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

      {!loading && bookmarks.length > 0 && totalPages > 1 && (
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
