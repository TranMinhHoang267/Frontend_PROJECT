import { useState, useEffect, useRef } from "react";
import {
  Building2, Users, MapPin, Search, X, Pencil, Mail, Phone, Globe, Info, ImagePlus,
  Loader2, CheckCircle2, Heart, Gift, Shield, GraduationCap, Coffee, Star, Zap, Plus, Trash2
} from "lucide-react";
import { employerService, type CompanyProfileData, type UpdateCompanyPayload } from "../../services/employer.service";

// Separators lưu nhiều phần trong 1 field `description`
const CULTURE_SEP  = "\n\n---CULTURE---\n\n";
const BENEFITS_SEP = "\n\n---BENEFITS---\n\n";

// Danh sách icon phúc lợi có thể chọn
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
  "bg-orange-200 text-orange-600",
  "bg-blue-200 text-blue-600",
  "bg-emerald-200 text-emerald-700",
  "bg-purple-200 text-purple-600",
  "bg-rose-200 text-rose-600",
  "bg-amber-200 text-amber-700",
  "bg-sky-200 text-sky-600",
  "bg-pink-200 text-pink-600",
];

interface Benefit {
  icon: string;    // key của BENEFIT_ICONS
  title: string;
  desc: string;
}

function parseBenefits(raw: string): Benefit[] {
  try { return JSON.parse(raw); } catch { return []; }
}
function serializeBenefits(b: Benefit[]): string {
  return JSON.stringify(b);
}
function getIconComp(key: string) {
  return BENEFIT_ICONS.find(i => i.key === key)?.Icon ?? Gift;
}

export default function CompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateCompanyPayload>({});
  const [cultureText, setCultureText] = useState("");
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [newBenefit, setNewBenefit] = useState<Benefit>({ icon: "gift", title: "", desc: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await employerService.getProfile();
      setProfile(data);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 404) {
        setErrorStatus(404);
      } else {
        console.error("Lỗi lấy thông tin công ty:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };


  {/* Upload logo */}

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const res = await employerService.updateLogo(file);
      setProfile(prev => prev ? { ...prev, logo_url: res.logo_url } : null);
      alert("Cập nhật logo thành công!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(msg || "Lỗi cập nhật logo.");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete logo 

  // --- BỔ SUNG HÀM XÓA LOGO TẠI ĐÂY ---
  const handleDeleteLogo = async () => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa logo không?");
    if (!confirmDelete) return;

    try {
      setIsDeletingLogo(true);
      // Giả sử employerService có hàm deleteLogo()
      await employerService.deleteLogo(); 
      
      // Cập nhật lại state profile, set logo_url về null hoặc rỗng
      setProfile(prev => prev ? { ...prev, logo_url: null } : null);
      alert("Xóa logo thành công!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(msg || "Lỗi khi xóa logo.");
    } finally {
      setIsDeletingLogo(false);
    }
  };
  

  const openEditModal = () => {
    if (profile) {
      const raw = profile.description || "";

      // Tách 3 phần: intro | culture | benefits
      const benefitsIdx = raw.indexOf(BENEFITS_SEP);
      const beforeBenefits = benefitsIdx >= 0 ? raw.slice(0, benefitsIdx)  : raw;
      const benefitsRaw    = benefitsIdx >= 0 ? raw.slice(benefitsIdx + BENEFITS_SEP.length) : "";

      const cultureIdx = beforeBenefits.indexOf(CULTURE_SEP);
      const intro   = cultureIdx >= 0 ? beforeBenefits.slice(0, cultureIdx) : beforeBenefits;
      const culture = cultureIdx >= 0 ? beforeBenefits.slice(cultureIdx + CULTURE_SEP.length) : "";

      setFormData({ name: profile.name || "", description: intro, website: profile.website || "", address: profile.address || "", city: profile.city || "", size: profile.size || "" });
      setCultureText(culture);
      setBenefits(parseBenefits(benefitsRaw));
      setNewBenefit({ icon: "gift", title: "", desc: "" });
      setIsEditing(true);
    }
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      // Ghép intro + văn hóa + phúc lợi
      let combined = (formData.description || "").trimEnd();
      if (cultureText.trim()) combined += CULTURE_SEP + cultureText.trim();
      if (benefits.length > 0) combined += BENEFITS_SEP + serializeBenefits(benefits);

      const updated = await employerService.updateProfile({ ...formData, description: combined });
      setProfile(updated);
      setIsEditing(false);
      alert("Cập nhật hồ sơ công ty thành công!");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(msg || "Lỗi khi cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 py-40">
        <Loader2 className="w-10 h-10 text-[#f97316] animate-spin" />
      </div>
    );
  }

  if (errorStatus === 404 || !profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Chưa có hồ sơ công ty</h2>
        <p className="mt-2 text-sm">Hồ sơ công ty của bạn chưa được tạo hoặc chưa liên kết.</p>
        <p className="mt-1 text-xs">Vui lòng liên hệ Admin.</p>
      </div>
    );
  }

  const logoUrl = employerService.getLogoUrl(profile.logo_url);
  const statusColor = profile.status === 'approved' ? 'bg-green-100 text-green-700' :
                      profile.status === 'pending'  ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const statusLabel  = profile.status === 'approved' ? 'Đã duyệt' :
                       profile.status === 'pending'  ? 'Chờ duyệt' : 'Bị từ chối';

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6 bg-slate-50 min-h-full">
      
      {/* ===== HEADER BANNER ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Abstract Banner Cover */}
        <div className="h-40 bg-[#ebdcd4] relative">
          <button onClick={() => fileInputRef.current?.click()} className="absolute top-4 right-4 bg-white/50 hover:bg-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
            <ImagePlus className="w-4 h-4" /> Đổi ảnh bìa
          </button>
        </div>

        {/* Company Info row */}
        <div className="px-8 pb-8 relative flex items-start justify-between">
          
          <div className="flex gap-6 items-start">

            {/* Logo */}
            <div className="relative -mt-16 w-32 h-32 group">
              <div 
                className="relative w-full h-full bg-slate-900 border-4 border-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg cursor-pointer" 
                onClick={() => !isUploadingLogo && !isDeletingLogo && fileInputRef.current?.click()} // Chỉ cho click khi không bận
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={profile.name} className="w-full h-full object-cover group-hover:opacity-75 transition" />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-400" />
                )}
                
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                
                {/* Lớp overlay nhẹ khi hover */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition z-0" />
              </div>

              {/* Nhóm các nút hành động: Nằm ở góc dưới phải, chỉ hiện khi hover */}
              <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition z-10">
                {/* Nút Đổi Logo (Màu trắng) */}
                {!isUploadingLogo && !isDeletingLogo && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-lg shadow-md transition"
                    title="Đổi Logo"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                )}

                {/* Nút Xóa Logo (Màu trắng, Icon đỏ) */}
                {logoUrl && !isUploadingLogo && !isDeletingLogo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn sự kiện click truyền lên thẻ cha (div bao ngoài)
                      handleDeleteLogo();
                    }}
                    className="bg-white/90 hover:bg-red-50 text-red-500 p-1.5 rounded-lg shadow-md transition"
                    title="Xóa logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Loading khi đang xóa */}
                {isDeletingLogo && (
                  <div className="bg-white/90 p-1.5 rounded-lg shadow-md z-10">
                    <Loader2 className="w-4 h-4 text-[#f97316] animate-spin" />
                  </div>
                )}
              </div>

              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            {/* End Logo */}

            <div className="mt-3">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{profile.name}</h1>
                <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              {/* Rejection reason */}
              {profile.status === 'rejected' && profile.rejection_reason && (
                <div className="mb-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-xl">
                  <span className="font-bold flex-shrink-0">Lý do từ chối:</span>
                  <span>{profile.rejection_reason}</span>
                </div>
              )}

              <div className="flex items-center gap-5 text-sm font-medium text-slate-500">
                {profile.address && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{profile.address}</span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{profile.city}</span>
                  </div>
                )}
                {profile.size && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{profile.size} nhân viên</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button onClick={openEditModal} className="px-5 py-2.5 bg-[#f97316] text-white rounded-lg text-sm font-bold shadow-md shadow-orange-500/20 hover:bg-[#ea580c] transition flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>

      {/* ===== GIỚI THIỆU CÔNG TY ===== */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
        <button onClick={openEditModal} className="absolute top-7 right-8 flex items-center gap-1.5 text-[#f97316] text-sm font-bold hover:text-orange-700 transition">
          
          {/*<Pencil className="w-4 h-4" /> Chỉnh sửa*/}
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 bg-orange-100 text-[#f97316] rounded-xl flex items-center justify-center">
            <Info className="w-5 h-5 fill-orange-100" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Giới thiệu công ty</h2>
        </div>
        
        {/* Tách giới thiệu khỏi phần văn hóa */}
        {(() => {
          const raw = profile.description || "";
          // Loại bỏ BENEFITS trước khi tách
          const benefitsIdx = raw.indexOf(BENEFITS_SEP);
          const withoutBenefits = benefitsIdx >= 0 ? raw.slice(0, benefitsIdx) : raw;
          const cultureIdx = withoutBenefits.indexOf(CULTURE_SEP);
          const intro = cultureIdx >= 0 ? withoutBenefits.slice(0, cultureIdx) : withoutBenefits;
          return (
            <div className="text-[15px] leading-relaxed text-slate-600 space-y-4 max-w-4xl">
              {intro ? (
                intro.split('\n').map((para, i) => <p key={i}>{para}</p>)
              ) : (
                <p className="italic text-slate-400">Chưa có thông tin giới thiệu về công ty.</p>
              )}
            </div>
          );
        })()}
      </div>

      {/* ===== VĂN HÓA DOANH NGHIỆP ===== */}
      {(() => {
        const raw = profile.description || "";
        // Loại bỏ BENEFITS trước khi tách của culture
        const benefitsIdx = raw.indexOf(BENEFITS_SEP);
        const withoutBenefits = benefitsIdx >= 0 ? raw.slice(0, benefitsIdx) : raw;
        const cultureIdx = withoutBenefits.indexOf(CULTURE_SEP);
        const culture = cultureIdx >= 0 ? withoutBenefits.slice(cultureIdx + CULTURE_SEP.length) : "";
        return culture ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
            <button onClick={openEditModal} className="absolute top-7 right-8 flex items-center gap-1.5 text-[#f97316] text-sm font-bold hover:text-orange-700 transition">
              
             {/* <Pencil className="w-4 h-4" /> Chỉnh sửa*/}

            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Văn hóa doanh nghiệp</h2>
            </div>

            <div className="text-[15px] leading-relaxed text-slate-600 space-y-4 max-w-4xl">
              {culture.split('\n').map((para, i) => (
                para.startsWith('- ') || para.startsWith('• ') ? (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 rounded-full bg-[#f97316] flex-shrink-0" />
                    <span>{para.slice(2)}</span>
                  </div>
                ) : <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        ) : (
          // Nếu chưa có văn hóa, hiện card placeholder mờ để gợi ý thêm
          <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 relative">
            <button onClick={openEditModal} className="absolute top-7 right-8 flex items-center gap-1.5 text-[#f97316] text-sm font-bold hover:text-orange-700 transition">
              <Pencil className="w-4 h-4" /> Thêm ngay
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 bg-rose-50 text-rose-300 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-400">Văn hóa doanh nghiệp</h2>
            </div>
            <p className="text-sm text-slate-400 italic">Chưa có thông tin văn hóa công ty. Nhấn &ldquo;Thêm ngay&rdquo; để bổ sung.</p>
          </div>
        );
      })()}
      {/* ===== PHÚC LỢI ===== */}
      {(() => {
        const raw = profile.description || "";
        const benefitsIdx = raw.indexOf(BENEFITS_SEP);
        const benefitsList = benefitsIdx >= 0 ? parseBenefits(raw.slice(benefitsIdx + BENEFITS_SEP.length)) : [];
        return (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
            <button onClick={openEditModal} className="absolute top-7 right-8 flex items-center gap-1.5 text-[#f97316] text-sm font-bold hover:text-orange-700 transition">
              
              
             {/* <Pencil className="w-4 h-4" /> {benefitsList.length ? "Chỉnh sửa" : "Thêm ngay"}*/}

            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-amber-100 text-amber-500 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Phúc lợi</h2>
            </div>


            {benefitsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefitsList.map((b, idx) => {
                  const IconComp = getIconComp(b.icon);
                  const colorClass = BG_COLORS[idx % BG_COLORS.length];
                  return (
                    <div key={idx} className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-slate-100 border border-slate-100">
                      <div className={`size-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <IconComp className="w-5 h-5" />  
                      </div>
                      <div>
                        
                        <p className="text-sm font-extrabold text-slate-900 mb-1 uppercase">{b.title}</p>
                        {b.desc && <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Chưa có thông tin phúc lợi. Nhấn &ldquo;Thêm ngay&rdquo; để bổ sung.</p>
            )}
            
          </div>
        );
      })()}

      {/* ===== THÔNG TIN LIÊN HỆ ===== */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
        <button onClick={openEditModal} className="absolute top-7 right-8 flex items-center gap-1.5 text-[#f97316] text-sm font-bold hover:text-orange-700 transition">

        {/*<Pencil className="w-4 h-4" /> Chỉnh sửa*/}

        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 bg-orange-100 text-[#f97316] rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Thông tin liên hệ</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lft */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="size-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mt-1">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">Email tuyển dụng</p>
                <p className="text-sm text-slate-500">{profile.recruiter?.email || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="size-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mt-1">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">Số điện thoại</p>
                <p className="text-sm text-slate-500">{profile.recruiter?.phone || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="size-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mt-1">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">Website</p>
                {profile.website ? (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="text-sm text-[#f97316] hover:underline font-medium">
                    {profile.website}
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Chưa cập nhật</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Placeholder Map / Image */}
          <div className="bg-slate-100 rounded-2xl h-48 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
             <div className="flex flex-col items-center gap-2">
                <MapPin className="w-8 h-8" />
                <span className="text-xs font-semibold">{profile.address || profile.city || "Bản đồ công ty"}</span>
             </div>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Cập nhật hồ sơ công ty</h2>
              <button disabled={isSaving} onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700 bg-white size-8 flex items-center justify-center rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-slate-700 block">Tên công ty <span className="text-red-500">*</span></label>
                  <input 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition text-sm font-semibold text-slate-900" 
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-slate-700 block">Địa chỉ <span className="text-red-500">*</span></label>
                  <input 
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="VD: Tòa nhà Bitexco, Q1..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition text-sm font-medium" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Thành phố</label>
                  <input 
                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="TP. Hồ Chí Minh"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition text-sm font-medium" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Quy mô nhân sự</label>
                  <select
                    value={formData.size || ""}
                    onChange={e => setFormData({...formData, size: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition text-sm font-medium"
                  >
                    <option value="">-- Chọn quy mô --</option>
                    <option value="1-10">1-10 nhân viên</option>
                    <option value="11-50">11-50 nhân viên</option>
                    <option value="51-100">51-100 nhân viên</option>
                    <option value="101-200">101-200 nhân viên</option>
                    <option value="201-500">201-500 nhân viên</option>
                    <option value="501-1000">501-1000 nhân viên</option>
                    <option value="1000+">Trên 1000 nhân viên</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-slate-700 block">Website</label>
                  <input 
                    value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})}
                    placeholder="https://techcorp.vn"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition text-sm font-medium text-[#f97316] placeholder:text-slate-400" 
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-slate-700 block">Giới thiệu công ty</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={5}
                    placeholder="Viết một vài dòng về lịch sử, sứ mệnh của công ty..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none transition text-sm font-medium leading-relaxed resize-none" 
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Văn hóa doanh nghiệp
                    <span className="text-slate-400 font-normal text-xs ml-1">(Dòng bắt đầu bằng "- " sẽ hiện dạng dấu chấm đẹp)</span>
                  </label>
                  <textarea 
                    value={cultureText}
                    onChange={e => setCultureText(e.target.value)}
                    rows={5}
                    placeholder={`- Làm việc linh hoạt (Remote-friendly)\n- Hệ thống phân cấp phẳng\n- Văn hóa chia sẻ và học hỏi không ngừng`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 outline-none transition text-sm font-medium leading-relaxed resize-none" 
                  />
                </div>

                {/* ===== PHÚC LỢI EDITOR ===== */}
                <div className="space-y-3 col-span-2">
                  <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    Phúc lợi công ty
                  </label>

                  {/* Danh sách phúc lợi hiện tại */}

                  {benefits.length > 0 && (
                    <div className="space-y-2">
                      {benefits.map((b, idx) => {
                        const IconComp = getIconComp(b.icon);
                        const colorClass = BG_COLORS[idx % BG_COLORS.length];
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{b.title}</p>
                              {b.desc && <p className="text-xs text-slate-400 truncate">{b.desc}</p>}
                            </div>
                            <button onClick={() => setBenefits(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Form thêm mới */}

                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thêm phúc lợi mới</p>
                    <div className="flex gap-3">
                      <select
                        value={newBenefit.icon}
                        onChange={e => setNewBenefit(p => ({...p, icon: e.target.value}))}
                        className="w-36 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#f97316] transition"
                      >
                        {BENEFIT_ICONS.map(ic => (
                          <option key={ic.key} value={ic.key}>{ic.label}</option>
                        ))}
                      </select>
                      <input
                        value={newBenefit.title}
                        onChange={e => setNewBenefit(p => ({...p, title: e.target.value}))}
                        placeholder="Tiêu đề (VD: Lương tháng 13)"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#f97316] transition"
                      />
                    </div>


                      {/* không cần mô tả*/}
                    {/* <input
                      value={newBenefit.desc}
                      onChange={e => setNewBenefit(p => ({...p, desc: e.target.value}))}
                      placeholder="Mô tả ngắn (VD: Thưởng KPI hàng quý và các dịp lễ tết)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#f97316] transition"
                    /> */}


                    <button
                      type="button"
                      disabled={!newBenefit.title.trim()}
                      onClick={() => {
                        if (!newBenefit.title.trim()) return;
                        setBenefits(prev => [...prev, newBenefit]);
                        setNewBenefit({ icon: "gift", title: "", desc: "" });
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#f97316] text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-40 transition"
                    >
                      <Plus className="w-4 h-4" /> Thêm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button disabled={isSaving} onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition">
                Hủy bỏ
              </button>
              <button disabled={isSaving || !formData.name?.trim() || !formData.address?.trim()} onClick={saveProfile} className="px-6 py-2.5 bg-[#f97316] text-white text-sm font-bold rounded-xl hover:bg-[#ea580c] transition shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
