import { useState, useEffect } from "react";
import {
  MapPin, Banknote, Briefcase, Clock, ChevronRight, Bookmark,
  Building2, Send, ExternalLink, Loader2, AlertCircle,
  Gift, Shield, GraduationCap, Coffee, Star, Zap, Heart, Users
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jobService } from "../../services/job.service";
import { employerService } from "../../services/employer.service";
// Danh sách icon phúc lợi có thể chọn
const BENEFIT_ICONS = [
  { key: "gift",           label: "🎁 Thưởng",       Icon: Gift },
  { key: "shield",         label: "🛡️ Bảo hiểm",     Icon: Shield },
  { key: "graduation-cap", label: "🎓 Đào tạo",       Icon: GraduationCap },
  { key: "coffee",         label: "☕ Tiện nghi",    Icon: Coffee },
  { key: "star",           label: "⭐ Khen thưởng",  Icon: Star },
  { key: "zap",            label: "⚡ Năng lượng",   Icon: Zap },
  { key: "heart",          label: "❤️ Sức khỏe",      Icon: Heart },
  { key: "users",          label: "👥 Nhóm",         Icon: Users },
];

const BG_COLORS = [
  "bg-orange-200 text-orange-600",
  "bg-blue-200 text-blue-600",
  "bg-emerald-200 text-emerald-700",
  "bg-purple-200 text-purple-600",
  "bg-rose-200 text-rose-600",
  "bg-amber-200 text-amber-700",
  "bg-sky-200 text-sky-600",
  "bg-pink-200 text-pink-600",
];

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface BenefitItem {
  icon?: string;
  title?: string;
  desc?: string;
}

interface Skill {
  id?: number | string;
  name: string;
}

interface Company {
  id?: number | string;
  name?: string;
  logo_url?: string | null;
  city?: string;
  address?: string;
  website?: string;
  size?: string;
  description?: string;
}

interface JobData {
  id: number | string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  location?: string | null;
  job_type?: string | null;
  job_level?: string | null;
  deadline?: string | null;
  status?: string | null;
  skills?: Skill[] | string[];
  company?: Company;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────




const formatSalary = (min?: number | null, max?: number | null) => {
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

function deadlineDays(deadline?: string | null): string {
  if (!deadline) return "Chưa xác định";
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return "Đã hết hạn";
  return `Hết hạn trong ${diff} ngày`;
}

/** Parse plain text / markdown-like bullet lists */
function parseTextToList(text?: string | null): string[] {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // not JSON
  }
  return text
    .split(/\n/)
    .map((s) => s.trim().replace(/^[•-]\s*/, ""))
    .filter(Boolean);
}

/**
 * Company description is stored as one blob separated by sentinel tokens:
 *   <intro text>
 *   ---CULTURE---
 *   <culture text>
 *   ---BENEFITS---
 *   <JSON benefits array>
 */
function parseCompanyDescription(rawDesc?: string | null) {
  if (!rawDesc) return { intro: "", culture: "", benefits: [] as BenefitItem[] };

  const [introPart = "", rest = ""] = rawDesc.split(/---CULTURE---/i);
  const [culturePart = "", benefitsPart = ""] = rest.split(/---BENEFITS---/i);

  let benefits: BenefitItem[] = [];
  try {
    const parsed = JSON.parse(benefitsPart.trim());
    if (Array.isArray(parsed)) benefits = parsed;
  } catch {
    // ignore
  }

  return {
    intro: introPart.trim(),
    culture: culturePart.trim(),
    benefits,
  };
}

/** Map icon slug → Lucide component + colour tokens */
function getBenefitIcon(iconKey?: string) {
  const index = BENEFIT_ICONS.findIndex(function(item) {
    return item.key === iconKey;
  });

  if (index !== -1) {
    return {
      Icon: BENEFIT_ICONS[index].Icon,
      colorClass: BG_COLORS[index],
    };
  }

  return {
    Icon: Star,
    colorClass: "bg-slate-100 text-slate-500",
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);


  // const API_URL = import.meta.env.VITE_API_BASE_URL || '';  
  // // 2. Viết hàm nối link an toàn
  // const getFullImageUrl = (path?: string | null) => {
  //   if (!path) return undefined;
  //   // Đảm bảo không bị trùng dấu "/" nếu API_URL có sẵn dấu "/" ở cuối
  //   const cleanBaseUrl = API_URL.replace(/\/api?\/?$/, '');
  //   return path.startsWith("http") ? path : `${cleanBaseUrl}${path}`;
  // };

  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        // Single API call: GET /api/public/jobs/:id
        const raw = await jobService.getPublicJobDetail(jobId);
        // API trả về { status, data: { job: {...} } } hoặc { status, data: {...} }
        const jobData: JobData = raw?.job ?? raw;
        setJob(jobData);
      } catch (e) {
        console.error(e);
        setError("Không thể tải thông tin công việc.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1e3fae] animate-spin" />
      </div>
    );
  }

  // ── Error ──
  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="font-bold">{error ?? "Không tìm thấy công việc."}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#1e3fae] font-semibold hover:underline"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  // ── Derived data ──
  const company = job.company;

  const skills: string[] = (job.skills ?? []).map((s) =>
    typeof s === "string" ? s : (s as Skill).name
  );

  const descList = parseTextToList(job.description);
  const reqList  = parseTextToList(job.requirements);
  const benList  = parseTextToList(job.benefits);

  const { intro, culture, benefits: companyBenefits } = parseCompanyDescription(company?.description);

  // // Company location string
  // const companyLocation = [company?.address, company?.city]
  //   .filter(Boolean)
  //   .join(", ");

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20">
      <div className="max-w-[1100px] mx-auto px-4 pt-8">

        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-slate-500 mb-6">
          <Link to="/candidate/recommended" className="hover:text-blue-600">
            Xem chi tiết
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-900 font-semibold">{job.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ═══════════════════════ LEFT COLUMN ═══════════════════════ */}
          <div className="space-y-5">

            {/* Job Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h1 className="text-[22px] font-bold text-slate-900 leading-snug mb-4">
                {job.title}
              </h1>

              {/* Fix Job Level and Deadline */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-slate-400" />
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                    {job.location ?? company?.city ?? "Chưa xác định"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  {job.job_type ?? "Toàn thời gian"}
                </span>
                  {/* THÊM JOB LEVEL VÀO ĐÂY */}
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  {job.job_level ?? "Mọi cấp bậc"}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                  {deadlineDays(job.deadline)}
                </span>
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-3">Kỹ năng yêu cầu</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((sk, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-[#1e3fae] border border-blue-100"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Main content */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8">

              {/* Mô tả công việc */}
              {descList.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#1e3fae] rounded-full inline-block" />
                    Mô tả công việc
                  </h2>
                  <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-none">
                    {descList.map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 rounded-full bg-[#1e3fae] flex-shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Yêu cầu */}
              {reqList.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#1e3fae] rounded-full inline-block" />
                    Yêu cầu công việc
                  </h2>
                  <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-none">
                    {reqList.map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 rounded-full bg-[#1e3fae] flex-shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Quyền lợi */}
              {benList.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                    Quyền lợi
                  </h2>
                  <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-none">
                    {benList.map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {descList.length === 0 && reqList.length === 0 && benList.length === 0 && (
                <p className="text-sm text-slate-400 italic">Chưa có thông tin chi tiết cho công việc này.</p>
              )}
            </div>
          </div>

          {/* ═══════════════════════ RIGHT COLUMN ═══════════════════════ */}
          <div className="space-y-5">

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/candidate/apply/${job.id}`, { state: { job } })}
                className="w-full bg-[#1e3fae] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#162f8c] transition-all shadow-lg shadow-blue-200 text-sm"
              >
                <Send className="w-4 h-4" /> Nộp đơn ngay
              </button>
              <button className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm">
                <Bookmark className="w-4 h-4" /> Lưu việc làm
              </button>
            </div>

            {/* Company Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Thông tin công ty</h3>

              {/* Logo + tên */}
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-lg border border-slate-100 flex items-center justify-center bg-white flex-shrink-0 p-1">
                    {company?.logo_url && !imgError ? (
                    <img
                      src={employerService.getLogoUrl(company.logo_url)}
                      alt={company.name || "Logo"}
                      className="w-full h-full object-contain"
                      onError={() => setImgError(true)} 
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-300" />
                  )}
                </div>  
                <div>
                  <p className="font-bold text-slate-900 text-sm">{company?.name ?? "—"}</p>
                  {company?.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#1e3fae] hover:underline flex items-center gap-1"
                    >
                      Xem trang công ty <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Xem trang công ty</span>
                  )}
                </div>
              </div>

                {/* Meta rows */}
                <div className="space-y-2 text-sm">
                  {company?.size && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                        <Users className="w-3.5 h-3.5" /> Quy mô:
                      </span>
                      <span className="font-semibold text-slate-800 text-right">{company.size}</span>
                    </div>
                  )}


                                  {company?.city && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5" /> Khu vực:
                      </span>
                      <span className="font-semibold text-slate-800 text-right">{company.city}</span>
                    </div>
                  )}  

                  {company?.address && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5" /> Địa chỉ:
                      </span>
                      <span className="font-semibold text-slate-800 text-right">{company.address}</span>
                    </div>
                  )}
                </div>  

              {/* Parsed company description sections */}
              {(intro || culture || companyBenefits.length > 0) && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-5">

                  {intro && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded-full inline-block" />
                        Giới thiệu công ty
                      </h4>
                      <ul className="space-y-2 text-[13px] text-slate-600 leading-relaxed list-none pl-1">
                        {parseTextToList(intro).map((line, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 size-1 rounded-full bg-orange-400 flex-shrink-0" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {culture && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
                        Văn hóa doanh nghiệp
                      </h4>
                      <ul className="space-y-2 text-[13px] text-slate-600 leading-relaxed list-none pl-1">
                        {parseTextToList(culture).map((line, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 size-1 rounded-full bg-red-400 flex-shrink-0" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {companyBenefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-yellow-500 rounded-full inline-block" />
                        Phúc lợi
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {companyBenefits.map((b, idx) => {
                          // Lấy Icon và chuỗi class màu (colorClass) từ hàm mới
                          const { Icon, colorClass } = getBenefitIcon(b.icon);
                          
                          return (
                            <div
                              key={idx}
                              className="bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 border border-slate-100"
                            >
                              {/* Truyền colorClass vào thẻ div này */}
                              <div className={`p-2 rounded-full ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide leading-tight">
                                  {b.title}
                                </p>
                                {b.desc && (
                                  <p className="text-[10px] text-slate-500 mt-1">{b.desc}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
