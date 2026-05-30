import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { employerApplicationService } from "../../services/employerApplication.service";
import type { EmployerApplication } from "../../services/employerApplication.service";

interface ApplicantDetail extends EmployerApplication {
  resumeUrl?: string;
}

// ──────────────────────────────────────────────────────────────────────────

export default function CandidateDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();

  const initialApp = (routeLocation.state?.initialApp as ApplicantDetail) || null;
  const [app, setApp] = useState<ApplicantDetail | null>(initialApp);
  const [loading, setLoading] = useState(!initialApp);
  const [cvBlobUrl, setCvBlobUrl] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async (id: string | number) => {
    try {
      const data = await employerApplicationService.getApplicantDetail(id);
      if (data) {
        setApp(data as ApplicantDetail);
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
    candidate?.fullName ||
    [candidate?.firstName, candidate?.lastName].filter(Boolean).join(" ") ||
    "Ứng viên";

  const headline     = profile.headline ?? "";
  const candidateLoc = profile.location ?? "";
  const phone        = candidate?.phone ?? "";
  const email        = candidate?.email ?? "";
  const summary      = profile.summary ?? "";
  const city         = profile.city ?? "";
  const gender       = profile.gender ?? "";
  const coverLetter  = app.coverLetter ?? "";

  // skills API trả [{id, name}] hoặc string[], chuẩn hóa về string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSkills: any[] = (profile.skills && profile.skills.length > 0) ? profile.skills : [];
  const experiences = (profile.experiences && profile.experiences.length > 0) ? profile.experiences : [];
  const educations  = (profile.educations  && profile.educations.length  > 0) ? profile.educations  : [];
  const skills      = rawSkills.length > 0
    ? rawSkills.map((s) => (typeof s === "string" ? s : s.name ?? "")).filter(Boolean)
    : [];

  // Avatar: resolve relative URL — env var is VITE_API_BASE_URL (e.g. http://localhost:3000/api)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
  const avatarSrc = candidate?.avatarUrl
    ? candidate.avatarUrl.startsWith('http')
      ? candidate.avatarUrl
      : `${API_BASE}${candidate.avatarUrl}`
    : null;

  const avatarInitials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  
  // Status Config
  const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
    submitted:    { label: "Mới nộp", color: "bg-blue-50 text-blue-600 border-blue-100", icon: "mail" },
    under_review: { label: "Đang xem xét", color: "bg-purple-50 text-purple-600 border-purple-100", icon: "visibility" },
    interview:    { label: "Đang phỏng vấn", color: "bg-amber-50 text-amber-600 border-amber-100", icon: "calendar_month" },
    accepted:     { label: "Đã tuyển", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: "check_circle" },
    rejected:     { label: "Đã từ chối", color: "bg-rose-50 text-rose-600 border-rose-100", icon: "cancel" },
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full bg-[#f8fafc] min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <button
          onClick={() => navigate("/recruiter/candidates")}
          className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Danh sách ứng viên
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{fullName}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">

        {/* ══════════════════════ LEFT CONTENT ══════════════════════ */}
        <div className="flex-1 min-w-0 space-y-8 w-full">

          {/* ── Hero Header ── */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-500 border-[4px] border-white shadow-xl flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold tracking-wider ring-4 ring-blue-500/5">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <span>{avatarInitials}</span>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white shadow-sm block animate-pulse"></span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{fullName}</h1>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm ${statusInfo.color}`}>
                    <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                    {statusInfo.label.toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5 text-sm">
                  {headline && (
                    <div className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 shadow-sm">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">verified</span>
                      {headline}
                    </div>
                  )}
                  {candidateLoc && (
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                      {candidateLoc}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Fast Actions in Hero */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenCv('view')}
                disabled={cvLoading}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Xem CV nhanh
              </button>
            </div>
          </div>

          {/* ── Thư ứng tuyển (Cover Letter) ── */}
          {coverLetter && (
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <SectionDivider label="THƯ ỨNG TUYỂN" icon="format_quote" />
              <div className="bg-amber-50/30 border border-amber-100/70 rounded-2xl p-6 relative">
                 <span className="material-symbols-outlined absolute top-4 right-4 text-amber-200/50 text-5xl select-none">format_quote</span>
                 <p className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-line relative z-10 font-medium italic">
                   "{coverLetter}"
                 </p>
              </div>
            </section>
          )}

          {/* ── Thông tin cá nhân ── */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <SectionDivider label="THÔNG TIN CÁ NHÂN" icon="person" />
            {summary && <p className="text-slate-600 leading-relaxed text-[15px] mb-6 pl-1 border-l-2 border-blue-500/50">{summary}</p>}

            {/* Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {phone && <ContactRow icon="call" label="ĐIỆN THOẠI" value={phone} />}
              {email && <ContactRow icon="alternate_email" label="EMAIL CÁ NHÂN" value={email} />}
              {city && <ContactRow icon="map" label="THÀNH PHỐ" value={city} />}
              {gender && <ContactRow icon="wc" label="GIỚI TÍNH" value={gender} />}
            </div>
          </section>

          {/* ── Kinh nghiệm làm việc ── */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <SectionDivider label="KINH NGHIỆM LÀM VIỆC" icon="business_center" />
            
            {experiences.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 ml-3">
                {experiences.map((exp, idx) => (
                  <div key={exp.id ?? idx} className="relative group">
                    {/* Timeline node */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-500 ring-4 ring-blue-50 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    {/* Timeline content */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-[16px] group-hover:text-blue-600 transition-colors">
                            {exp.jobTitle ?? exp.title}
                          </h4>
                          <p className="text-blue-600 text-sm font-semibold mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-blue-500">business</span>
                            {exp.companyName ?? exp.company}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm border border-slate-100 self-start sm:self-auto">
                          {fmtDate(exp.startDate)} {exp.endDate ? `– ${fmtDate(exp.endDate)}` : "– Hiện tại"}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-slate-500 text-sm mt-3 leading-relaxed whitespace-pre-line border-t border-slate-50 pt-3">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic pl-1">Chưa cập nhật kinh nghiệm làm việc</p>
            )}
          </section>

          {/* ── Học vấn ── */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <SectionDivider label="HỌC VẤN" icon="school" />
            
            {educations.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 ml-3">
                {educations.map((edu, idx) => (
                  <div key={edu.id ?? idx} className="relative group">
                    {/* Timeline node */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-orange-500 ring-4 ring-orange-50 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    </div>
                    {/* Timeline content */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-[16px] group-hover:text-orange-600 transition-colors">
                            {edu.schoolName ?? edu.school}
                          </h4>
                          <p className="text-orange-600 text-sm font-semibold mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-orange-500">school</span>
                            {edu.major ?? edu.fieldOfStudy ?? edu.degree}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm border border-slate-100 self-start sm:self-auto">
                          {fmtDate(edu.startDate)} {edu.endDate ? `– ${fmtDate(edu.endDate)}` : "– Hiện tại"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic pl-1">Chưa cập nhật thông tin học vấn</p>
            )}
          </section>

          {/* Spacer to make sure sticky action bar does not cover content */}
          <div className="h-20" />
        </div>

        {/* ══════════════════════ RIGHT SIDEBAR ══════════════════════ */}
        <div className="w-full lg:w-[360px] flex-shrink-0 space-y-6 lg:sticky lg:top-6">

          {/* CV Preview Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1e3fae]">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">contact_page</span>
                Xem trước CV
              </h3>
              <div className="flex items-center gap-2 text-slate-400">
                <button
                  onClick={() => handleOpenCv('download')}
                  disabled={cvLoading}
                  className="hover:text-blue-600 transition-colors disabled:opacity-40 p-1.5 hover:bg-slate-50 rounded-lg"
                  title="Tải về"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
                <button
                  onClick={() => handleOpenCv('view')}
                  disabled={cvLoading}
                  className="hover:text-blue-600 transition-colors disabled:opacity-40 p-1.5 hover:bg-slate-50 rounded-lg"
                  title="Mở tab mới"
                >
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </button>
              </div>
            </div>

            {/* Simulated CV thumbnail */}
            <div className="relative aspect-[0.71] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden group cursor-pointer shadow-inner">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  <span className="material-symbols-outlined text-4xl">pdf_viewer</span>
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider line-clamp-2 px-2">
                  {app?.resumeUrl?.split('/').pop() || "Resume.pdf"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Tài liệu PDF · 1.2 MB</p>
              </div>

              {/* Hover overlay */}
              <div
                className="absolute inset-0 bg-black/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                onClick={() => handleOpenCv('view')}
              >
                <div className="bg-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-lg">
                  {cvLoading
                    ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Đang tải...</>
                    : <><span className="material-symbols-outlined text-[16px]">visibility</span> Xem bản lớn</>
                  }
                </div>
              </div>
            </div>

            {/* CV action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenCv('view')}
                disabled={cvLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 transition-all disabled:opacity-50 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                {cvLoading ? 'Đang tải...' : 'Xem CV'}
              </button>
              <button
                onClick={() => handleOpenCv('download')}
                disabled={cvLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 hover:border-green-200 hover:bg-green-50 rounded-xl text-xs font-bold text-slate-700 hover:text-green-600 transition-all disabled:opacity-50 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Tải về
              </button>
            </div>
          </div>

          {/* Kỹ năng chuyên môn (Moved to Sidebar) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1e3fae] mb-4">
              <span className="material-symbols-outlined text-blue-500 text-[20px]">psychology</span>
              KỸ NĂNG CHUYÊN MÔN
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-blue-50/70 text-blue-700 text-[13px] font-semibold border border-blue-100/50 shadow-sm hover:scale-105 transition-transform duration-200">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-slate-400 text-sm italic px-1">Chưa cập nhật kỹ năng</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Action Footer Bar ── */}
      <div className="fixed bottom-6 left-4 right-4 z-50 bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto animate-fade-in-up">
        {/* Left message/status info */}
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          <span className="text-sm font-bold text-slate-800">Trạng thái hồ sơ:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Action button groups */}
        <div className="flex items-center gap-3">
          {(currentStatus === 'accepted' || currentStatus === 'rejected') ? (
            <div className="text-xs font-semibold text-slate-400 italic">
              Nhà tuyển dụng đã hoàn thành xử lý hồ sơ này.
            </div>
          ) : (
            <>
              {/* Phản hồi duyệt */}
              <div className="flex gap-2">
                {currentStatus === 'submitted' && (
                  <button
                    onClick={() => handleUpdateStatus("under_review")}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl text-xs font-extrabold hover:bg-blue-100 transition-colors shadow-sm"
                    title="Chuyển sang trạng thái đang xem xét"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span> Đang xem xét
                  </button>
                )}
                
                {(currentStatus === 'submitted' || currentStatus === 'under_review') && (
                  <button
                    onClick={() => handleUpdateStatus("interview")}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 border border-purple-200 bg-purple-50 text-purple-700 rounded-xl text-xs font-extrabold hover:bg-purple-100 transition-colors shadow-sm"
                    title="Lên lịch phỏng vấn"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span> Phỏng vấn
                  </button>
                )}

                {(currentStatus === 'submitted' || currentStatus === 'under_review' || currentStatus === 'interview') && (
                  <button
                    onClick={() => handleUpdateStatus("accepted")}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 text-white rounded-xl text-xs font-extrabold hover:bg-green-700 shadow-md shadow-green-100 transition-all hover:translate-y-[-1px] active:translate-y-[0]"
                  >
                    Nhận việc <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </button>
                )}
              </div>
              
              <div className="h-6 w-px bg-slate-200" />
              
              <button
                onClick={() => handleUpdateStatus("rejected")}
                className="flex items-center gap-1.5 px-5 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl text-xs font-extrabold hover:bg-red-100 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span> Từ chối
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────

function SectionDivider({ label, icon }: { label: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      {icon && (
        <span className="material-symbols-outlined text-blue-500/80 text-[20px]">{icon}</span>
      )}
      <span className="text-[11px] font-extrabold tracking-widest text-[#1e3fae] uppercase whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
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
    <div className="flex items-center gap-4.5 p-4.5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-400/30 transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100/50 shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <div className="text-[14px] font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
