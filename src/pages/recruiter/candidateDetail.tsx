import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { employerApplicationService } from "../../services/employerApplication.service";
import type { EmployerApplication } from "../../services/employerApplication.service";

// ── Mock fallback data (dùng khi API chưa trả dữ liệu) ────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_EXPERIENCES: any[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company_name: "TechFlow Solutions",
    start_date: "Tháng 06/2020",
    end_date: null,
    description:
      "• Chịu trách nhiệm dẫn dắt việc di chuyển hệ thống dashboard cũ sang React 18 & Vite, giúp tăng tốc độ build lên 300%.\n• Tối ưu hóa bundle size giảm 40% thông qua các kỹ thuật code-splitting và lazy-loading nâng cao.\n• Quản lý và đào tạo đội ngũ 4 lập trình viên Frontend Junior, thiết lập các tiêu chuẩn code review mới.",
  },
  {
    id: 2,
    title: "Web Developer",
    company_name: "Creative Pixel Agency",
    start_date: "Tháng 01/2018",
    end_date: "Tháng 05/2020",
    description:
      "• Phát triển UI pixel-perfect cho các khách hàng quốc tế trong lĩnh vực Thương mại điện tử và Fintech.\n• Tích hợp các thư viện animation mượt mà như Framer Motion và GSAP để tăng trải nghiệm người dùng.",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_EDUCATIONS: any[] = [
  {
    id: 1,
    school_name: "Đại học Công nghệ Thông tin",
    major: "Cử nhân Khoa học Máy tính",
    start_date: "2014",
    end_date: "2018",
  },
];

const MOCK_SKILLS = [
  "React.js", "TypeScript", "Next.js", "Tailwind CSS",
  "Redux Toolkit", "Vite", "Git / GitHub", "Figma to Code",
];

// ──────────────────────────────────────────────────────────────────────────

export default function CandidateDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();

  const initialApp = (routeLocation.state?.initialApp as EmployerApplication) || null;
  const [app, setApp] = useState<EmployerApplication | null>(initialApp);
  const [loading, setLoading] = useState(!initialApp);
  const [cvBlobUrl, setCvBlobUrl] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async (id: string | number) => {
    try {
      const data = await employerApplicationService.getApplicantDetail(id);
      console.log("[CandidateDetail] API response:", data);
      // Only update app if response looks like a valid application (has candidate field)
      if (data && data.candidate) {
        setApp(data as EmployerApplication);
      }
    } catch (err) {
      console.error("Lỗi tải hồ sơ:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (applicationId) fetchDetail(applicationId);
    // Cleanup blob URL khi unmount
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [applicationId, fetchDetail]);

  const handleOpenCv = useCallback(async (mode: 'view' | 'download' = 'view') => {
    if (!applicationId) return;
    // Reuse existing blob URL for view
    if (mode === 'view' && cvBlobUrl) {
      window.open(cvBlobUrl, '_blank');
      return;
    }
    setCvLoading(true);
    try {
      const blob = await employerApplicationService.fetchApplicantCvBlob(applicationId, mode);
      const url = URL.createObjectURL(blob);
      if (mode === 'view') {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = url;
        setCvBlobUrl(url);
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CV.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch {
      alert('Không thể tải CV. Ứng viên có thể chưa đính kèm CV.');
    } finally {
      setCvLoading(false);
    }
  }, [applicationId, cvBlobUrl]);

  const handleUpdateStatus = async (status: string) => {
    if (!applicationId) return;
    try {
      await employerApplicationService.updateStatus(applicationId, { status });
      fetchDetail(applicationId);
    } catch {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <span className="material-symbols-outlined text-5xl animate-spin text-blue-500">progress_activity</span>
        <p className="text-sm font-medium">Đang tải hồ sơ ứng viên...</p>
      </div>
    );
  }

  // ── Not found state ──
  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <span className="material-symbols-outlined text-5xl text-slate-200">person_off</span>
        <p className="text-sm font-medium">Không tìm thấy ứng viên.</p>
        <button
          onClick={() => navigate("/recruiter/candidates")}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // ── Map API data ──
  const candidate = app.candidate;
  const profile = candidate?.candidateProfile ?? {};

  const fullName =
    candidate?.full_name ||
    [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") ||
    "Ứng viên";

  const headline     = profile.headline ?? "";
  const candidateLoc = profile.location ?? "";
  const phone        = candidate?.phone ?? "";
  const email        = candidate?.email ?? "";
  const bio          = profile.bio ?? "";
  const coverLetter  = app.cover_letter ?? "";
  const linkedinRaw  = profile.linkedin_url ?? "";
  const websiteRaw   = profile.website ?? "";
  const linkedinHref   = linkedinRaw.startsWith("http") ? linkedinRaw : linkedinRaw ? `https://${linkedinRaw}` : "";
  const linkedinLabel  = linkedinRaw.replace(/^https?:\/\/(www\.)?/, "");
  const websiteHref    = websiteRaw.startsWith("http") ? websiteRaw : websiteRaw ? `https://${websiteRaw}` : "";
  const websiteLabel   = websiteRaw.replace(/^https?:\/\/(www\.)?/, "");

  // skills API trả [{id, name}] hoặc string[], chuẩn hóa về string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSkills: any[] = (profile.skills && profile.skills.length > 0) ? profile.skills : [];
  const skills: string[] = rawSkills.length > 0
    ? rawSkills.map((s) => (typeof s === "string" ? s : s.name ?? "")).filter(Boolean)
    : MOCK_SKILLS;

  const experiences = (profile.experiences && profile.experiences.length > 0) ? profile.experiences : MOCK_EXPERIENCES;
  const educations  = (profile.educations  && profile.educations.length  > 0) ? profile.educations  : MOCK_EDUCATIONS;

  // Avatar: resolve relative URL — env var is VITE_API_BASE_URL (e.g. http://localhost:3000/api)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
  const avatarSrc = candidate?.avatar_url
    ? candidate.avatar_url.startsWith('http')
      ? candidate.avatar_url
      : `${API_BASE}${candidate.avatar_url}`
    : null;

  const avatarInitials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  
  // Status Config
  const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
    submitted: { label: "Mới nộp", color: "bg-slate-100 text-slate-600 border-slate-200", icon: "mail" },
    under_review: { label: "Đang xem xét", color: "bg-blue-50 text-blue-600 border-blue-200", icon: "visibility" },
    interview: { label: "Hẹn phỏng vấn", color: "bg-purple-50 text-purple-600 border-purple-200", icon: "calendar_month" },
    accepted: { label: "Đã tuyển dụng", color: "bg-green-50 text-green-600 border-green-200", icon: "check_circle" },
    rejected: { label: "Đã từ chối", color: "bg-red-50 text-red-600 border-red-200", icon: "cancel" },
  };

  const currentStatus = app.status || 'submitted';
  const statusInfo = STATUS_MAP[currentStatus] || STATUS_MAP.submitted;

  // Format date: "2022-09-10" → "09/2022", otherwise return as-is
  const fmtDate = (d?: string | null): string => {
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m] = d.split("-");
      return `${m}/${y}`;
    }
    return d;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-8 text-sm text-slate-500">
        <button
          onClick={() => navigate("/recruiter/candidates")}
          className="hover:text-slate-900 transition-colors"
        >
          Chi tiết ứng viên
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{fullName}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">

        {/* ══════════════════════ LEFT CONTENT ══════════════════════ */}
        <div className="flex-1 min-w-0 space-y-10">

          {/* ── Hero Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 border-[3px] border-white shadow-md flex items-center justify-center text-blue-700 text-2xl font-bold">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{avatarInitials}</span>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white block"></span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{fullName}</h1>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}>
                    <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                    {statusInfo.label.toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-slate-500 font-medium">
                  {headline && (
                    <div className="flex items-center gap-1 text-blue-600 font-semibold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      {headline}
                    </div>
                  )}
                  {candidateLoc && (
                    <>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {candidateLoc}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
          </div>

          {/* ── Thư ứng tuyển (Cover Letter) ── */}
          {coverLetter && (
            <section>
              <SectionDivider label="THƯ ỨNG TUYỂN" />
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 relative">
                 <span className="material-symbols-outlined absolute top-4 right-4 text-amber-200 text-4xl">format_quote</span>
                 <p className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-line relative z-10 font-medium">
                   {coverLetter}
                 </p>
              </div>
            </section>
          )}

          {/* ── Giới thiệu bản thân ── */}
          <section>
            <SectionDivider label="GIỚI THIỆU BẢN THÂN" />
            <p className="text-slate-600 leading-relaxed text-[15px] mb-8">{bio}</p>

            {/* Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {phone && <ContactRow icon="call" label="ĐIỆN THOẠI" value={phone} />}
              {email && <ContactRow icon="alternate_email" label="EMAIL CÁ NHÂN" value={email} />}
              {websiteRaw && (
                <div className="col-span-1 border border-slate-100 rounded-xl">
                  <ContactRow
                    icon="link"
                    label="GITHUB / WEBSITE"
                    value={
                      <a href={websiteHref} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold line-clamp-1">
                        {websiteLabel}
                      </a>
                    }
                  />
                </div>
              )}
              {linkedinRaw && (
                <div className="col-span-1 border border-slate-100 rounded-xl">
                  <ContactRow
                    icon="public"
                    label="LINKEDIN"
                    value={
                      <a href={linkedinHref} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold line-clamp-1">
                        {linkedinLabel}
                      </a>
                    }
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── Kinh nghiệm làm việc ── */}
          <section>
            <SectionDivider label="KINH NGHIỆM LÀM VIỆC" />
            <div className="space-y-0">
              {experiences.map((exp, idx) => {
                const isLast = idx === experiences.length - 1;
                const expTitle = exp.title ?? exp.job_title ?? "";
                const company  = exp.company_name ?? exp.company ?? "";
                const from     = exp.start_date ?? "";
                const to       = exp.end_date ? exp.end_date : "HIỆN TẠI";
                const desc     = exp.description ?? "";
                return (
                  <div key={exp.id ?? idx} className="flex gap-5">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${idx === 0 ? "bg-blue-50 border-2 border-blue-200 text-blue-600" : "bg-slate-100 border-2 border-slate-200 text-slate-400"}`}>
                        <span className="material-symbols-outlined text-[18px]">work</span>
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-slate-200 my-2"></div>}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 ${!isLast ? "pb-8" : "pb-2"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{expTitle}</h4>
                          <p className={`text-sm font-semibold ${idx === 0 ? "text-blue-600" : "text-slate-500"}`}>{company}</p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap self-start sm:self-auto">
                          {fmtDate(from)} {to === "HIỆN TẠI" ? "– Hiện tại" : to ? `– ${fmtDate(to)}` : ""}
                        </span>
                      </div>
                      {desc && (
                        <ul className="mt-3 space-y-1.5">
                          {desc.split("\n").filter((line: string) => line.trim()).map((line: string, li: number) => (
                            <li key={li} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                              <span>{line.replace(/^[•\-]\s*/, "")}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Học vấn ── */}
          <section>
            <SectionDivider label="HỌC VẤN" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {educations.map((edu, idx) => (
                <div key={edu.id ?? idx} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">school</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{edu.school_name ?? edu.school}</h4>
                    <p className="text-slate-500 text-sm mt-0.5">{edu.major ?? edu.field_of_study ?? edu.degree}</p>
                    <p className="text-slate-400 text-xs mt-1.5 font-medium">
                      {fmtDate(edu.start_date)} {edu.end_date ? `– ${fmtDate(edu.end_date)}` : "– Hiện tại"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Kỹ năng chuyên môn ── */}
          <section>
            <SectionDivider label="KỸ NĂNG CHUYÊN MÔN" />
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, idx: number) => (
                <span key={idx} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Action buttons at the bottom */}
          <div className="pt-6 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Nếu trạng thái kết thúc (accepted/rejected), show thông báo nhẹ */}
            {(currentStatus === 'accepted' || currentStatus === 'rejected') ? (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border w-full ${statusInfo.color}`}>
                <span className="material-symbols-outlined">{statusInfo.icon}</span>
                <p className="text-sm font-semibold">Hồ sơ này đã ở trạng thái: {statusInfo.label}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {/* Chỉ hiện 'Đang xem xét' nếu đang ở 'submitted' */}
                  {currentStatus === 'submitted' && (
                    <button
                      onClick={() => handleUpdateStatus("under_review")}
                      className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                      title="Chuyển sang trạng thái đang xem xét"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span> Đang xem xét
                    </button>
                  )}
                  
                  {/* Phỏng vấn: Hiện nếu là submitted hoặc under_review */}
                  {(currentStatus === 'submitted' || currentStatus === 'under_review') && (
                    <button
                      onClick={() => handleUpdateStatus("interview")}
                      className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors"
                      title="Lên lịch phỏng vấn"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span> Phỏng vấn
                    </button>
                  )}

                  {/* Tuyển dụng: Chỉ hiện nếu đang ở trạng thái Interview */}
                  {currentStatus === 'interview' && (
                    <button
                      onClick={() => handleUpdateStatus("accepted")}
                      className="flex items-center gap-1.5 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 shadow-sm transition-colors"
                    >
                      Đã tuyển <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus("rejected")}
                    className="flex items-center gap-1.5 px-6 py-2 border border-red-200 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span> Từ chối
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-8" />
        </div>

        {/* ══════════════════════ RIGHT SIDEBAR ══════════════════════ */}
        <div className="w-full xl:w-[340px] flex-shrink-0 space-y-5">

          {/* CV Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-700">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">contact_page</span>
                CV Preview
              </h3>
              <div className="flex items-center gap-2 text-slate-400">
                <button
                  onClick={() => handleOpenCv('download')}
                  disabled={cvLoading}
                  className="hover:text-slate-700 transition-colors disabled:opacity-40"
                  title="Download"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
                <button
                  onClick={() => handleOpenCv('view')}
                  disabled={cvLoading}
                  className="hover:text-slate-700 transition-colors disabled:opacity-40"
                  title="Open in new tab"
                >
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </button>
              </div>
            </div>

            {/* Simulated CV thumbnail */}
            <div className="relative aspect-[0.71] bg-white border border-slate-100 rounded-xl overflow-hidden group cursor-pointer shadow-sm mb-4">
              {/* CV Content Preview */}
              <div className="p-5 h-full flex flex-col">
                <div className="text-center mb-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">{fullName}</p>
                  <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{headline}</p>
                </div>
                <div className="w-full h-px bg-slate-200 mb-4"></div>
                <div className="space-y-2 flex-1">
                  {[70, 100, 85, 60, 100, 90, 75, 100, 80].map((w, i) => (
                    <div key={i} className={`h-1.5 rounded-full ${i % 3 === 0 ? "bg-slate-300" : "bg-slate-100"}`} style={{ width: `${w}%` }}></div>
                  ))}
                  <div className="pt-3 grid grid-cols-2 gap-2">
                    {[80, 60, 90, 70].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-slate-100" style={{ width: `${w}%` }}></div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-[8px] text-slate-300 mt-3 italic">Preview mode · Page 1 of 2</p>
              </div>

              {/* Hover overlay */}
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                onClick={() => handleOpenCv('view')}
              >
                <div className="bg-white rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 flex items-center gap-2 shadow-lg">
                  {cvLoading
                    ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Đang tải...</>
                    : <><span className="material-symbols-outlined text-[18px]">visibility</span> Xem bản lớn</>
                  }
                </div>
              </div>
            </div>

            {/* CV action buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleOpenCv('view')}
                disabled={cvLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                {cvLoading ? 'Đang tải...' : 'Xem CV'}
              </button>
              <button
                onClick={() => handleOpenCv('download')}
                disabled={cvLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:border-green-200 hover:bg-green-50 rounded-xl text-xs font-bold text-slate-700 hover:text-green-600 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Tải về
              </button>
            </div>
          </div>

          {/* AI Compatibility */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
            <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <span className="material-symbols-outlined absolute top-4 right-4 text-white/40 text-[22px] animate-pulse">auto_awesome</span>

            <h3 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              TƯƠNG THÍCH AI
            </h3>

            {/* Circle Progress */}
            <div className="flex justify-center mb-6">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" strokeWidth="8" stroke="rgba(255,255,255,0.2)" />
                  <circle
                    cx="50" cy="50" r="40" fill="transparent"
                    strokeWidth="8" stroke="white" strokeLinecap="round"
                    strokeDasharray="251.2" strokeDashoffset="20"
                    className="drop-shadow"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold leading-none">92</span>
                  <span className="text-xs font-bold text-white/70">%</span>
                </div>
              </div>
            </div>

            <div className="text-center relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">EXCELLENT</p>
              <p className="text-sm text-white/90 leading-relaxed">
                Ứng viên đáp ứng tuyệt vời các yêu cầu kỹ thuật và kinh nghiệm cho vị trí{" "}
                <strong className="text-white">{app.title ?? app.job?.title ?? "ứng tuyển"}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-1 bg-slate-200"></div>
      <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-slate-200"></div>
    </div>
  );
}

function ContactRow({
  icon, label, value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-300 transition-colors">
      <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
        <div className="text-[15px] font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
