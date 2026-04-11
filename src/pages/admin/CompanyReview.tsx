import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Building2, Eye, MapPin, Globe } from "lucide-react";
import { adminCompanyService } from "../../services/adminCompany.service";

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

const StatusBadge = ({ status }: { status: Company["status"] }) => {
  const map = {
    pending:  { label: "Chờ duyệt",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "Đã duyệt",   cls: "bg-green-50 text-green-700 border-green-200" },
    rejected: { label: "Từ chối",    cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const s = map[status] ?? map.pending;
  return <span className={`inline-flex text-[10px] font-bold uppercase border px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

// ─── Modal từ chối ───
const RejectModal = ({ company, onConfirm, onClose, loading }: { company: Company, onConfirm: (reason: string) => void, onClose: () => void, loading: boolean }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-black text-lg mb-1">Từ chối công ty</h3>
        <p className="text-slate-500 text-sm mb-4">Nhập lý do cho "{company.name}"</p>
        <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none text-sm resize-none" placeholder="Lý do từ chối..." />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border font-semibold text-sm">Hủy</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading} className="flex-1 h-11 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Drawer Chi tiết ───
const CompanyDrawer = ({ company, onClose, onApprove, onReject, loading }: { company: Company, onClose: () => void, onApprove: () => void, onReject: () => void, loading: boolean }) => (
  <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
    <div className="w-full max-w-xl bg-white h-full flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="p-6 border-b flex justify-between items-start">
        <div className="flex gap-4">
          <div className="size-14 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden bg-slate-50">
            {company.logo_url ? <img src={company.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-slate-300" />}
          </div>
          <div>
            <h2 className="font-black text-lg">{company.name}</h2>
            <StatusBadge status={company.status} />
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><XCircle className="w-5 h-5 text-slate-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Quy mô</p><p className="font-semibold">{company.size || "—"}</p></div>
          <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Năm TL</p><p className="font-semibold">{new Date(company.created_at).getFullYear()}</p></div>
        </div>
        <div>
           <p className="text-slate-500 text-xs font-bold uppercase mb-1">Địa chỉ</p>
           <p className="font-medium flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400"/> {company.address}, {company.city}</p>
        </div>
        {company.website && (
          <div><p className="text-slate-500 text-xs font-bold uppercase mb-1">Website</p><a href={company.website} target="_blank" className="text-blue-600 font-medium flex items-center gap-1"><Globe className="w-4 h-4 text-blue-500"/>{company.website}</a></div>
        )}
        {company.description && (
          <div><p className="text-slate-500 text-xs font-bold uppercase mb-2">Giới thiệu</p><div className="bg-slate-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{company.description}</div></div>
        )}
        {/* Người đại diện */}
        {company.user && (
          <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-xl">
            <p className="font-bold text-blue-900 mb-2">Tài khoản đại diện</p>
            <p className="font-semibold">{company.user.full_name}</p>
            <p className="text-slate-600">{company.user.email} • {company.user.phone}</p>
          </div>
        )}
      </div>
      {company.status === "pending" && (
        <div className="p-5 border-t flex gap-3">
          <button onClick={onReject} disabled={loading} className="flex-1 h-11 border text-red-600 font-bold rounded-xl hover:bg-red-50">Từ chối</button>
          <button onClick={onApprove} disabled={loading} className="flex-1 h-11 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex justify-center items-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Duyệt công ty"}
          </button>
        </div>
      )}
    </div>
  </div>
);

// ─── Trang chính ───
export default function AdminCompanyReview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState<Company | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, isOk: boolean}|null>(null);

  const showT = (msg: string, isOk: boolean) => { setToast({msg, isOk}); setTimeout(()=>setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setCompanies((await adminCompanyService.getAllCompanies(filter === "all" ? undefined : filter)) as Company[]); }
    catch { showT("Lỗi tải danh sách", false); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (c: Company) => {
    setActionLoading(true);
    try {
      await adminCompanyService.reviewCompany(c.id, "approved");
      showT(`Đã duyệt: ${c.name}`, true);
      setSelected(null);
      setCompanies(prev => prev.filter(x => x.id !== c.id));
    } catch { showT("Duyệt thất bại", false); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (c: Company, reason: string) => {
    setActionLoading(true);
    try {
      await adminCompanyService.reviewCompany(c.id, "rejected", reason);
      showT(`Đã từ chối: ${c.name}`, true);
      setShowReject(false);
      setSelected(null);
      setCompanies(prev => prev.filter(x => x.id !== c.id));
    } catch { showT("Từ chối lỗi", false); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="px-6 pb-20">
      {toast && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold flex gap-2 text-white ${toast.isOk ? 'bg-green-600' : 'bg-red-600'}`}><CheckCircle2/>{toast.msg}</div>}
      {showReject && selected && <RejectModal company={selected} loading={actionLoading} onClose={()=>setShowReject(false)} onConfirm={(r)=>handleReject(selected, r)} />}
      {selected && !showReject && <CompanyDrawer company={selected} loading={actionLoading} onClose={()=>setSelected(null)} onApprove={()=>handleApprove(selected)} onReject={()=>setShowReject(true)} />}

      <h1 className="text-2xl font-black mb-1">Duyệt Công Ty</h1>
      <p className="text-slate-500 text-sm mb-6">Xét duyệt xác thực hồ sơ nhà tuyển dụng.</p>

      <div className="flex gap-2 mb-6">
        {[{k: "pending", l: "Chờ duyệt"}, {k: "approved", l: "Đã duyệt"}, {k: "rejected", l: "Từ chối"}, {k: "all", l: "Tất cả"}].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`px-4 py-2 font-bold text-xs rounded-xl ${filter===f.k ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>{f.l}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-slate-800"/></div>
      : companies.length === 0 ? <p className="text-slate-500 text-center p-20 font-bold border rounded-2xl bg-white border-dashed">Không có công ty nào.</p>
      : (
        <div className="bg-white rounded-2xl border shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4">Công ty</th><th className="p-4">Địa điểm</th><th className="p-4">Trạng thái</th><th className="p-4">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded border shrink-0">{c.logo_url && <img src={c.logo_url} className="w-full h-full object-cover"/>}</div>
                    <div>{c.name}<div className="text-xs font-normal text-slate-400 mt-1">{c.user?.email}</div></div>
                  </td>
                  <td className="p-4">{c.city || "—"}</td>
                  <td className="p-4"><StatusBadge status={c.status}/></td>
                  <td className="p-4">
                    <button onClick={()=>setSelected(c)} className="flex items-center gap-1 font-bold text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-100"><Eye className="w-4 h-4"/> Xem</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
