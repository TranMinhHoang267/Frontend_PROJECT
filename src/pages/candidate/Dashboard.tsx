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
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { applicationService } from "../../services/application.service";
import type { Application } from "../../services/application.service";
import { employerService } from "../../services/employer.service";

// ─── 5 trạng thái hợp lệ theo backend ───────────────────────────────────────
// VALID: submitted | under_review | interview | accepted | rejected
type JourneyStep = "applied" | "review" | "interview" | "decision";

const STATUS_LABEL: Record<string, string> = {
  submitted:    "Submitted",
  under_review: "Under Review",
  interview:    "Interviewing",
  accepted:     "Accepted",
  rejected:     "Rejected",
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
  const firstName = user?.fullName?.split(" ").slice(-1)[0] || "Alex";

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // Stats
  const totalApps   = apps.length;
  const activeIntvw = apps.filter((a) => a.status === 'interview').length;

  const stats = [
    {
      label: "Total Applications",
      value: totalApps,
      sub: `+${Math.min(totalApps, 2)} this week`,
      subColor: "text-emerald-500",
      Icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-[#1e3fae]",
    },
    {
      label: "Active Interviews",
      value: activeIntvw,
      sub: activeIntvw > 0 ? "Next: Tomorrow" : "No upcoming",
      subColor: "text-slate-400",
      Icon: MessageSquare,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
    {
      label: "Bookmarked Jobs",
      value: 0,
      sub: "Updated 2h ago",
      subColor: "text-slate-400",
      Icon: Bookmark,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
  ];

  const JOURNEY_STEPS: { step: JourneyStep; label: string }[] = [
    { step: "applied",   label: "Applied" },
    { step: "review",    label: "Review" },
    { step: "interview", label: "Interview" },
    { step: "decision",  label: "Decision" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Candidate Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome back, {firstName}. Here's your application status overview.
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
              <h2 className="text-lg font-black text-slate-900">Recent Applications</h2>
              {apps.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-sm font-bold text-[#1e3fae] hover:underline"
                >
                  {showAll ? "Thu gọn" : `View All (${apps.length})`}
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
                        Company &amp; Job
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Date Applied
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apps.slice(0, 5).map((app) => (
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
                                logo={app.job?.company?.logo_url}
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
                          {new Date(app.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
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
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-sm">
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-slate-700 hover:bg-slate-50"
                                >
                                  Xem hành trình
                                </button>
                                {app.job?.id && (
                                  <button
                                    onClick={() => {
                                      navigate(`/candidate/jobs/${app.job!.id}`);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-700 hover:bg-slate-50"
                                  >
                                    Xem việc làm
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
              {/* Label */}
              <p className="text-[10px] font-bold text-[#1e3fae] uppercase tracking-widest mb-2">
                Selected Application Journey
              </p>

              {/* Title row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {selectedApp.job?.title}
                  {selectedApp.job?.company?.name && (
                    <span className="font-semibold text-slate-500">
                      {" "}at {selectedApp.job.company.name}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => navigate("/candidate/applications")}
                  className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Manage Interview
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
                    const dateStr =
                      step === "applied"
                        ? new Date(selectedApp.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                          })
                        : state === "active"
                        ? "In Progress"
                        : state === "completed"
                        ? "Done"
                        : "Upcoming";

                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        {/* Node */}
                        {state === "completed" ? (
                          <div className="size-9 rounded-full bg-[#1e3fae] flex items-center justify-center mb-3 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : state === "active" ? (
                          <div className="size-9 rounded-full border-4 border-[#1e3fae] bg-white flex items-center justify-center mb-3 shadow-md">
                            <div className="size-3 bg-[#1e3fae] rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <div className="size-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3" />
                        )}

                        {/* Label */}
                        <p
                          className={`text-xs font-bold ${
                            state === "upcoming"
                              ? "text-slate-400"
                              : state === "active"
                              ? "text-[#1e3fae]"
                              : "text-slate-900"
                          }`}
                        >
                          {label}
                        </p>
                        <p
                          className={`text-[10px] font-medium mt-0.5 ${
                            state === "active" ? "text-[#1e3fae]/70" : "text-slate-400"
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
              {selectedApp.status === "rejected" && selectedApp.note_by_recruiter && (
                <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-xl" />
                  <h3 className="text-sm font-bold text-red-800 mb-1 pl-2">
                    Feedback from Employer
                  </h3>
                  <p className="text-sm text-red-600 pl-2">
                    {selectedApp.note_by_recruiter}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
