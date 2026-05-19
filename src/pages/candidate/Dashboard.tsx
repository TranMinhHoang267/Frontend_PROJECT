import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  Bookmark,
  MoreVertical,
  CheckCircle2,
  Loader2,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { applicationService } from "../../services/application.service";
import type { Application } from "../../services/application.service";
import { employerService } from "../../services/employer.service";
import ApplicationDetailModal from "./ApplicationDetailModal";

// ─── 5 trạng thái hợp lệ theo backend ───────────────────────────────────────
// VALID: submitted | under_review | interview | accepted | rejected
type JourneyStep = "applied" | "review" | "interview" | "decision";

const STATUS_LABEL: Record<string, string> = {
  submitted:    "Đã nộp",
  under_review: "Đang xem xét",
  interview:    "Đang phỏng vấn",
  accepted:     "Đã trúng tuyển",
  rejected:     "Đã từ chối",
};

const STATUS_STYLE: Record<string, string> = {
  submitted:    "bg-blue-100 text-blue-700",
  under_review: "bg-orange-100 text-orange-700",
  interview:    "bg-violet-100 text-violet-700",
  accepted:     "bg-emerald-100 text-emerald-700",
  rejected:     "bg-red-100 text-red-700",
};

// Journey stepper: status → mức độ tiến trình
const STATUS_LEVEL: Record<string, number> = {
  submitted:    1,
  under_review: 2,
  interview:    3,
  accepted:     4,
  rejected:     4,
};
const STEP_LEVEL: Record<string, number> = {
  applied: 1, review: 2, interview: 3, decision: 4,
};

function getStepState(step: JourneyStep, status: string): "completed" | "active" | "upcoming" {
  const cur = STATUS_LEVEL[status] ?? 1;
  const lv  = STEP_LEVEL[step];
  if (cur > lv)  return "completed";
  if (cur === lv) return "active";
  return "upcoming";
}

// ─── Company logo helper ──────────────────────────────────────────────────────
function CompanyLogo({ logo, name }: { logo?: string | null; name?: string }) {
  const [err, setErr] = useState(false);
  const url = logo ? employerService.getLogoUrl(logo) : null;
  if (url && !err) {
    return (
      <img
        src={url}
        alt={name}
        className="w-full h-full object-contain"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <span className="font-bold text-[#1e3fae] text-sm">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CandidateDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(" ").slice(-1)[0] || "Bạn";

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  // Modal state
  const [detailModalId, setDetailModalId] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getApplications();
      const list = (Array.isArray(data) ? data : []) as Application[];
      setApps(list);
      if (list.length > 0) setSelectedApp(list[0]);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleDeleteRejected = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn ứng tuyển đã bị từ chối này không?")) return;
    try {
      await applicationService.deleteRejectedApplication(id);
      // Refresh list
      fetchApps();
      setOpenMenuId(null);
    } catch (error) {
      console.error("Lỗi khi xóa đơn ứng tuyển:", error);
      alert("Không thể xóa đơn ứng tuyển. Vui lòng thử lại sau.");
    }
  };

  // Stats
  const totalApps   = apps.length;
  const activeIntvw = apps.filter((a) => a.status === 'interview').length;

  const stats = [
    {
      label: "Tổng đơn ứng tuyển",
      value: totalApps,
      sub: `+${Math.min(totalApps, 2)} tuần này`,
      subColor: "text-emerald-500",
      Icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-[#1e3fae]",
    },
    {
      label: "Đang phỏng vấn",
      value: activeIntvw,
      sub: activeIntvw > 0 ? "Tiếp theo: Ngày mai" : "Không có lịch",
      subColor: "text-slate-400",
      Icon: MessageSquare,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
    {
      label: "Việc làm đã lưu",
      value: 0,
      sub: "Cập nhật 2 giờ trước",
      subColor: "text-slate-400",
      Icon: Bookmark,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
  ];

  const JOURNEY_STEPS: { step: JourneyStep; label: string }[] = [
    { step: "applied",   label: "Đã nộp" },
    { step: "review",    label: "Xem xét" },
    { step: "interview", label: "Phỏng vấn" },
    { step: "decision",  label: "Kết quả" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Bảng điều khiển Ứng viên
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Chào mừng trở lại, {firstName}. Dưới đây là tổng quan trạng thái ứng tuyển của bạn.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin w-10 h-10 text-[#1e3fae]" />
        </div>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`size-11 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}
                  >
                    <s.Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-bold ${s.subColor}`}>
                    {s.sub}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-semibold">{s.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Recent Applications ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Đơn ứng tuyển gần đây</h2>
              {apps.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-sm font-bold text-[#1e3fae] hover:underline"
                >
                  {showAll ? "Thu gọn" : `Xem tất cả (${apps.length})`}
                </button>
              )}
            </div>

            {apps.length === 0 ? (
              <div className="py-14 text-center">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">Chưa có đơn ứng tuyển nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f8fafc] border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Công ty &amp; Công việc
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Ngày nộp
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apps.slice(0, showAll ? apps.length : 5).map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => { setSelectedApp(app); setOpenMenuId(null); }}
                        className={`cursor-pointer transition-colors ${
                          selectedApp?.id === app.id
                            ? "bg-blue-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Company & Job */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                              <CompanyLogo
                                logo={app.job?.company?.logoUrl}
                                name={app.job?.company?.name}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-tight">
                                {app.job?.title || "—"}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                {app.job?.company?.name && (
                                  <>
                                    <Building2 className="w-3 h-3" />
                                    {app.job.company.name}
                                    {app.job?.location && ` • ${app.job.location}`}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }) : "—"}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              STATUS_STYLE[app.status] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-current opacity-70" />
                            {STATUS_LABEL[app.status] ?? app.status}
                          </span>
                        </td>

                        {/* Action menu */}
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === app.id ? null : app.id)
                              }
                              className="text-slate-300 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenuId === app.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-sm">
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-slate-700 hover:bg-slate-50"
                                >
                                  Xem hành trình
                                </button>
                                {app.id && (
                                  <button
                                    onClick={() => {
                                      setDetailModalId(app.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-700 hover:bg-slate-50"
                                  >
                                    Xem chi tiết đơn tuyển
                                  </button>
                                )}
                                {app.status === "rejected" && (
                                  <button
                                    onClick={() => handleDeleteRejected(app.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 border-t border-slate-50 mt-1"
                                  >
                                    Xóa đơn bị từ chối
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Selected Application Journey ── */}
          {selectedApp && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              {/* Label */}
              <div className="flex items-center gap-2 mb-6">
                <div className="size-2 bg-[#1e3fae] rounded-full animate-pulse" />
                <p className="text-[11px] font-bold text-[#1e3fae] uppercase tracking-widest">
                  Hành trình ứng tuyển đã chọn
                </p>
              </div>

              {/* Title row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  {/* Company Logo in Header */}
                  <div className="size-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden p-2 flex-shrink-0 shadow-sm">
                    <CompanyLogo
                      logo={selectedApp.job?.company?.logoUrl}
                      name={selectedApp.job?.company?.name}
                    />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                      <h2 className="text-2xl font-black text-slate-900 leading-none">
                        {selectedApp.job?.title}
                      </h2>
                      {selectedApp.job?.company?.name && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <ArrowRight className="w-5 h-5 text-slate-300" />
                          <span className="text-lg font-bold text-slate-500">
                            {selectedApp.job.company.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[selectedApp.status]}`}>
                        {STATUS_LABEL[selectedApp.status]}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Cập nhật: {new Date(selectedApp.updatedAt || selectedApp.appliedAt || Date.now()).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate("/candidate/applications")}
                  className="flex-shrink-0 px-6 py-3 rounded-xl bg-[#1e3fae] text-white text-sm font-bold hover:bg-[#1e3fae]/90 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {selectedApp.status === 'interview' ? "Quản lý phỏng vấn" : "Tất cả đơn tuyển"}
                </button>
              </div>

              {/* Stepper */}
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-[18px] left-[12.5%] right-[12.5%] h-0.5 bg-slate-100" />

                {/* Completed segments overlay */}
                <div
                  className="absolute top-[18px] left-[12.5%] h-0.5 bg-[#1e3fae] transition-all"
                  style={{
                    width: `${
                      Math.max(0, (STATUS_LEVEL[selectedApp.status] ?? 1) - 1) *
                      (75 / 3)
                    }%`,
                  }}
                />

                <div className="flex justify-between relative z-10">
                  {JOURNEY_STEPS.map(({ step, label }) => {
                    const state = getStepState(step, selectedApp.status);
                    const isDecision = step === "decision";
                    const isRejected = selectedApp.status === "rejected";
                    const isAccepted = selectedApp.status === "accepted";

                    let dateStr = "Sắp tới";
                    if (step === "applied") {
                      dateStr = selectedApp.appliedAt
                        ? new Date(selectedApp.appliedAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "short",
                          })
                        : "—";
                    } else if (state === "active") {
                      dateStr = isDecision 
                        ? (isRejected ? "Đã từ chối" : isAccepted ? "Trúng tuyển" : "Đang xử lý")
                        : "Đang xử lý";
                    } else if (state === "completed") {
                      dateStr = "Hoàn thành";
                    }

                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        {/* Node */}
                        {isDecision && isRejected ? (
                          <div className="size-9 rounded-full bg-red-500 flex items-center justify-center mb-3 shadow-sm">
                            <span className="material-symbols-outlined text-[18px] text-white">close</span>
                          </div>
                        ) : state === "completed" ? (
                          <div className="size-9 rounded-full bg-[#1e3fae] flex items-center justify-center mb-3 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : state === "active" ? (
                          <div className={`size-9 rounded-full border-4 ${isDecision && isAccepted ? "border-emerald-500" : "border-[#1e3fae]"} bg-white flex items-center justify-center mb-3 shadow-md`}>
                            <div className={`size-3 ${isDecision && isAccepted ? "bg-emerald-500" : "bg-[#1e3fae]"} rounded-full animate-pulse`} />
                          </div>
                        ) : (
                          <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3" />
                        )}

                        {/* Label */}
                        <p
                          className={`text-xs font-bold ${
                            isDecision && isRejected
                              ? "text-red-500"
                              : isDecision && isAccepted && state === "active"
                              ? "text-emerald-600"
                              : state === "upcoming"
                              ? "text-slate-400"
                              : state === "active"
                              ? "text-[#1e3fae]"
                              : "text-slate-900"
                          }`}
                        >
                          {isDecision && isRejected ? "Từ chối" : isDecision && isAccepted ? "Trúng tuyển" : label}
                        </p>
                        <p
                          className={`text-[10px] font-medium mt-0.5 ${
                            isDecision && isRejected ? "text-red-400" : state === "active" ? "text-[#1e3fae]/70" : "text-slate-400"
                          }`}
                        >
                          {dateStr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recruiter rejection note */}
              {/* Recruiter rejection note - Placeholder if needed later */}
              {selectedApp.status === "rejected" && (
                <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-xl" />
                  <h3 className="text-sm font-bold text-red-800 mb-1 pl-2">
                    Thông tin phản hồi
                  </h3>
                  <p className="text-sm text-red-600 pl-2">
                    Hồ sơ của bạn đã được xem xét nhưng rất tiếc chưa phù hợp ở thời điểm này.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detailModalId && (
        <ApplicationDetailModal
          applicationId={detailModalId}
          onClose={() => setDetailModalId(null)}
        />
      )}
    </div>
  );
}
