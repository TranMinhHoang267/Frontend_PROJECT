import { useState, useEffect } from "react";
import { Users, Briefcase, FileText, TrendingUp, RefreshCw, Loader2, ArrowUpRight } from "lucide-react";
import {
  adminReportService,
  type SystemStats,
  type GrowthDataPoint,
  type MonthlyApplications,
  type JobsByType,
  type JobsByLevel,
} from "../../services/adminReport.service";

// ─── Color palettes ───────────────────────────────────────────────────────────
const TYPE_COLORS  = ["#1e3fae", "#38bdf8", "#a855f7", "#f43f5e", "#10b981", "#f59e0b"];
const LEVEL_COLORS = ["#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#38bdf8", "#1e3fae"];

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
interface DonutSlice { label: string; value: number; color: string }

function DonutChart({ slices, centerLabel, centerSub }: { slices: DonutSlice[]; centerLabel: string; centerSub?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  const strokeWidth = 20;

  // Compute cumulative offsets without mutation (fixes react-hooks/immutability)
  const paths = slices.map((slice, idx) => {
    const pct = slice.value / total;
    const cumulativeOffset = slices.slice(0, idx).reduce((sum, s) => sum + s.value / total, 0);
    const dashArray = `${pct * circumference} ${circumference}`;
    const dashOffset = -cumulativeOffset * circumference;
    return { ...slice, dashArray, dashOffset, pct, idx };
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* SVG */}
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {paths.map((p) => (
            <circle
              key={p.idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={hovered === p.idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={p.dashArray}
              strokeDashoffset={p.dashOffset}
              strokeLinecap="round"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: `${cx}px ${cy}px`,
                transition: "stroke-width 0.2s ease",
                cursor: "pointer",
                opacity: hovered !== null && hovered !== p.idx ? 0.5 : 1,
              }}
              onMouseEnter={() => setHovered(p.idx)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="15" fontWeight="800" fill="#1e293b">
            {hovered !== null ? `${Math.round(paths[hovered].pct * 100)}%` : centerLabel}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">
            {hovered !== null ? paths[hovered].label : (centerSub ?? "")}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2 flex-1 min-w-[120px]">
        {slices.map((s, idx) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 cursor-default"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className={`text-xs font-semibold transition-colors ${hovered === idx ? "text-slate-900" : "text-slate-600"}`}>
                  {s.label || "Không rõ"}
                </span>
              </div>
              <span className="text-xs font-extrabold text-slate-700">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SVG Line/Area Chart ─────────────────────────────────────────────────────
function LineAreaChart({ data }: { data: GrowthDataPoint[] }) {
  // Hooks must be at the top — before any conditional return
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);

  const formatMonth = (m: string) => { const [, mo] = m.split("-"); return `T${parseInt(mo)}`; };

  if (data.length === 0) return <div className="h-44 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>;

  const W = 520, H = 140, PAD = { top: 10, right: 12, bottom: 30, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // totals: backend returns `candidate` and `recruiter` (not candidates/recruiters)
  const totals = data.map(d => (d.candidate ?? 0) + (d.recruiter ?? 0));
  const maxVal = Math.max(...totals, 1);

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yOf = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  // Smooth bezier path
  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf((d.candidate ?? 0) + (d.recruiter ?? 0)) }));
  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    pathD += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.top + chartH} L ${pts[0].x} ${PAD.top + chartH} Z`;

  // y-axis grid lines
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "320px" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3fae" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1e3fae" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={PAD.top + chartH * (1 - t)}
              x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - t)}
              stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"
            />
            {t > 0 && (
              <text x={PAD.left - 4} y={PAD.top + chartH * (1 - t) + 4}
                textAnchor="end" fontSize="8" fill="#94a3b8" fontWeight="600">
                {Math.round(maxVal * t)}
              </text>
            )}
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#1e3fae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points & tooltips */}
        {pts.map((pt, idx) => (
          <g key={idx} onMouseEnter={() => setTooltip({ idx })} onMouseLeave={() => setTooltip(null)} style={{ cursor: "pointer" }}>
            <circle cx={pt.x} cy={pt.y} r="6" fill="transparent" />
            {tooltip?.idx === idx && (
              <>
                <circle cx={pt.x} cy={pt.y} r="4" fill="#1e3fae" stroke="white" strokeWidth="2" />
                <rect x={pt.x - 28} y={pt.y - 28} width="56" height="20" rx="4" fill="#1e293b" />
                <text x={pt.x} y={pt.y - 14} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
                  {totals[idx].toLocaleString("vi-VN")} người
                </text>
              </>
            )}
            {tooltip?.idx !== idx && <circle cx={pt.x} cy={pt.y} r="2.5" fill="#1e3fae" />}
            <text x={pt.x} y={PAD.top + chartH + 16} textAnchor="middle" fontSize="8.5" fill="#94a3b8" fontWeight="600">
              {formatMonth(data[idx].month)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── SVG Bar Chart — Premium Edition ─────────────────────────────────────────
function BarChart({ data }: { data: MonthlyApplications[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const formatMonth = (m: string) => { const [, mo] = m.split("-"); return `T${parseInt(mo)}`; };

  if (data.length === 0) return (
    <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
      <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V21h4.5v-7.5H3zM9.75 9V21h4.5V9h-4.5zM16.5 3.75V21H21V3.75h-4.5z" />
      </svg>
      Chưa có dữ liệu ứng tuyển
    </div>
  );

  const W = 540, H = 160, PAD = { top: 16, right: 16, bottom: 34, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const barGroupW = chartW / data.length;
  const barW = Math.min(Math.max(10, barGroupW * 0.55), 42);

  // y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "320px" }}>
        <defs>
          {/* Gradient total bar */}
          <linearGradient id="barGradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#1e3fae" />
          </linearGradient>
          {/* Gradient accepted */}
          <linearGradient id="barGradAccepted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          {/* Gradient pending */}
          <linearGradient id="barGradPending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="barGlow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Background horizontal grid */}
        {yTicks.map((t, i) => {
          const y = PAD.top + chartH * (1 - t);
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke={t === 0 ? "#cbd5e1" : "#e2e8f0"} strokeWidth={t === 0 ? 1.5 : 1}
                strokeDasharray={t === 0 ? "none" : "4 4"}
              />
              {t > 0 && (
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="8.5" fill="#94a3b8" fontWeight="600">
                  {Math.round(maxVal * t)}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, idx) => {
          const cx = PAD.left + (idx + 0.5) * barGroupW;
          const x = cx - barW / 2;
          const isHovered = tooltip?.idx === idx;

          const totalH  = Math.max((d.total    / maxVal) * chartH, d.total    > 0 ? 4 : 0);
          const accH    = Math.max((d.accepted  / maxVal) * chartH, d.accepted  > 0 ? 3 : 0);
          const pendH   = Math.max(((d.total - d.accepted - d.rejected) / maxVal) * chartH, 0);

          const yTotal  = PAD.top + chartH - totalH;
          const yBottom = PAD.top + chartH;

          return (
            <g
              key={idx}
              onMouseEnter={() => setTooltip({ idx })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Total bar (background — full height) */}
              <rect
                x={x} y={yTotal} width={barW} height={totalH}
                rx="5" ry="5"
                fill={isHovered ? "url(#barGradTotal)" : "#c7d2fe"}
                filter={isHovered ? "url(#barGlow)" : undefined}
                style={{ transition: "fill 0.2s, filter 0.2s" }}
              />

              {/* Accepted segment (bottom portion, green) */}
              {accH > 0 && (
                <rect
                  x={x} y={yBottom - accH} width={barW} height={accH}
                  rx="4" ry="4"
                  fill="url(#barGradAccepted)"
                  opacity={isHovered ? 1 : 0.85}
                  style={{ transition: "opacity 0.2s" }}
                />
              )}

              {/* Pending segment (above accepted, amber) */}
              {pendH > 0 && accH > 0 && (
                <rect
                  x={x} y={yBottom - accH - pendH} width={barW} height={pendH}
                  fill="url(#barGradPending)"
                  opacity={isHovered ? 0.9 : 0.65}
                  style={{ transition: "opacity 0.2s" }}
                />
              )}

              {/* Value label on top of bar */}
              {totalH > 14 && (
                <text
                  x={cx} y={yTotal - 5}
                  textAnchor="middle" fontSize="8" fill={isHovered ? "#1e3fae" : "#94a3b8"}
                  fontWeight="800"
                  style={{ transition: "fill 0.2s" }}
                >
                  {d.total}
                </text>
              )}

              {/* Month label */}
              <text
                x={cx} y={PAD.top + chartH + 18}
                textAnchor="middle" fontSize="9" fill={isHovered ? "#1e3fae" : "#94a3b8"}
                fontWeight={isHovered ? "800" : "600"}
                style={{ transition: "fill 0.2s" }}
              >
                {formatMonth(d.month)}
              </text>

              {/* Rich Tooltip */}
              {isHovered && (
                <g>
                  {/* Tooltip box */}
                  <rect
                    x={cx - 46} y={yTotal - 68} width="92" height="60"
                    rx="8" fill="#1e293b"
                    style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                  />
                  {/* Arrow */}
                  <polygon
                    points={`${cx - 6},${yTotal - 8} ${cx + 6},${yTotal - 8} ${cx},${yTotal - 2}`}
                    fill="#1e293b"
                  />
                  {/* Total */}
                  <text x={cx} y={yTotal - 50} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
                    Tổng: {d.total.toLocaleString("vi-VN")}
                  </text>
                  {/* Accepted */}
                  <circle cx={cx - 28} cy={yTotal - 36} r="3" fill="#34d399" />
                  <text x={cx - 22} y={yTotal - 33} fontSize="8.5" fill="#d1fae5" fontWeight="700">
                    {d.accepted} chấp nhận
                  </text>
                  {/* Rejected */}
                  <circle cx={cx - 28} cy={yTotal - 22} r="3" fill="#f87171" />
                  <text x={cx - 22} y={yTotal - 19} fontSize="8.5" fill="#fecaca" fontWeight="700">
                    {d.rejected} từ chối
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 px-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block border border-indigo-300" />Tổng đơn
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Chấp nhận
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Đang chờ
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" />Từ chối
        </span>
      </div>
    </div>
  );
}


// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, trend, color, bg }: {
  label: string; value: number | string; icon: React.ElementType;
  trend?: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900">
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </h3>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [growth, setGrowth] = useState<GrowthDataPoint[]>([]);
  const [applications, setApplications] = useState<MonthlyApplications[]>([]);
  const [jobsByType, setJobsByType] = useState<JobsByType[]>([]);
  const [jobsByLevel, setJobsByLevel] = useState<JobsByLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, g, a, jt, jl] = await Promise.all([
        adminReportService.getSystemStats(),
        adminReportService.getUserGrowth(),
        adminReportService.getApplicationsByMonth(),
        adminReportService.getJobsByType(),
        adminReportService.getJobsByLevel(),
      ]);
      setStats(s);
      setGrowth(Array.isArray(g) ? g : []);
      setApplications(Array.isArray(a) ? a : []);
      setJobsByType(Array.isArray(jt) ? jt : []);
      setJobsByLevel(Array.isArray(jl) ? jl : []);
    } catch (e) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="relative w-14 h-14 mb-5">
          <div className="absolute inset-0 bg-[#1e3fae]/10 rounded-full animate-ping opacity-60" />
          <Loader2 className="w-14 h-14 animate-spin text-[#1e3fae] relative" />
        </div>
        <p className="font-bold text-slate-500">Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  // Build donut slices — backend returns `jobType` and `jobLevel` (not `type`/`level`)
  const typeSlices: DonutSlice[] = jobsByType.map((d, i) => ({
    label: d.jobType || "Khác",
    value: d.count,
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }));

  const levelSlices: DonutSlice[] = jobsByLevel.map((d, i) => ({
    label: d.jobLevel || "Khác",
    value: d.count,
    color: LEVEL_COLORS[i % LEVEL_COLORS.length],
  }));

  const totalJobs = jobsByType.reduce((s, d) => s + d.count, 0);
  // success_rate comes as a string like "42%" from backend
  const successRate = stats?.applications?.success_rate ?? "—";

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1e3fae]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1e3fae]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Báo cáo & Thống kê</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm pl-12">Số liệu tổng quan và xu hướng hoạt động của hệ thống.</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-[#1e3fae]/30 transition-all shadow-sm disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* ── Stat Cards ── */}
      {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tổng Người dùng" value={stats.users?.total ?? 0} icon={Users}
            trend="12%" color="text-[#1e3fae]" bg="bg-[#1e3fae]/10" />
          <StatCard label="Tổng Công ty" value={stats.companies?.total ?? 0} icon={Briefcase}
            trend="5%" color="text-violet-600" bg="bg-violet-50" />
          <StatCard label="Tổng Việc làm" value={stats.jobs?.total ?? 0} icon={FileText}
            trend="8%" color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Tổng Đơn ứng tuyển" value={stats.applications?.total ?? 0} icon={TrendingUp}
            trend="15%" color="text-amber-600" bg="bg-amber-50" />
        </div>
      )}

      {/* ── Charts Row 1: Growth + Applications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth — Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Tăng trưởng Người dùng (12 tháng gần nhất)</h3>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Tổng ứng viên + nhà tuyển dụng mới</p>
            </div>
            <span className="text-[11px] font-bold text-[#1e3fae] bg-[#1e3fae]/10 px-2.5 py-1 rounded-lg">
              Năm {new Date().getFullYear()}
            </span>
          </div>
          <LineAreaChart data={growth.slice(-12)} />
          {/* Legend */}
          <div className="flex items-center gap-5 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />Ứng viên
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-600">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />Nhà tuyển dụng
            </span>
          </div>
        </div>

        {/* Applications — Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Lượng đơn ứng tuyển theo tháng</h3>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Số CV nộp vào mỗi tháng</p>
            </div>
            <a href="#" className="text-xs font-bold text-[#1e3fae] hover:underline">Xem chi tiết</a>
          </div>
          <BarChart data={applications.slice(-12)} />
        </div>
      </div>

      {/* ── Charts Row 2: Donut Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Type — Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Phân bổ Việc làm theo Hình thức</h3>
            <p className="text-slate-400 text-xs font-medium mt-0.5">Full-time, Part-time, Remote, Internship...</p>
          </div>
          {typeSlices.length > 0 ? (
            <DonutChart
              slices={typeSlices}
              centerLabel={totalJobs.toLocaleString("vi-VN")}
              centerSub="VIỆC LÀM"
            />
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Jobs by Level — Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Phân bổ Việc làm theo Cấp độ</h3>
            <p className="text-slate-400 text-xs font-medium mt-0.5">Intern, Junior, Senior, Manager...</p>
          </div>
          {levelSlices.length > 0 ? (
            <DonutChart
              slices={levelSlices}
              centerLabel={successRate}
              centerSub="CƠ CẤU"
            />
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 font-medium pb-4">
        © {new Date().getFullYear()} RecruitHub. Mọi quyền được bảo lưu. Thiết kế cho sự chuyên nghiệp và tối giản.
      </p>
    </div>
  );
}
