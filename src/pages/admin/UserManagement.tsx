import { useState, useEffect, useCallback } from "react";
import {
  Users, Search, Loader2, Lock, Unlock, Trash2,
  CheckCircle2, XCircle, UserCheck, UserX, Mail,
  Phone, Shield, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { adminUserService, type UserItem } from "../../services/adminUser.service";
import { avatarService } from "../../services/avatar.service";
// ─── Helpers ─────────────────────────────────────────────────────────────────
const ROLE_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  candidate: { label: "Ứng viên",    cls: "bg-sky-500/10 text-sky-600 border-sky-500/20",    dot: "bg-sky-500" },
  recruiter: { label: "Nhà tuyển dụng", cls: "bg-violet-500/10 text-violet-600 border-violet-500/20", dot: "bg-violet-500" },
  admin:     { label: "Quản trị viên", cls: "bg-[#1e3fae]/10 text-[#1e3fae] border-[#1e3fae]/20", dot: "bg-[#1e3fae]" },
};

const RoleBadge = ({ role }: { role: string }) => {
  const r = ROLE_MAP[role] ?? ROLE_MAP.candidate;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
    {isActive ? "Đang hoạt động" : "Đã bị khóa"}
  </span>
);

// ─── User Detail Drawer ───────────────────────────────────────────────────────
const UserDrawer = ({
  user,
  onClose,
  onToggleLock,
  onDelete,
  loading,
}: {
  user: UserItem;
  onClose: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  loading: boolean;
}) => {
  const initials = user.fullName?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?";
  const avatarColors = ["from-violet-500 to-indigo-600", "from-sky-500 to-blue-600", "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600"];
  const colorIdx = user.id.charCodeAt(0) % avatarColors.length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end animate-in fade-in duration-300" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex gap-4 items-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0`}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : initials}
            </div>
            <div className="space-y-1">
              <h2 className="font-extrabold text-slate-900 text-lg leading-tight">{user.fullName}</h2>
              <div className="flex flex-wrap gap-1.5">
                <RoleBadge role={user.role} />
                <StatusBadge isActive={user.isActive} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors shrink-0">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact Info */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Thông tin liên hệ</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#1e3fae]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-slate-800 break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Số điện thoại</p>
                  <p className="font-semibold text-slate-800">{user.phone || "Chưa cập nhật"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vai trò hệ thống</p>
                  <p className="font-semibold text-slate-800">{ROLE_MAP[user.role]?.label ?? user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày tham gia</p>
              <p className="font-bold text-slate-800 text-sm">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{new Date(user.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cập nhật lần cuối</p>
              <p className="font-bold text-slate-800 text-sm">{new Date(user.updatedAt).toLocaleDateString("vi-VN")}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{new Date(user.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          {/* User ID */}
          <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Người dùng</p>
            <p className="font-mono text-xs text-slate-500 break-all">{user.id}</p>
          </div>
        </div>

        {/* Footer Actions */}
        {user.role !== "admin" && (
          <div className="p-5 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white backdrop-blur-xl">
            <button
              onClick={onToggleLock}
              disabled={loading}
              className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                user.isActive
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 hover:border-amber-600"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {user.isActive ? "Khóa tài khoản" : "Mở khóa"}
            </button>
            <button
              onClick={onDelete}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 border border-rose-200 hover:border-rose-600 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Xóa vĩnh viễn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ user, onConfirm, onClose, loading }: { user: UserItem; onConfirm: () => void; onClose: () => void; loading: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
        <Trash2 className="w-6 h-6 text-rose-600" />
      </div>
      <h3 className="font-extrabold text-slate-900 text-xl mb-2">Xóa tài khoản</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        Bạn đang xóa vĩnh viễn tài khoản của <span className="font-bold text-slate-800">{user.fullName}</span>. Hành động này không thể hoàn tác.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">Hủy</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 h-11 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa ngay"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.is_active = statusFilter;
      if (search.trim()) params.keyword = search.trim();
      const res = await adminUserService.getAllUsers(params as never);
      setUsers(res.users);
      setTotalPages(res.total_pages);
      setTotalItems(res.total_items);
    } catch {
      showToast("err", "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, page]);

  useEffect(() => {
    const t = setTimeout(loadUsers, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const handleToggleLock = async (user: UserItem) => {
    setActionLoading(true);
    try {
      const res = await adminUserService.toggleLock(user.id);
      showToast("ok", res.message || (user.isActive ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản."));
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    } catch {
      showToast("err", "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (user: UserItem) => {
    setActionLoading(true);
    try {
      await adminUserService.deleteUser(user.id);
      showToast("ok", `Đã xóa tài khoản: ${user.fullName}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setShowDelete(false);
      setSelectedUser(null);
    } catch {
      showToast("err", "Xóa thất bại. Tài khoản có thể đang được bảo vệ.");
    } finally {
      setActionLoading(false);
    }
  };

  const initials = (name: string) => name?.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?";
  const avatarColors = ["from-violet-500 to-indigo-600", "from-sky-500 to-blue-600", "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600", "from-amber-500 to-orange-500"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 duration-300 ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {selectedUser && !showDelete && (
        <UserDrawer
          user={selectedUser}
          loading={actionLoading}
          onClose={() => setSelectedUser(null)}
          onToggleLock={() => handleToggleLock(selectedUser)}
          onDelete={() => setShowDelete(true)}
        />
      )}
      {showDelete && selectedUser && (
        <DeleteModal
          user={selectedUser}
          loading={actionLoading}
          onClose={() => setShowDelete(false)}
          onConfirm={() => handleDelete(selectedUser)}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1e3fae]/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1e3fae]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Quản lý Người dùng</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm pl-12">Xem, khóa hoặc xóa tài khoản trên hệ thống.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm shrink-0">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">{totalItems.toLocaleString("vi-VN")} tài khoản</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Role Tabs */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            {[
              { key: "all", label: "Tất cả", icon: Users },
              { key: "candidate", label: "Ứng viên", icon: UserCheck },
              { key: "recruiter", label: "Nhà tuyển dụng", icon: UserX },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => { setRoleFilter(f.key); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${roleFilter === f.key ? "bg-white text-[#1e3fae] shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-10 pl-8 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none appearance-none cursor-pointer"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã bị khóa</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative group flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1e3fae] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tên, email, số điện thoại..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#1e3fae]/10 focus:border-[#1e3fae] outline-none text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="relative w-14 h-14 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-[#1e3fae]/10 rounded-full animate-ping opacity-50" />
            <Loader2 className="w-7 h-7 animate-spin text-[#1e3fae] relative z-10" />
          </div>
          <p className="font-bold text-slate-500">Đang tải danh sách người dùng...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-extrabold text-slate-700 text-lg">Không tìm thấy!</p>
          <p className="text-slate-400 font-medium mt-1 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest min-w-[220px]">Người dùng</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest hidden md:table-cell">Email</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Vai trò</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Ngày tham gia</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const colorIdx = user.id.charCodeAt(0) % avatarColors.length;
                  return (
                    <tr
                      key={user.id}
                      className="group hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[colorIdx]} items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm overflow-hidden`}>
                            {user.avatarUrl ? <img src={avatarService.toAbsUrl(user.avatarUrl)} alt={user.fullName} className="w-full h-full object-cover" /> : initials(user.fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-[#1e3fae] transition-colors leading-tight">{user.fullName}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5 md:hidden truncate max-w-[160px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-slate-600 font-medium text-sm">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-slate-500 font-medium text-sm">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {user.role !== "admin" && (
                            <>
                              <button
                                title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                onClick={() => handleToggleLock(user)}
                                disabled={actionLoading}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all shadow-sm disabled:opacity-50 ${user.isActive ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"}`}
                              >
                                {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                title="Xóa tài khoản"
                                onClick={() => { setSelectedUser(user); setShowDelete(true); }}
                                disabled={actionLoading}
                                className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-sm text-slate-500 font-medium">
                Trang <span className="font-bold text-slate-800">{page}</span> / <span className="font-bold text-slate-800">{totalPages}</span>
                <span className="ml-2 text-slate-400">({totalItems.toLocaleString("vi-VN")} tài khoản)</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${pg === page ? "bg-[#1e3fae] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
