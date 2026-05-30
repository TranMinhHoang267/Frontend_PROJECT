import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Zap, 
  ChevronRight, 
  Users, 
  Building,
  ArrowUpRight
} from "lucide-react";
import { jobService, type SearchJobResult } from "../../services/job.service";
import heroNexus from "../../assets/hero_nexus.jpg";

interface CompanyInfo {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  size?: string | null;
  website?: string | null;
}

interface SkillInfo {
  id: string | number;
  name: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<SearchJobResult[]>([]);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Form search states
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi API public jobs và companies từ backend
        const [jobsData, companiesData] = await Promise.all([
          jobService.getPublicJobsList({ limit: 4 }),
          jobService.getPublicCompanies({ limit: 4 })
        ]);
        setJobs(jobsData);
        setCompanies(companiesData);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      navigate(`/candidate/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
    } else {
      navigate(`/login?mode=login&redirectTo=/candidate/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
    }
  };

  const getFullUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const origin = baseUrl.replace(/\/api\/?$/, "");
    return `${origin}/${cleanPath}`;
  };

  // Format mức lương
  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Thỏa thuận";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Từ $${min.toLocaleString()}`;
    if (max) return `Lên đến $${max.toLocaleString()}`;
    return "Thỏa thuận";
  };

  return (
    <div className="bg-[#f8fafc] text-slate-900 font-sans min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider">
                <Zap className="size-3.5 fill-blue-600 text-blue-600" />
                Nền tảng tuyển dụng IT hàng đầu Việt Nam
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Xây dựng sự nghiệp <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  IT đỉnh cao
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                Kết nối software engineers với các Tech Hub hàng đầu. Hàng ngàn cơ hội từ Startup Unicorn đến Big Tech đang chờ đón bạn khám phá.
              </p>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="bg-white p-2.5 sm:p-4 rounded-2xl shadow-xl border border-slate-100 max-w-2xl flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Search className="size-5 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Java, Python, React, UI/UX..." 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <MapPin className="size-5 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Hà Nội, TP.HCM, Đà Nẵng..." 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-98 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm shrink-0 whitespace-nowrap">
                  Tìm việc ngay
                </button>
              </form>
              
              {/* Partners/Tech Partners */}
              <div className="pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Đối tác công nghệ hàng đầu</p>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-extrabold text-slate-400 tracking-widest">
                  <span className="hover:text-slate-600 transition">GOOGLE</span>
                  <span className="hover:text-slate-600 transition">STRIPE</span>
                  <span className="hover:text-slate-600 transition">MICROSOFT</span>
                  <span className="hover:text-slate-600 transition">AMAZON</span>
                </div>
              </div>
            </div>
            
            {/* Right Image/Graphic */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[480px] lg:max-w-none">
                {/* Background decorative elements */}
                <div className="absolute -top-6 -left-6 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl -z-10" />
                
                {/* Floating Tech Badges */}
                <div className="absolute -top-4 -left-6 bg-white shadow-xl p-3 rounded-2xl border border-slate-100 flex items-center gap-2 animate-float z-10">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                    React
                  </div>
                  <span className="text-xs font-bold text-slate-700">120+ Jobs</span>
                </div>

                <div className="absolute top-1/3 -right-6 bg-white shadow-xl p-3 rounded-2xl border border-slate-100 flex items-center gap-2 animate-float-reverse z-10">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                    Node
                  </div>
                  <span className="text-xs font-bold text-slate-700">95+ Jobs</span>
                </div>

                <div className="absolute bottom-28 -left-8 bg-white shadow-xl p-3 rounded-2xl border border-slate-100 flex items-center gap-2 animate-float z-10">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                    Python
                  </div>
                  <span className="text-xs font-bold text-slate-700">80+ AI Jobs</span>
                </div>

                {/* Main Hero Image */}
                <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl transition-transform hover:scale-[1.01] duration-500">
                  <img 
                    src={heroNexus} 
                    alt="Nexus Talent Team Meeting" 
                    className="w-full h-[400px] object-cover"
                  />
                  {/* Decorative Glassmorphism Overlay Card */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-600 text-white">
                        <Users className="size-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium">Lương trung bình IT</p>
                        <p className="text-base font-bold text-slate-900">$2,600 - $3,800</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                      +15% Năm nay
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* THỊ TRƯỜNG TUYỂN DỤNG IT */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thị trường Tuyển dụng IT</h2>
            <p className="text-slate-500 mt-3 text-base">Phân tích dữ liệu thời gian thực từ hơn 10.000+ tin đăng công nghệ hàng tháng.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Stat Box 1 */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-500">Ngôn ngữ lập trình hot nhất</span>
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Javascript / TypeScript</span>
                    <span className="text-blue-600">88%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "88%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Python (AI & Data)</span>
                    <span className="text-blue-600">75%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Java / Enterprise</span>
                    <span className="text-blue-600">62%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: "62%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Go / Rust</span>
                    <span className="text-blue-600">45%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Box 2 */}
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-500">Nhu cầu tuyển dụng theo quý</span>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Tăng</span>
              </div>
              <div className="flex items-end justify-between h-40 pt-4">
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="w-8 bg-blue-200 rounded-t-lg transition-all hover:bg-blue-300" style={{ height: "60px" }} />
                  <span className="text-[10px] font-bold text-slate-400">Q1</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="w-8 bg-blue-300 rounded-t-lg transition-all hover:bg-blue-400" style={{ height: "80px" }} />
                  <span className="text-[10px] font-bold text-slate-400">Q2</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="w-8 bg-blue-400 rounded-t-lg transition-all hover:bg-blue-500" style={{ height: "100px" }} />
                  <span className="text-[10px] font-bold text-slate-400">Q3</span>
                </div>
                <div className="flex flex-col items-center gap-2 w-12">
                  <div className="w-8 bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700" style={{ height: "130px" }} />
                  <span className="text-[10px] font-bold text-slate-505">Q4</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-semibold text-center mt-4">Nhu cầu tăng đột biến vào cuối năm ở vị trí Web & Mobile.</p>
            </div>

            {/* Stat Box 3 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg shadow-blue-500/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-80">Mức lương trung bình ngành IT</span>
                  <Award className="size-5" />
                </div>
                <h3 className="text-3xl font-extrabold mt-2">$2,850</h3>
                <p className="text-xs opacity-90 mt-1">Tăng 12.5% so với cùng kỳ năm ngoái</p>
              </div>
              
              <div className="border-t border-white/20 pt-4 mt-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-300 border border-blue-600" />
                    <div className="w-6 h-6 rounded-full bg-slate-400 border border-blue-600" />
                    <div className="w-6 h-6 rounded-full bg-slate-500 border border-blue-600" />
                  </div>
                  <span className="font-semibold">Active: 4,500+ Devs</span>
                </div>
                <span className="underline font-bold hover:text-blue-100 cursor-pointer">Xem báo cáo</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TOP TECH EMPLOYERS */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Top Tech Employers</h2>
            <p className="text-slate-500 mt-3 text-base">Làm việc tại những môi trường công nghệ chuyên nghiệp nhất.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Building className="size-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Chưa có thông tin công ty nào tuyển dụng.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {companies.map((company) => (
                <div key={company.id} className="bg-white border border-slate-100 hover:border-blue-400 hover:-translate-y-1.5 rounded-2xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    {/* Header: Logo + Info */}
                    <div className="flex items-center gap-4 mb-4">
                      {company.logoUrl ? (
                        <img 
                          src={getFullUrl(company.logoUrl)} 
                          alt={company.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-lg shrink-0 uppercase">
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-left overflow-hidden">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">{company.name}</h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                          <MapPin className="size-3" />
                          <span className="truncate">{company.city || "Việt Nam"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 text-left mb-6">
                      {company.description || "Công ty công nghệ hàng đầu với môi trường năng động, phát triển nhanh và phúc lợi hấp dẫn cho lập trình viên."}
                    </p>
                  </div>
                  
                  {/* Button */}
                  <button 
                    onClick={() => {
                      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                      if (token) {
                        navigate(`/candidate/search?keyword=${encodeURIComponent(company.name)}`);
                      } else {
                        navigate(`/login?mode=login&redirectTo=/candidate/search?keyword=${encodeURIComponent(company.name)}`);
                      }
                    }} 
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-100 hover:border-blue-600 transition duration-300"
                  >
                    Xem việc làm
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CƠ HỘI VIỆC LÀM IT TIÊU BIỂU */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cơ hội việc làm IT tiêu biểu</h2>
              <p className="text-slate-500 mt-2 text-base">Các cơ hội xuất sắc nhất từ các tập đoàn công nghệ hàng đầu.</p>
            </div>
            <button 
              onClick={() => {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                navigate(token ? "/candidate/search" : "/login?mode=login&redirectTo=/candidate/search");
              }} 
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 hover:bg-blue-100/70 px-4 py-2 rounded-xl transition"
            >
              Xem tất cả công việc
              <ChevronRight className="size-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 h-28 animate-pulse flex justify-between items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-slate-200 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="w-24 h-10 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100">
              <Briefcase className="size-14 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 text-lg">Chưa có công việc nào</h3>
              <p className="text-slate-400 mt-1 text-sm">Các công việc mới nhất đang được chúng tôi phê duyệt, vui lòng quay lại sau.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white border border-slate-100 hover:border-blue-400 hover:-translate-y-1.5 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 group text-left">
                  
                  {/* Left Side: Logo + Title + Metadata */}
                  <div className="flex items-start gap-4">
                    {job.company?.logoUrl ? (
                      <img 
                        src={getFullUrl(job.company.logoUrl)} 
                        alt={job.company.name} 
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xl shrink-0 uppercase">
                        {job.company?.name ? job.company.name.charAt(0) : "J"}
                      </div>
                    )}
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-base sm:text-lg">
                          {job.title}
                        </h3>
                        {job.jobType && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {job.jobType}
                          </span>
                        )}
                        {job.jobLevel && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {job.jobLevel}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs sm:text-sm font-medium">
                        <span className="text-slate-700 font-bold">{job.company?.name || "Tuyển dụng"}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {job.location || job.company?.city || "Việt Nam"}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <DollarSign className="size-3.5" />
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </span>
                      </div>

                      {/* Skills Tags */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {job.skills.map((skill: SkillInfo) => (
                            <span key={skill.id} className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Apply Button */}
                  <div className="shrink-0 flex items-center md:justify-end">
                    <button 
                      onClick={() => {
                        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                        if (token) {
                          navigate(`/candidate/jobs/${job.id}`);
                        } else {
                          navigate(`/login?mode=login&redirectTo=/candidate/jobs/${job.id}`);
                        }
                      }}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-98"
                    >
                      Ứng tuyển ngay
                    </button>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
          
          {/* Bottom Banner */}
          <div className="mt-16 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl shadow-blue-600/20">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-8 w-64 h-64 bg-indigo-500/20 rounded-full" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-400/10 rounded-full" />

            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left: text + stats */}
              <div className="text-left space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
                  <svg className="w-3.5 h-3.5 fill-yellow-300" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  AI-Powered Matching
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                  Nhận gợi ý việc làm IT <br className="hidden sm:block" />
                  <span className="text-blue-200">chính xác 95%</span> từ AI
                </h3>
                <p className="text-blue-100/80 text-sm leading-relaxed">
                  Hệ thống AI của RecruitHub tự động phân tích CV và kỹ năng của bạn, sau đó gợi ý các cơ hội phù hợp nhất — tiết kiệm hàng giờ tìm kiếm thủ công.
                </p>
                <div className="flex flex-wrap gap-6 pt-2">
                  {[
                    { value: "10,000+", label: "Developer đã đăng ký" },
                    { value: "95%", label: "Tỉ lệ khớp chính xác" },
                    { value: "< 3 ngày", label: "Thời gian được liên hệ" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xl font-extrabold text-white">{stat.value}</p>
                      <p className="text-xs text-blue-200/70 font-medium mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: CTA card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col gap-4 min-w-[240px] shrink-0 w-full md:w-auto">
                <p className="text-sm font-bold text-white text-center">Tạo profile miễn phí</p>
                <ul className="space-y-2 text-xs text-blue-100/80">
                  {["Upload CV trong 30 giây", "AI phân tích kỹ năng tự động", "Nhận job alerts mỗi ngày"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/login?mode=register_candidate")}
                  className="w-full bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  Tạo Profile IT ngay →
                </button>
                <p className="text-center text-[11px] text-blue-200/60 font-medium">Miễn phí · Không cần thẻ tín dụng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TẠI SAO NÊN CHỌN RECRUITHUB */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Tại sao nên chọn <br />
                <span className="text-blue-600">RecruitHub IT?</span>
              </h2>
              <p className="text-slate-500 text-base leading-relaxed">
                Chuyên trang dành riêng cho giới lập trình viên tại Việt Nam, mang đến giải pháp tìm việc và phát triển sự nghiệp thông minh nhất.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                    <Zap className="size-5 fill-blue-600/10" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Khớp nối Tech-stack bằng AI</h4>
                    <p className="text-slate-500 text-sm mt-0.5">Chúng tôi khớp nối chính xác CV của bạn với công nghệ mà các công ty đang tuyển dụng.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Hệ sinh thái Tech Hub</h4>
                    <p className="text-slate-500 text-sm mt-0.5">Kết nối và chia sẻ cùng cộng đồng lập trình viên rộng lớn toàn quốc.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Thông tin minh bạch 100%</h4>
                    <p className="text-slate-500 text-sm mt-0.5">Mức lương, chế độ đãi ngộ, quy trình phỏng vấn được hiển thị rõ ràng, xác thực.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition text-left space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building className="size-5" />
                </div>
                <h4 className="font-bold text-slate-900">Doanh nghiệp uy tín</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Hơn 500+ doanh nghiệp hàng đầu đã được ban quản trị kiểm duyệt và cấp chứng nhận thông tin tuyển dụng sạch.</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition text-left space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <h4 className="font-bold text-slate-900">Cộng đồng Developer</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Nơi giao lưu học hỏi, chia sẻ kinh nghiệm viết code, phỏng vấn và thăng tiến trong sự nghiệp công nghệ.</p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* DÀNH CHO DEVELOPERS & DÀNH CHO TECH EMPLOYERS */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Bắt đầu ngay hôm nay</h2>
            <p className="text-slate-500 mt-2 text-base">Chọn hành trình phù hợp với bạn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card Developers */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-blue-600/20">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full">Dành cho Developers</span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">Nâng tầm sự nghiệp <br />Tech của bạn</h3>
                  <p className="text-blue-100/75 text-sm mt-2 leading-relaxed max-w-sm">Hơn 5,000 vị trí IT đang chờ. Từ Junior Developer đến CTO — tìm đúng bước tiếp theo của bạn.</p>
                </div>
                <ul className="space-y-2">
                  {["Khớp nối AI theo tech-stack của bạn", "Lương & chế độ minh bạch 100%", "Kết nối trực tiếp với Tech Lead"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-blue-100/90">
                      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex -space-x-2">
                    {["bg-slate-300", "bg-slate-400", "bg-blue-300", "bg-indigo-300"].map((bg, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-blue-700`} />
                    ))}
                  </div>
                  <p className="text-xs text-blue-200/80 font-medium"><span className="text-white font-bold">4,500+</span> developers đã tìm được việc</p>
                </div>
              </div>
              <div className="relative z-10 flex flex-wrap items-center gap-3 mt-8">
                <button onClick={() => navigate("/login?mode=register_candidate")} className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                  Đăng ký ứng viên
                </button>
                <button onClick={() => navigate("/login?mode=login")} className="border border-white/30 hover:border-white/60 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:bg-white/10">
                  Tìm việc IT →
                </button>
              </div>
            </div>

            {/* Card Recruiter */}
            <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-slate-900/20">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/[0.03] rounded-full" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full">Dành cho Tech Employers</span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">Tuyển dụng Developer <br />tài năng nhanh hơn</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-sm">Tiếp cận 100,000+ hồ sơ lập trình viên chất lượng cao. ATS thông minh giúp bạn tuyển nhanh gấp 3 lần.</p>
                </div>
                <ul className="space-y-2">
                  {["Đăng tin tuyển dụng không giới hạn", "ATS tích hợp AI lọc CV tự động", "Dashboard báo cáo chi tiết real-time"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-6 pt-1">
                  {[{ v: "500+", l: "Doanh nghiệp tin dùng" }, { v: "3x", l: "Tuyển dụng nhanh hơn" }].map((s) => (
                    <div key={s.l}>
                      <p className="text-xl font-extrabold text-white">{s.v}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 flex flex-wrap items-center gap-3 mt-8">
                <button onClick={() => navigate("/login?mode=register_business")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                  Đăng tin tuyển dụng
                </button>
                <button onClick={() => navigate("/login?mode=login")} className="border border-white/15 hover:border-white/30 text-slate-400 hover:text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:bg-white/5">
                  Giải pháp nhân sự →
                </button>
              </div>
            </div>

          </div>

          {/* Trust bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs text-slate-400 font-semibold py-6 border-t border-slate-100">
            {[
              { icon: "🔒", text: "Bảo mật thông tin tuyệt đối" },
              { icon: "✅", text: "500+ công ty được kiểm duyệt" },
              { icon: "🚀", text: "Đăng ký miễn phí, không ràng buộc" },
              { icon: "💬", text: "Hỗ trợ 24/7 từ đội ngũ chuyên gia" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}