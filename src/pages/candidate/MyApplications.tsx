import { useState, useEffect, useCallback } from "react";
import {
  Briefcase, MapPin, Calendar, Clock, Search,
  ChevronLeft, ChevronRight, RefreshCw, Eye, Trash2,
  FileText, CheckCircle2, XCircle, AlertCircle, Send,
  Users, Building2, Banknote,
} from "lucide-react";
import { applicationService, type Application } from "../../services/application.service";
import { employerService } from "../../services/employer.service";
import ApplicationDetailModal from "./ApplicationDetailModal";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  submitted:    { label: "Đã nộp",         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: <Send className="w-3.5 h-3.5" /> },
  under_review: { label: "Đang xem xét",   color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: <Clock className="w-3.5 h-3.5" /> },
  interview:    { label: "Đang phỏng vấn", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",  icon: <Users className="w-3.5 h-3.5" /> },
  accepted:     { label: "Được nhận",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:     { label: "Đã từ chối",     color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: <XCircle className="w-3.5 h-3.5" /> },
};
const UNKNOWN_STATUS = { label: "Không xác định", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", icon: <AlertCircle className="w-3.5 h-3.5" /> };

const TABS = [
  { key: "all",          label: "Tất cả" },
  { key: "submitted",    label: "Đã nộp" },
  { key: "under_review", label: "Đang xem xét" },
  { key: "interview",    label: "Đang phỏng vấn" },
  { key: "accepted",     label: "Được nhận" },
  { key: "rejected",     label: "Đã từ chối" },
];
const PAGE_SIZE = 6;

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Không rõ";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? UNKNOWN_STATUS;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function CompanyLogo({ logo, name }: { logo?: string | null; name?: string }) {
  const [err, setErr] = useState(false);
  const url = logo ? employerService.getLogoUrl(logo) : null;
  if (url && !err)
    return <img src={url} alt={name} className="w-full h-full object-contain" onError={() => setErr(true)} />;
  return <span className="text-[#1e3fae] font-black text-lg">{name?.charAt(0)?.toUpperCase() || "?"}</span>;
}

const formatSalary = (min: number | null, max: number | null) => {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}N`;
    return String(n);
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  if (min) return `Từ ${fmt(min)} VND`;
  return `Đến ${fmt(max!)} VND`;
};

function ApplicationCard({ app, onWithdraw, onDeleteRejected, onViewDetail }: {
  app: Application;
  onWithdraw: (id: string) => void;
  onDeleteRejected: (id: string) => void;
  onViewDetail: (id: string) => void;
}) {
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#1e3fae]/30 hover:shadow-sm transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Cột trái: Logo + Thông tin chính */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="size-12 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
            <CompanyLogo logo={app.job?.company?.logo_url} name={app.job?.company?.name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-900 text-sm leading-snug truncate group-hover:text-[#1e3fae] transition-colors max-w-[70%]">
                {app.job?.title || "Vị trí không xác định"}
              </h3>
              <div className="flex-shrink-0">
                <StatusBadge status={app.status} />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate font-medium">{app.job?.company?.name || "Công ty"}</span>
              </div>
              <div className="flex items-center gap-1 border-l border-slate-200 pl-3 text-emerald-600 font-bold">
                <Banknote className="w-3 h-3 flex-shrink-0" />
                <span>{formatSalary(app.job?.salary_min ?? null, app.job?.salary_max ?? null)}</span>
              </div>
              {app.job?.location && (
                <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{app.job.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>Nộp {formatRelativeTime(app.applied_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nút xem chi tiết ở góc phải */}
        <button
          onClick={() => onViewDetail(app.id)}
          className="flex items-center justify-center size-9 rounded-xl bg-slate-50 hover:bg-[#1e3fae]/10 text-slate-500 hover:text-[#1e3fae] transition-all border border-slate-200 shadow-sm flex-shrink-0"
          title="Xem chi tiết"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Hàng dưới: Nút Rút đơn / Xóa đơn (Chỉ hiện nếu có) */}
      {(app.status === "submitted" || app.status === "rejected") && (
        <div className="pt-3 border-t border-slate-50 flex justify-end">
          {app.status === "submitted" && (
            <button
              onClick={() => onWithdraw(app.id)}
              className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Rút đơn 
            </button>
          )}

          {app.status === "rejected" && (
            <button
              onClick={() => onDeleteRejected(app.id)}
              className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa đơn 
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="size-12 rounded-xl bg-slate-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
        <div className="size-9 bg-slate-200 rounded-xl" />
        <div className="h-9 w-24 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await applicationService.getApplications();
      setApplications(Array.isArray(data) ? (data as Application[]) : []);
    } catch { setError("Không thể tải danh sách đơn ứng tuyển. Vui lòng thử lại."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleWithdraw = async (id: string) => {
    if (!confirm("Bạn có chắc muốn rút đơn ứng tuyển này không?")) return;
    try {
      await applicationService.withdrawApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch { alert("Có lỗi xảy ra khi rút đơn. Vui lòng thử lại."); }
  };

  const handleDeleteRejected = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đơn ứng tuyển đã bị từ chối này không?")) return;
    try {
      await applicationService.deleteRejectedApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch { alert("Có lỗi xảy ra khi xóa đơn. Vui lòng thử lại."); }
  };

  const filtered = applications.filter((app) => {
    const matchTab = activeTab === "all" || app.status === activeTab;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || app.job?.title?.toLowerCase().includes(q) ||
      app.job?.company?.name?.toLowerCase().includes(q) || app.job?.location?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const countByStatus = (key: string) =>
    key === "all" ? applications.length : applications.filter((a) => a.status === key).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = [
    { label: "Tổng đơn",  value: applications.length,           icon: <FileText className="w-5 h-5" />,     color: "text-[#1e3fae]",   bg: "bg-[#1e3fae]/10" },
    { label: "Đang xét",  value: countByStatus("under_review"),  icon: <Clock className="w-5 h-5" />,        color: "text-amber-600",   bg: "bg-amber-50" },
    { label: "Phỏng vấn", value: countByStatus("interview"),     icon: <Users className="w-5 h-5" />,        color: "text-purple-600",  bg: "bg-purple-50" },
    { label: "Được nhận", value: countByStatus("accepted"),      icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Đơn ứng tuyển của bạn</h1>
          <p className="text-slate-500 mt-1">Quản lý và theo dõi tiến độ các công việc bạn đã nộp đơn ứng tuyển.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên công việc, công ty..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] transition"
            />
          </div>
          <button onClick={fetchApplications} disabled={loading}
            className="size-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#1e3fae] transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? "bg-[#1e3fae] text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}>
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {countByStatus(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-red-700 mb-1">{error}</p>
            <button onClick={fetchApplications} className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition">Thử lại</button>
          </div>
        ) : loading ? (
          <div className="grid gap-4">{[1,2,3].map((i) => <Skeleton key={i} />)}</div>
        ) : paginated.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-900 font-bold text-lg mb-1">
              {searchQuery ? "Không tìm thấy kết quả" : activeTab === "all" ? "Bạn chưa có đơn ứng tuyển nào" : "Không có đơn trong trạng thái này"}
            </p>
            <p className="text-slate-400 text-sm">
              {searchQuery ? "Thử tìm kiếm với từ khóa khác." : activeTab === "all" ? "Hãy khám phá và ứng tuyển vào các vị trí phù hợp." : "Chuyển sang tab khác để xem thêm."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paginated.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onWithdraw={handleWithdraw}
                  onDeleteRejected={handleDeleteRejected}
                  onViewDetail={setSelectedAppId}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} trong {filtered.length} đơn
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                      className={`size-9 flex items-center justify-center rounded-xl text-sm font-bold transition ${
                        safePage === i + 1 ? "bg-[#1e3fae] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedAppId && (
        <ApplicationDetailModal applicationId={selectedAppId} onClose={() => setSelectedAppId(null)} />
      )}
    </>
  );
}