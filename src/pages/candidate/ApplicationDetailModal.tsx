import { useState, useEffect } from "react";
import {
  X, MapPin, Banknote, Briefcase, Clock, Building2, Globe,
  Users, Gift, Shield, GraduationCap, Coffee, Star, Zap, Heart,
  Send, CheckCircle2, XCircle, AlertCircle, FileText, Award,
  ExternalLink, Loader2, Info, Calendar,
} from "lucide-react";
import { applicationService } from "../../services/application.service";
import { employerService } from "../../services/employer.service";

// ─── Benefit icons ────────────────────────────────────────────────────────────
const BENEFIT_ICONS = [
  { key: "gift",           Icon: Gift },
  { key: "shield",         Icon: Shield },
  { key: "graduation-cap", Icon: GraduationCap },
  { key: "coffee",         Icon: Coffee },
  { key: "star",           Icon: Star },
  { key: "zap",            Icon: Zap },
  { key: "heart",          Icon: Heart },
  { key: "users",          Icon: Users },
];
const BG_COLORS = [
  "bg-orange-100 text-orange-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-600",
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-600",
  "bg-pink-100 text-pink-600",
];
function getBenefitIcon(iconKey?: string) {
  const index = BENEFIT_ICONS.findIndex((b) => b.key === iconKey);
  if (index !== -1) return { Icon: BENEFIT_ICONS[index].Icon, colorClass: BG_COLORS[index] };
  return { Icon: Star, colorClass: "bg-slate-100 text-slate-500" };
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  submitted:    { label: "Đã nộp",         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: <Send className="w-3.5 h-3.5" /> },
  under_review: { label: "Đang xem xét",   color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Clock className="w-3.5 h-3.5" /> },
  interview:    { label: "Đang phỏng vấn", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  icon: <Users className="w-3.5 h-3.5" /> },
  accepted:     { label: "Được nhận",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:     { label: "Đã từ chối",     color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: <XCircle className="w-3.5 h-3.5" /> },
};
const UNKNOWN_STATUS = {
  label: "Không xác định", color: "text-slate-500", bg: "bg-slate-50",
  border: "border-slate-200", icon: <AlertCircle className="w-3.5 h-3.5" />,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface BenefitItem { icon?: string; title?: string; desc?: string; }

interface ApplicationDetail {
  id: string;
  job_id: string;
  user_id: string;
  cv_url?: string | null;
  cover_letter?: string | null;
  status: "submitted" | "under_review" | "interview" | "accepted" | "rejected";
  note_by_recruiter?: string | null;
  applied_at: string;
  updated_at: string;
  job: {
    id: string;
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
    views_count?: number;
    company: {
      id: string;
      name: string;
      description?: string | null;
      website?: string | null;
      logo_url?: string | null;
      address?: string | null;
      city?: string | null;
      size?: string | null;
    };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tr`;
    return `${n.toLocaleString("vi-VN")} đ`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

function deadlineDays(deadline?: string | null): string {
  if (!deadline) return "Chưa xác định";
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Đã hết hạn";
  return `Hết hạn trong ${diff} ngày`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Không rõ";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function parseTextToList(text?: string | null): string[] {
  if (!text) return [];
  return text.split(/\n|[•-]/).map((s) => s.trim()).filter(Boolean);
}

function parseCompanyDescription(rawDesc?: string | null) {
  if (!rawDesc) return { intro: "", culture: "", benefits: [] as BenefitItem[] };
  const [introPart = "", rest = ""] = rawDesc.split(/---CULTURE---/i);
  const [culturePart = "", benefitsPart = ""] = rest.split(/---BENEFITS---/i);
  let benefits: BenefitItem[] = [];
  try {
    const parsed = JSON.parse(benefitsPart.trim());
    if (Array.isArray(parsed)) benefits = parsed;
  } catch { /* ignore */ }
  return { intro: introPart.trim(), culture: culturePart.trim(), benefits };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionTitle({ children, accent = "blue" }: { children: React.ReactNode; accent?: "blue" | "green" }) {
  return (
    <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
      <span className={`w-1 h-5 rounded-full inline-block ${accent === "blue" ? "bg-[#1e3fae]" : "bg-emerald-500"}`} />
      {children}
    </h2>
  );
}

function BulletList({ items, accent = "blue" }: { items: string[]; accent?: "blue" | "green" }) {
  return (
    <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
      {items.map((line, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={`mt-1.5 size-1.5 rounded-full flex-shrink-0 ${accent === "blue" ? "bg-[#1e3fae]" : "bg-emerald-500"}`} />
          {line}
        </li>
      ))}
    </ul>
  );
}

function CompanyLogo({ logo, name }: { logo?: string | null; name?: string }) {
  const [err, setErr] = useState(false);
  const url = logo ? employerService.getLogoUrl(logo) : null;
  if (url && !err) {
    return <img src={url} alt={name} className="w-full h-full object-contain" onError={() => setErr(true)} />;
  }
  return <span className="text-[#1e3fae] font-black text-xl">{name?.charAt(0)?.toUpperCase() || "?"}</span>;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface Props {
  applicationId: string;
  onClose: () => void;
}

export default function ApplicationDetailModal({ applicationId, onClose }: Props) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await applicationService.getApplicationDetail(applicationId);
        if (!cancelled) setDetail(data as ApplicationDetail);
      } catch (err) {
        console.error("Failed to load application detail:", err);
        if (!cancelled) setError("Không thể tải chi tiết đơn ứng tuyển.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetail();
    
    return () => { cancelled = true; };
  }, [applicationId]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const job = detail?.job;
  const company = job?.company;
  const status = detail ? (STATUS_CONFIG[detail.status] ?? UNKNOWN_STATUS) : null;

  const descList = parseTextToList(job?.description);
  const reqList  = parseTextToList(job?.requirements);
  const benList  = parseTextToList(job?.benefits);
  const { intro, culture, benefits: companyBenefits } = parseCompanyDescription(company?.description);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel — wide to match JobDetail 2-col layout */}
      <div className="relative w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[92vh] bg-[#f8fafc] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Chi tiết đơn ứng tuyển</p>
            {job && (
              <p className="text-sm font-bold text-slate-800 mt-0.5 truncate max-w-sm">{job.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 size-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-9 h-9 text-[#1e3fae] animate-spin" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
              <XCircle className="w-12 h-12 text-red-300" />
              <p className="font-semibold text-slate-700">{error}</p>
            </div>
          )}

          {/* ── Main content ── */}
          {!loading && detail && job && (
            <div className="p-4 sm:p-6 space-y-5">

              {/* Application status banner */}
              <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 rounded-2xl border ${status?.bg} ${status?.border}`}>
                <span className={`inline-flex items-center gap-2 text-sm font-bold ${status?.color}`}>
                  {status?.icon}
                  {status?.label}
                </span>
                <span className="text-slate-300 text-xs hidden sm:inline">·</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Nộp ngày {formatDate(detail.applied_at)}
                </span>
                <span className="text-xs text-slate-400">
                  · Cập nhật {formatDate(detail.updated_at)}
                </span>
                {detail.status === "rejected" && detail.note_by_recruiter && (
                  <p className="w-full text-xs text-red-700 mt-1">
                    <span className="font-semibold">Lý do từ chối: </span>
                    {detail.note_by_recruiter}
                  </p>
                )}
              </div>

              {/* 2-column grid — mirrors JobDetail */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

                {/* ══ LEFT ══ */}
                <div className="space-y-5">

                  {/* Job summary card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h1 className="text-lg font-bold text-slate-900 leading-snug mb-4">{job.title}</h1>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {job.location ?? company?.city ?? "Chưa xác định"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {job.job_type ?? "Toàn thời gian"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {job.job_level ?? "Mọi cấp bậc"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {deadlineDays(job.deadline)}
                      </span>
                    </div>
                  </div>

                  {/* Description / Requirements / Benefits */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-7">
                    {descList.length > 0 && (
                      <section>
                        <SectionTitle>Mô tả công việc</SectionTitle>
                        <BulletList items={descList} />
                      </section>
                    )}
                    {reqList.length > 0 && (
                      <section>
                        <SectionTitle>Yêu cầu công việc</SectionTitle>
                        <BulletList items={reqList} />
                      </section>
                    )}
                    {benList.length > 0 && (
                      <section>
                        <SectionTitle accent="green">Quyền lợi</SectionTitle>
                        <BulletList items={benList} accent="green" />
                      </section>
                    )}
                    {descList.length === 0 && reqList.length === 0 && benList.length === 0 && (
                      <p className="text-sm text-slate-400 italic">Chưa có thông tin chi tiết.</p>
                    )}
                  </div>

                  {/* Đơn ứng tuyển của bạn */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                      <FileText className="w-4 h-4 text-[#1e3fae]" />
                      <h3 className="font-bold text-slate-800 text-sm">Đơn ứng tuyển của bạn</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Thư xin việc</p>
                        {detail.cover_letter ? (
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{detail.cover_letter}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Bạn chưa viết thư xin việc.</p>
                        )}
                      </div>
                      {detail.cv_url && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">CV đính kèm</p>
                          <a
                            href={detail.cv_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e3fae]/5 border border-[#1e3fae]/20 rounded-xl text-sm font-semibold text-[#1e3fae] hover:bg-[#1e3fae]/10 transition"
                          >
                            <Award className="w-4 h-4" />
                            Xem CV của bạn
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ══ RIGHT ══ */}
                <div className="space-y-5">

                  {/* Company info card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 text-sm">Thông tin công ty</h3>

                    {/* Logo + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-12 rounded-xl border border-slate-100 bg-white flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
                        <CompanyLogo logo={company?.logo_url} name={company?.name} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{company?.name ?? "—"}</p>
                        {company?.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#1e3fae] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-3 h-3" />
                            Trang công ty
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa có website</span>
                        )}
                      </div>
                    </div>

                    {/* Meta rows */}
                    <div className="space-y-2">
                      {company?.size && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0 text-xs">
                            <Users className="w-3.5 h-3.5" /> Quy mô:
                          </span>
                          <span className="font-semibold text-slate-800 text-xs text-right">{company.size}</span>
                        </div>
                      )}
                      {company?.city && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0 text-xs">
                            <MapPin className="w-3.5 h-3.5" /> Khu vực:
                          </span>
                          <span className="font-semibold text-slate-800 text-xs text-right">{company.city}</span>
                        </div>
                      )}
                      {company?.address && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 flex items-center gap-1.5 flex-shrink-0 text-xs">
                            <Building2 className="w-3.5 h-3.5" /> Địa chỉ:
                          </span>
                          <span className="font-semibold text-slate-800 text-xs text-right">{company.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Company description sections */}
                    {(intro || culture || companyBenefits.length > 0) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {intro && (
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
                              <div className="bg-orange-50 p-1 rounded-lg">
                                <Info className="w-3.5 h-3.5 text-orange-500" />
                              </div>
                              Giới thiệu
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{intro}</p>
                          </div>
                        )}
                        {culture && (
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
                              <div className="bg-red-50 p-1 rounded-lg">
                                <Heart className="w-3.5 h-3.5 text-red-500" />
                              </div>
                              Văn hóa
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{culture}</p>
                          </div>
                        )}
                        {companyBenefits.length > 0 && (
                          <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                              <div className="bg-yellow-50 p-1 rounded-lg">
                                <Gift className="w-3.5 h-3.5 text-yellow-600" />
                              </div>
                              Phúc lợi
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {companyBenefits.map((b, idx) => {
                                const { Icon, colorClass } = getBenefitIcon(b.icon);
                                return (
                                  <div
                                    key={idx}
                                    className="bg-slate-50 rounded-xl p-2.5 flex flex-col items-center text-center gap-1.5 border border-slate-100"
                                  >
                                    <div className={`p-1.5 rounded-full ${colorClass}`}>
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide leading-tight">
                                      {b.title}
                                    </p>
                                    {b.desc && (
                                      <p className="text-[10px] text-slate-400">{b.desc}</p>
                                    )}
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
          )}
        </div>
      </div>
    </div>
  );
}