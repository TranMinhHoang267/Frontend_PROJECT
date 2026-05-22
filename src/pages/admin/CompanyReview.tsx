import { useState, useEffect, useCallback } from "react";
import {
  Loader2, CheckCircle2, XCircle, Building2, Eye, MapPin, Globe, Users,
  Star, Gift, Shield, GraduationCap, Coffee, Zap, Heart, Phone, Mail, AlertCircle
} from "lucide-react";
import { adminCompanyService } from "../../services/adminCompany.service";
import { employerService } from "../../services/employer.service";

// ─── Constants for Benefits ──────────────────────────────────────────────────
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
  "bg-orange-100 text-orange-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-600",
  "bg-rose-100 text-rose-600",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-600",
  "bg-pink-100 text-pink-600",
];

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  size: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  user?: { full_name: string; email: string; phone: string };
}

interface BenefitItem {
  icon?: string;
  title?: string;
  desc?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseCompanyDescription = (rawDesc?: string | null) => {
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
};

const getBenefitIcon = (iconKey?: string) => {
  const index = BENEFIT_ICONS.findIndex(item => item.key === iconKey);
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
};

const StatusBadge = ({ status }: { status: Company["status"] }) => {
  const map = {
    pending:  { label: "Chờ duyệt",  cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", dot: "bg-amber-500" },
    approved: { label: "Đã duyệt",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500" },
    rejected: { label: "Từ chối",    cls: "bg-rose-500/10 text-rose-600 border-rose-500/20", dot: "bg-rose-500" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.cls} transition-all duration-300 hover:shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} relative`}>
        {status === 'pending' && <span className={`absolute inset-0 rounded-full ${s.dot} animate-ping opacity-75`} />}
      </span>
      {s.label}
    </span>
  );
};

// ─── Reject Modal ───
const RejectModal = ({
  company,
  onConfirm,
  onClose,
  loading
}: {
  company: Company;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-rose-600" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-xl tracking-tight mb-2">Từ chối doanh nghiệp</h3>
        <p className="text-slate-500 text-sm mb-5 leading-relaxed">
          Bạn đang từ chối doanh nghiệp <span className="font-bold text-slate-800">"{company.name}"</span>. Vui lòng cung cấp lý do để doanh nghiệp cập nhật lại thông tin.
        </p>
        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lý do từ chối <span className="text-rose-500">*</span></label>
           <textarea
             rows={4}
             value={reason}
             onChange={e => setReason(e.target.value)}
             className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-sm resize-none transition-all duration-300"
             placeholder="Ví dụ: Giấy phép kinh doanh không khớp, Logo mờ, thiếu thông tin giới thiệu..."
           />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/20 transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Drawer Chi tiết ───
const CompanyDrawer = ({
  company,
  onClose,
  onApprove,
  onReject,
  loading
}: {
  company: Company;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) => {
  const { intro, culture, benefits } = parseCompanyDescription(company.description);
  const logoUrl = company.logo_url ? employerService.getLogoUrl(company.logo_url) : "";

  return (
    <div className="fixed inset-0 z-40 flex justify-end animate-in fade-in duration-300" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" />
      <div
        className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0 shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-slate-350" />
              )}
            </div>
            <div className="space-y-1">
              <StatusBadge status={company.status} />
              <h2 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight mt-1">{company.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth text-sm text-slate-700">
          {/* General Grid */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Tổng quan doanh nghiệp</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Quy mô</p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400"/> {company.size || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Năm Thành Lập</p>
                <p className="font-bold text-slate-800">{company.created_at ? new Date(company.created_at).getFullYear() : "—"}</p>
              </div>
            </div>

            <div className="border-t border-slate-200/60 my-2"></div>

            <div className="space-y-3">
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase mb-1">Địa chỉ</p>
                 <p className="font-semibold text-slate-800 flex items-start gap-1.5 leading-relaxed">
                   <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/>
                   <span>{company.address ? `${company.address}${company.city ? `, ${company.city}` : ''}` : "Chưa cập nhật"}</span>
                 </p>
              </div>
              {company.website && (
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Website</p>
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-[#1e3fae] hover:underline font-bold flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#1e3fae] shrink-0"/>
                    <span className="truncate">{company.website}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Parsed Descriptions */}
          {intro && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Giới thiệu công ty</h4>
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 leading-relaxed text-slate-600 whitespace-pre-line">
                {intro}
              </div>
            </div>
          )}

          {culture && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Văn hóa doanh nghiệp</h4>
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 leading-relaxed text-slate-600 whitespace-pre-line">
                {culture}
              </div>
            </div>
          )}

          {benefits && benefits.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Phúc lợi đãi ngộ</h4>
              <div className="grid grid-cols-1 gap-3">
                {benefits.map((b, idx) => {
                  const { Icon, colorClass } = getBenefitIcon(b.icon);
                  return (
                    <div key={idx} className="flex gap-3 p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow transition-shadow">
                      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm leading-snug">{b.title}</h5>
                        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tài khoản đại diện */}
          {company.user && (
            <div className="border border-blue-100 bg-[#1e3fae]/5 p-5 rounded-2xl space-y-3">
              <p className="font-extrabold text-[#1e3fae] text-xs uppercase tracking-wider">Tài khoản đại diện</p>
              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-base">{company.user.full_name}</p>
                <div className="space-y-1 text-slate-500 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{company.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{company.user.phone || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason display */}
          {company.rejection_reason && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm mt-4 animate-in fade-in duration-300">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                Lý do từ chối trước đó
              </h3>
              <p className="text-sm text-rose-800 leading-relaxed font-medium">{company.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {company.status === "pending" && (
          <div className="p-5 border-t border-slate-100 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] flex gap-3 sticky bottom-0 z-10 backdrop-blur-xl">
            <button
              onClick={onReject}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-rose-50 disabled:hover:text-rose-600"
            >
              Từ chối
            </button>
            <button
              onClick={onApprove}
              disabled={loading}
              className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shadow-emerald-500/25 disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
              Duyệt doanh nghiệp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Trang chính ───
export default function AdminCompanyReview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState<Company | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, isOk: boolean}|null>(null);

  const showT = (msg: string, isOk: boolean) => {
    setToast({msg, isOk});
    setTimeout(()=>setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCompanyService.getAllCompanies(filter === "all" ? undefined : filter);
      setCompanies((data) as Company[]);
    } catch {
      showT("Lỗi tải danh sách", false);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (c: Company) => {
    setActionLoading(true);
    try {
      await adminCompanyService.reviewCompany(c.id, "approved");
      showT(`Đã duyệt thành công công ty: ${c.name}`, true);
      setSelected(null);
      setCompanies(prev => prev.filter(x => x.id !== c.id));
    } catch {
      showT("Duyệt thất bại", false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (c: Company, reason: string) => {
    setActionLoading(true);
    try {
      await adminCompanyService.reviewCompany(c.id, "rejected", reason);
      showT(`Đã từ chối công ty: ${c.name}`, true);
      setShowReject(false);
      setSelected(null);
      setCompanies(prev => prev.filter(x => x.id !== c.id));
    } catch {
      showT("Từ chối thất bại", false);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = companies.filter(c => c.status === "pending").length;

  return (
    <div className="min-h-full max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 duration-300 ${toast.isOk ? "bg-emerald-600 text-white shadow-emerald-600/20" : "bg-rose-600 text-white shadow-rose-600/20"}`}>
          {toast.isOk ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {showReject && selected && (
        <RejectModal
          company={selected}
          loading={actionLoading}
          onClose={()=>setShowReject(false)}
          onConfirm={(r)=>handleReject(selected, r)}
        />
      )}

      {selected && !showReject && (
        <CompanyDrawer
          company={selected}
          loading={actionLoading}
          onClose={()=>setSelected(null)}
          onApprove={()=>handleApprove(selected)}
          onReject={()=>setShowReject(true)}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1e3fae]/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1e3fae]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Duyệt Công Ty</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm pl-12">Xét duyệt xác thực hồ sơ thông tin nhà tuyển dụng đăng ký mới.</p>
        </div>
      </div>

      {/* ── Filter + Search Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-slate-100/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto hide-scrollbar">
          {[
            { k: "pending", l: "Chờ duyệt", count: filter === "all" ? companies.filter(c=>c.status==='pending').length : null },
            { k: "approved", l: "Đã duyệt" },
            { k: "rejected", l: "Từ chối" },
            { k: "all", l: "Tất cả" }
          ].map(f => {
            const active = filter === f.k;
            return (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${active ? "bg-white text-[#1e3fae] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                {f.l}
                {f.k === 'pending' && pendingCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-[#1e3fae]/15 text-[#1e3fae]" : "bg-slate-200 text-slate-600"}`}>{pendingCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Company List Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="relative w-16 h-16 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-[#1e3fae]/10 rounded-full animate-ping opacity-50" />
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3fae] relative z-10" />
          </div>
          <p className="font-bold text-slate-500">Đang tải danh sách...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-slate-350" />
          </div>
          <p className="font-extrabold text-slate-700 text-lg">Trống rỗng!</p>
          <p className="text-slate-400 font-medium mt-1">Không tìm thấy công ty nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest min-w-[250px]">Doanh nghiệp</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Thành phố</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map(c => {
                  const companyLogo = c.logo_url ? employerService.getLogoUrl(c.logo_url) : "";
                  return (
                    <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
                            {companyLogo ? (
                              <img src={companyLogo} alt="Logo" className="w-full h-full object-cover"/>
                            ) : (
                              <Building2 className="w-5 h-5 text-slate-400"/>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-[#1e3fae] transition-colors leading-tight mb-0.5 text-base">{c.name}</p>
                            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 mt-1">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold border border-slate-200/60">{c.user?.full_name ?? "Chưa rõ đại diện"}</span>
                              <span>•</span>
                              <span>{c.user?.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-slate-600">{c.city || "—"}</span>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={c.status}/>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={()=>setSelected(c)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#1e3fae] hover:border-[#1e3fae]/30 transition-all shadow-sm"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
