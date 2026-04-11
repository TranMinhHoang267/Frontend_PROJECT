import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { candidateService } from "../../services/candidate.service";
import type { CandidateProfile, ClearableField, UpdateProfilePayload } from "../../services/candidate.service";
import { portfolioService } from "../../services/portfolio.service";
import type { Education, Experience, Skill } from "../../services/portfolio.service";
import { useAuthStore } from "../../stores/authStore";
import { Trash2, Plus, X, Loader2, Upload, FileText, Eye, CheckCircle2, Star } from "lucide-react";

import { resumeService, type CvFile } from "../../services/resume.service";
import { avatarService } from "../../services/avatar.service";

// ===== ZOD SCHEMAS =====

// Profile: full_name, phone, headline, bio, website, linkedin_url
const profileSchema = z.object({
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  headline: z.string().min(1, "Vui lòng nhập vị trí ứng tuyển"),
  bio: z.string().max(500, "Tối đa 500 ký tự").optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  linkedin_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(v => !v || v.startsWith("https://"), { message: "LinkedIn URL phải bắt đầu bằng https://" }),
});

// Education: school_name, degree, start_date, end_date
const educationSchema = z.object({
  school_name: z.string().min(1, "Vui lòng nhập tên trường"),
  degree: z.string().min(1, "Vui lòng nhập bằng cấp"),
  start_date: z.string().min(1, "Chọn ngày bắt đầu"),
  end_date: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
});

// Experience: company_name, position, start_date, end_date, description
const experienceSchema = z.object({
  company_name: z.string().min(1, "Vui lòng nhập tên công ty"),
  position: z.string().min(1, "Vui lòng nhập vị trí"),
  start_date: z.string().min(1, "Chọn ngày bắt đầu"),
  end_date: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
});

type ProfileVals = z.infer<typeof profileSchema>;
type EduVals = z.infer<typeof educationSchema>;
type ExpVals = z.infer<typeof experienceSchema>;

// ===== HELPERS =====
const inp = (err: boolean) =>
  `w-full px-3 py-2.5 bg-slate-50 border ${err ? "border-red-400" : "border-slate-200"} rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] transition placeholder:text-slate-400`;
const lbl = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";
const Err = ({ msg }: { msg: string }) => <p className="text-xs text-red-500 mt-1">{msg}</p>;

export default function CandidateProfilePage() {
  const user = useAuthStore(s => s.user);

  const [activeTab, setActiveTab] = useState<"info" | "cv">("info");
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [cvFiles, setCvFiles] = useState<CvFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [clearingField, setClearingField] = useState<ClearableField | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvUploadSuccess, setCvUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const profileForm = useForm<ProfileVals>({ resolver: zodResolver(profileSchema) });
  const eduForm = useForm<EduVals>({ resolver: zodResolver(educationSchema) });
  const expForm = useForm<ExpVals>({ resolver: zodResolver(experienceSchema) });

  // ===== Load Data =====
  useEffect(() => {
    (async () => {
      try {
        const [p, edu, exp, sk, cvs] = await Promise.all([
          candidateService.getProfile(),
          portfolioService.getEducations(),
          portfolioService.getExperiences(),
          portfolioService.getSkills(),
          resumeService.getAll(),
        ]);
        setProfile(p);
        setEducations(edu);
        setExperiences(exp);
        setSkills(sk);
        setCvFiles(cvs);
        profileForm.reset({
          full_name: p.full_name || user?.fullName || "",
          phone: p.phone || "",
          headline: p.headline || "",
          bio: p.bio || "",
          website: p.website || "",
          linkedin_url: p.linkedin_url || "",
        });
      } catch {
        showToast("err", "Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [profileForm, user]);

  // ===== Profile =====
  const onProfileSave = async (data: ProfileVals) => {
    setIsSavingProfile(true);
    try {
      const payload: UpdateProfilePayload = {
        full_name: data.full_name,
        phone: data.phone,
        headline: data.headline,
        bio: data.bio || undefined,
        website: data.website || undefined,
        linkedin_url: data.linkedin_url || undefined,
      };
      const updated = await candidateService.updateProfile(payload);
      setProfile(prev => ({ ...prev, ...updated }));
      showToast("ok", "Cập nhật hồ sơ thành công!");
    } catch (e) {
      const ae = e as AxiosError<{ message: string }>;
      showToast("err", ae.response?.data?.message || "Lưu thất bại.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const clearField = async (field: ClearableField) => {
    if (!confirm(`Xóa trường "${field}"?`)) return;
    setClearingField(field);
    try {
      await candidateService.clearFields([field]);
      setProfile(prev => (prev ? { ...prev, [field]: "" } : prev));
      profileForm.setValue(field as keyof ProfileVals, "");
      showToast("ok", "Đã xóa.");
    } catch {
      showToast("err", "Xóa thất bại.");
    } finally {
      setClearingField(null);
    }
  };

  // ===== Education =====
  const openEduForm = (edu?: Education) => {
    setEditingEdu(edu || null);
    eduForm.reset(
      edu
        ? { school_name: edu.school_name, degree: edu.degree, start_date: edu.start_date, end_date: edu.end_date || "", description: edu.description || "" }
        : { school_name: "", degree: "", start_date: "", end_date: "", description: "" }
    );
    setShowEduForm(true);
  };

  const onEduSave = async (data: EduVals) => {
    try {
      const payload = { ...data, end_date: data.end_date || null };
      if (editingEdu?.id) {
        const updated = await portfolioService.updateEducation(editingEdu.id, payload);
        setEducations(prev => prev.map(e => e.id === updated.id ? updated : e));
        showToast("ok", "Cập nhật học vấn thành công!");
      } else {
        const created = await portfolioService.addEducation(payload);
        setEducations(prev => [...prev, created]);
        showToast("ok", "Thêm học vấn thành công!");
      }
      setShowEduForm(false);
      setEditingEdu(null);
    } catch {
      showToast("err", "Thao tác thất bại.");
    }
  };

  const deleteEdu = async (id: string) => {
    if (!confirm("Xóa học vấn này?")) return;
    try {
      await portfolioService.deleteEducation(id);
      setEducations(prev => prev.filter(e => e.id !== id));
      showToast("ok", "Đã xóa.");
    } catch {
      showToast("err", "Xóa thất bại.");
    }
  };

  // ===== Experience =====
  const openExpForm = (exp?: Experience) => {
    setEditingExp(exp || null);
    expForm.reset(
      exp
        ? { company_name: exp.company_name, position: exp.position, start_date: exp.start_date, end_date: exp.end_date || "", description: exp.description || "" }
        : { company_name: "", position: "", start_date: "", end_date: "", description: "" }
    );
    setShowExpForm(true);
  };

  const onExpSave = async (data: ExpVals) => {
    try {
      const payload = { ...data, end_date: data.end_date || null };
      if (editingExp?.id) {
        const updated = await portfolioService.updateExperience(editingExp.id, payload);
        setExperiences(prev => prev.map(e => e.id === updated.id ? updated : e));
        showToast("ok", "Cập nhật kinh nghiệm thành công!");
      } else {
        const created = await portfolioService.addExperience(payload);
        setExperiences(prev => [...prev, created]);
        showToast("ok", "Thêm kinh nghiệm thành công!");
      }
      setShowExpForm(false);
      setEditingExp(null);
    } catch {
      showToast("err", "Thao tác thất bại.");
    }
  };

  const deleteExp = async (id: string) => {
    if (!confirm("Xóa kinh nghiệm này?")) return;
    try {
      await portfolioService.deleteExperience(id);
      setExperiences(prev => prev.filter(e => e.id !== id));
      showToast("ok", "Đã xóa.");
    } catch {
      showToast("err", "Xóa thất bại.");
    }
  };

  // ===== Skills — gửi mảng chuỗi { skills: ["Python", ...] } =====
  const handleAddSkill = async () => {
    const name = skillInput.trim();
    if (!name) return;
    setAddingSkill(true);
    try {
      // Gửi skill mới cộng với các skill đã có
      const currentNames = skills.map(s => s.name);
      if (currentNames.includes(name)) { showToast("err", "Kỹ năng đã tồn tại."); return; }
      const updated = await portfolioService.updateSkills([...currentNames, name]);
      setSkills(updated);
      setSkillInput("");
      showToast("ok", `Đã thêm "${name}"!`);
    } catch {
      showToast("err", "Thêm kỹ năng thất bại.");
    } finally {
      setAddingSkill(false);
    }
  };

  const deleteSkill = async (id: string, name: string) => {
    if (!confirm(`Xóa kỹ năng "${name}"?`)) return;
    try {
      await portfolioService.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
      showToast("ok", "Đã xóa kỹ năng.");
    } catch {
      showToast("err", "Xóa thất bại.");
    }
  };

 
  // ===== CV Upload =====
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("err", "Hệ thống chỉ hỗ trợ định dạng file PDF!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { showToast("err", "File quá lớn! Tối đa 5MB."); return; }
    setUploadingCv(true); setCvUploadSuccess(false);
    try {
      const uploaded = await resumeService.upload(file);
      setCvFiles(prev => [uploaded, ...prev]);
      setCvUploadSuccess(true);
      showToast("ok", "Upload CV thành công!");
    } catch {
      showToast("err", "Upload thất bại. Thử lại.");
    } finally {
      setUploadingCv(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteCv = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa CV này?")) return;
    try { await resumeService.delete(id); setCvFiles(prev => prev.filter(c => c.id !== id)); showToast("ok", "Đã xóa CV."); }
    catch { showToast("err", "Xóa thất bại."); }
  };

  const setDefaultCv = async (id: string) => {
    try { await resumeService.setDefault(id); setCvFiles(prev => prev.map(c => ({ ...c, is_default: c.id === id }))); }
    catch { showToast("err", "Thất bản."); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-80">
      <Loader2 className="w-10 h-10 text-[#1e3fae] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-0">
      {/* ===== Toast ===== */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold ${toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ===== HEADER CARD ===== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="h-24 bg-gradient-to-r from-[#1e3fae] to-[#4c6fff]" />
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between mb-4" style={{ marginTop: "-36px" }}>
            <div className="size-20 rounded-full border-4 border-white bg-[#1e3fae] flex items-center justify-center text-2xl font-black text-white shadow-lg select-none overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={avatarService.toAbsUrl(user.avatar)} alt="avatar" className="w-full h-full object-cover bg-white" />
              ) : (
                (profile?.full_name || user?.fullName)?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3fae] text-white text-sm font-bold rounded-lg shadow hover:bg-[#1e3fae]/90 transition">
              <Eye className="w-4 h-4" /> Xem CV công khai
            </button>
          </div>
          <h1 className="text-xl font-black text-slate-900">{profile?.full_name || user?.fullName}</h1>
          {profile?.headline && (
            <p className="text-[#1e3fae] font-semibold text-sm mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">work</span>{profile.headline}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
            {user?.email && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">mail</span>{user.email}</span>}
            {profile?.phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">call</span>{profile.phone}</span>}
            {profile?.website && <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#1e3fae] hover:underline"><span className="material-symbols-outlined text-sm">language</span>{profile.website}</a>}
            {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#0077b5] hover:underline"><span className="material-symbols-outlined text-sm">open_in_new</span>LinkedIn</a>}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-slate-100 px-6">
          {[
            { key: "info", label: "Thông tin cá nhân", icon: "person" },
            { key: "cv", label: "Quản lý CV", icon: "description" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "info" | "cv")}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.key ? "border-[#1e3fae] text-[#1e3fae]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB: THÔNG TIN CÁ NHÂN ===== */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ==== LEFT COLUMN ==== */}
          <div className="xl:col-span-2 space-y-5">

            {/* ----- Thông tin cơ bản ----- */}
            <form onSubmit={profileForm.handleSubmit(onProfileSave)}>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1e3fae] text-[18px]">badge</span>
                    <h2 className="font-bold text-slate-900">Thông tin cơ bản</h2>
                  </div>
                  <button type="submit" disabled={isSavingProfile}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3fae] hover:underline disabled:opacity-50">
                    {isSavingProfile && <Loader2 className="w-3 h-3 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* full_name + phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Họ và tên *</label>
                      <input {...profileForm.register("full_name")} className={inp(!!profileForm.formState.errors.full_name)} placeholder="Nguyễn Văn A" />
                      {profileForm.formState.errors.full_name && <Err msg={profileForm.formState.errors.full_name.message!} />}
                    </div>
                    <div>
                      <label className={lbl}>Số điện thoại *</label>
                      <input {...profileForm.register("phone")} className={inp(!!profileForm.formState.errors.phone)} placeholder="0901234567" />
                      {profileForm.formState.errors.phone && <Err msg={profileForm.formState.errors.phone.message!} />}
                    </div>
                  </div>

                  {/* email (read-only) + headline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Email</label>
                      <div className={`${inp(false)} text-slate-400 cursor-not-allowed truncate`}>{user?.email || "—"}</div>
                    </div>
                    <div>
                      <label className={lbl}>Vị trí ứng tuyển / Headline *</label>
                      <input {...profileForm.register("headline")} className={inp(!!profileForm.formState.errors.headline)} placeholder="Frontend Developer..." />
                      {profileForm.formState.errors.headline && <Err msg={profileForm.formState.errors.headline.message!} />}
                    </div>
                  </div>

                  {/* Bio — có nút Xóa */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Giới thiệu bản thân (Bio)</label>
                      {profile?.bio && (
                        <button type="button" onClick={() => clearField("bio")} disabled={clearingField === "bio"}
                          className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                          <Trash2 className="w-3 h-3" />{clearingField === "bio" ? "Đang xóa..." : "Xóa"}
                        </button>
                      )}
                    </div>
                    <textarea {...profileForm.register("bio")} rows={3} className={`${inp(false)} resize-none`} placeholder="Mô tả ngắn về bản thân và mục tiêu nghề nghiệp..." />
                    <p className="text-right text-xs text-slate-400 mt-0.5">{(profileForm.watch("bio") || "").length}/500</p>
                    {profileForm.formState.errors.bio && <Err msg={profileForm.formState.errors.bio.message!} />}
                  </div>

                  {/* Website + LinkedIn — cả 2 có nút Xóa */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Website / Portfolio</label>
                        {profile?.website && (
                          <button type="button" onClick={() => clearField("website")} disabled={clearingField === "website"}
                            className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                            <Trash2 className="w-3 h-3" />{clearingField === "website" ? "Đang xóa..." : "Xóa"}
                          </button>
                        )}
                      </div>
                      <input {...profileForm.register("website")} className={inp(false)} placeholder="https://github.com/..." />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">LinkedIn URL</label>
                        {profile?.linkedin_url && (
                          <button type="button" onClick={() => clearField("linkedin_url")} disabled={clearingField === "linkedin_url"}
                            className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 disabled:opacity-40">
                            <Trash2 className="w-3 h-3" />{clearingField === "linkedin_url" ? "Đang xóa..." : "Xóa"}
                          </button>
                        )}
                      </div>
                      <input {...profileForm.register("linkedin_url")} className={inp(!!profileForm.formState.errors.linkedin_url)} placeholder="https://www.linkedin.com/in/..." />
                      {profileForm.formState.errors.linkedin_url && <Err msg={profileForm.formState.errors.linkedin_url.message!} />}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* ----- Học vấn ----- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1e3fae] text-[18px]">school</span>
                  <h2 className="font-bold text-slate-900">Học vấn</h2>
                </div>
                <button onClick={() => openEduForm()} className="size-8 flex items-center justify-center rounded-full border border-dashed border-[#1e3fae]/40 text-[#1e3fae] hover:bg-[#1e3fae]/5 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-2">
                {/* Edu form */}
                {showEduForm && (
                  <form onSubmit={eduForm.handleSubmit(onEduSave)} className="mb-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                    <p className="text-sm font-bold text-slate-700">{editingEdu ? "Chỉnh sửa" : "Thêm"} học vấn</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Tên trường *</label>
                        <input {...eduForm.register("school_name")} className={inp(!!eduForm.formState.errors.school_name)} placeholder="Đại Học UTH" />
                        {eduForm.formState.errors.school_name && <Err msg={eduForm.formState.errors.school_name.message!} />}
                      </div>
                      <div>
                        <label className={lbl}>Bằng cấp *</label>
                        <input {...eduForm.register("degree")} className={inp(!!eduForm.formState.errors.degree)} placeholder="Đại Học, Thạc Sĩ..." />
                        {eduForm.formState.errors.degree && <Err msg={eduForm.formState.errors.degree.message!} />}
                      </div>
                      <div>
                        <label className={lbl}>Ngày bắt đầu *</label>
                        <input type="date" {...eduForm.register("start_date")} className={inp(!!eduForm.formState.errors.start_date)} />
                        {eduForm.formState.errors.start_date && <Err msg={eduForm.formState.errors.start_date.message!} />}
                      </div>
                      <div>
                        <label className={lbl}>Ngày kết thúc <span className="text-slate-400 font-normal normal-case">(để trống nếu đang học)</span></label>
                        <input type="date" {...eduForm.register("end_date")} className={inp(false)} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Mô tả (tùy chọn)</label>
                      <textarea {...eduForm.register("description")} rows={2} className={`${inp(false)} resize-none`} placeholder="Thành tích, hoạt động nổi bật..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowEduForm(false); setEditingEdu(null); }} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition">Hủy</button>
                      <button type="submit" className="px-4 py-2 text-sm font-bold bg-[#1e3fae] text-white rounded-lg hover:bg-[#1e3fae]/90 transition">Lưu</button>
                    </div>
                  </form>
                )}
                {educations.length === 0 && !showEduForm && (
                  <p className="text-slate-400 text-sm text-center py-6">Chưa có thông tin học vấn</p>
                )}
                {educations.map(edu => (
                  <div key={edu.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 group">
                    <div className="size-10 bg-[#1e3fae]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#1e3fae] text-sm">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{edu.school_name}</p>
                      <p className="text-xs text-slate-600">{edu.degree}</p>
                      <p className="text-xs text-slate-400">{edu.start_date} — {edu.end_date || "Hiện tại"}</p>
                      {edu.description && <p className="text-xs text-slate-500 mt-0.5">{edu.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEduForm(edu)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      {edu.id && (
                        <button onClick={() => deleteEdu(edu.id!)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ----- Kinh nghiệm ----- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1e3fae] text-[18px]">work</span>
                  <h2 className="font-bold text-slate-900">Kinh nghiệm làm việc</h2>
                </div>
                <button onClick={() => openExpForm()} className="size-8 flex items-center justify-center rounded-full border border-dashed border-[#1e3fae]/40 text-[#1e3fae] hover:bg-[#1e3fae]/5 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-2">
                {/* Exp form */}
                {showExpForm && (
                  <form onSubmit={expForm.handleSubmit(onExpSave)} className="mb-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                    <p className="text-sm font-bold text-slate-700">{editingExp ? "Chỉnh sửa" : "Thêm"} kinh nghiệm</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Tên công ty *</label>
                        <input {...expForm.register("company_name")} className={inp(!!expForm.formState.errors.company_name)} placeholder="FPT Software, Google..." />
                        {expForm.formState.errors.company_name && <Err msg={expForm.formState.errors.company_name.message!} />}
                      </div>
                      <div>
                        <label className={lbl}>Vị trí *</label>
                        <input {...expForm.register("position")} className={inp(!!expForm.formState.errors.position)} placeholder="Frontend Developer..." />
                        {expForm.formState.errors.position && <Err msg={expForm.formState.errors.position.message!} />}
                      </div>
                      <div>
                        <label className={lbl}>Ngày bắt đầu *</label>
                        <input type="date" {...expForm.register("start_date")} className={inp(!!expForm.formState.errors.start_date)} />
                        {expForm.formState.errors.start_date && <Err msg={expForm.formState.errors.start_date.message!} />}
                      </div>
                      <div>
                        <label className={lbl}>Ngày kết thúc <span className="text-slate-400 font-normal normal-case">(để trống nếu đang làm)</span></label>
                        <input type="date" {...expForm.register("end_date")} className={inp(false)} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Mô tả công việc (tùy chọn)</label>
                      <textarea {...expForm.register("description")} rows={3} className={`${inp(false)} resize-none`} placeholder="Mô tả trách nhiệm, thành tựu đạt được..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowExpForm(false); setEditingExp(null); }} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition">Hủy</button>
                      <button type="submit" className="px-4 py-2 text-sm font-bold bg-[#1e3fae] text-white rounded-lg hover:bg-[#1e3fae]/90 transition">Lưu</button>
                    </div>
                  </form>
                )}
                {experiences.length === 0 && !showExpForm && (
                  <p className="text-slate-400 text-sm text-center py-6">Chưa có kinh nghiệm làm việc</p>
                )}
                {experiences.map(exp => (
                  <div key={exp.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 group">
                    <div className="size-10 bg-[#1e3fae]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#1e3fae] text-sm">business</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{exp.position}</p>
                      <p className="text-xs text-slate-600">{exp.company_name}</p>
                      <p className="text-xs text-slate-400">{exp.start_date} — {exp.end_date || "Hiện tại"}</p>
                      {exp.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{exp.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openExpForm(exp)} className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      {exp.id && (
                        <button onClick={() => deleteExp(exp.id!)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ----- Kỹ năng ----- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1e3fae] text-[18px]">star</span>
                  <h2 className="font-bold text-slate-900">Kỹ năng</h2>
                </div>
                <button onClick={() => setShowSkillInput(true)} className="size-8 flex items-center justify-center rounded-full bg-[#1e3fae]/10 text-[#1e3fae] hover:bg-[#1e3fae]/20 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                {skills.length === 0 && !showSkillInput && <p className="text-slate-400 text-sm text-center py-4">Chưa có kỹ năng nào</p>}
                
                <div className="flex flex-wrap items-center gap-3">
                  {skills.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eff4ff] text-[#1e3fae] rounded-full text-sm font-semibold">
                      {s.name}
                      {s.id && (
                        <button onClick={() => deleteSkill(s.id!, s.name)} className="ml-1 text-[#1e3fae]/50 hover:text-[#1e3fae] transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {!showSkillInput ? (
                    <button 
                      onClick={() => setShowSkillInput(true)} 
                      className="flex items-center gap-1.5 px-4 py-1.5 border border-dashed border-slate-300 text-slate-500 rounded-full text-sm font-medium hover:border-slate-400 hover:bg-slate-50 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm kỹ năng
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onBlur={() => { if (!skillInput.trim()) setShowSkillInput(false); }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          } else if (e.key === "Escape") {
                            setShowSkillInput(false);
                            setSkillInput("");
                          }
                        }}
                        className="px-3 py-1.5 border border-[#1e3fae] rounded-full text-sm outline-none focus:ring-2 focus:ring-[#1e3fae]/20 w-40 placeholder:text-slate-300"
                        placeholder="Nhập kỹ năng..."
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        disabled={addingSkill || !skillInput.trim()}
                        className="size-8 flex items-center justify-center bg-[#1e3fae] text-white rounded-full hover:bg-[#1e3fae]/90 transition disabled:opacity-50"
                      >
                        {addingSkill ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSkillInput(false); setSkillInput(""); }}
                        className="size-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==== RIGHT COLUMN — Quản lý CV ==== */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1e3fae]" />
                  <h3 className="font-bold text-slate-900">Quản lý CV</h3>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="size-7 flex items-center justify-center rounded-full border border-dashed border-[#1e3fae]/40 text-[#1e3fae] hover:bg-[#1e3fae]/5 transition">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />

                {/* Upload box */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCv}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-[#1e3fae]/40 hover:bg-[#1e3fae]/5 transition group"
                >
                  {uploadingCv
                    ? <Loader2 className="w-8 h-8 text-[#1e3fae] animate-spin" />
                    : <Upload className="w-8 h-8 text-slate-300 group-hover:text-[#1e3fae] transition" />}
                  <p className="text-sm font-semibold text-slate-500 group-hover:text-[#1e3fae] transition">Tải lên CV mới</p>
                  <p className="text-xs text-slate-400">Chỉ hỗ trợ file PDF (Tối đa 5MB)</p>
                </button>

                {/* Success banner */}
                {cvUploadSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    CV đã được tải lên thành công!
                  </div>
                )}

                {cvFiles.length === 0 && !cvUploadSuccess && (
                  <p className="text-xs text-slate-400 text-center py-2">Chưa có CV nào được tải lên</p>
                )}

                {/* CV list */}
                {cvFiles.map(cv => (
                  <div key={cv.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="size-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{cv.file_name || "CV_Document"}</p>
                      <p className="text-[10px] text-slate-400">Cập nhật: {new Date(cv.created_at || Date.now()).toLocaleDateString("vi-VN")}</p>
                    </div>
                    {cv.is_default && <span className="text-[10px] bg-[#1e3fae] text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">Mặc định</span>}
                    <div className="flex gap-1">
                      <a href={resumeService.getViewUrl(cv)} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      {!cv.is_default && (
                        <button onClick={() => setDefaultCv(cv.id)} title="Đặt làm mặc định" className="p-1 rounded hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition">
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteCv(cv.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: QUẢN LÝ CV ===== */}
      {activeTab === "cv" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
          <p className="font-semibold text-lg text-slate-600">Tính năng đang phát triển</p>
          <p className="text-sm text-slate-400 mt-1">Bạn có thể upload CV từ panel bên phải ở tab Thông tin cá nhân</p>
          <button onClick={() => setActiveTab("info")} className="mt-4 px-5 py-2 bg-[#1e3fae] text-white text-sm font-bold rounded-lg hover:bg-[#1e3fae]/90 transition">
            Chuyển sang Thông tin cá nhân
          </button>
        </div>
      )}
    </div>
  );
}
