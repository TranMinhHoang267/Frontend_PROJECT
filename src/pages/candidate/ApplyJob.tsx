import { Building2, MapPin, Banknote, FileText, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { applicationService } from "../../services/application.service";
import { jobService } from "../../services/job.service";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { resumeService } from "../../services/resume.service";
import type { CvFile } from "../../services/resume.service";
import {employerService} from "../../services/employer.service";
interface JobDetails {
  id: string | number;
  title?: string;
  company?: { name?: string; logo_url?: string };
  location?: string;
  salary_min?: number;
  salary_max?: number;
}
const formatSalary = (min?: number | null, max?: number | null) => {
  if (!min && !max) return "Thỏa thuận";

const fmt = (n: number) => {
  if (n >= 1_000_000) {
    const inMillion = n / 1_000_000;
    return `${inMillion.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} Tr`;
  } else if (n >= 1_000) {
    const inThousand = n / 1_000;
    return `${inThousand.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} N`;
  }
  return `${n.toLocaleString("vi-VN")} đ`;
};

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
};


export default function ApplyJob() {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState<JobDetails | null>(location.state?.job || null);
  const [cvs, setCvs] = useState<CvFile[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [shareProfile, setShareProfile] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch CVs
        const fetchedCvs = await resumeService.getAll();
        setCvs(fetchedCvs);
        if (fetchedCvs.length > 0) {
          const defaultCv = fetchedCvs.find((cv: CvFile) => cv.is_default) || fetchedCvs[0];
          setSelectedCvId(defaultCv.id);
        }

        // 2. Fetch Job if not in state
        if (!job && jobId) {
          const jobData = await jobService.getPublicJobDetail(jobId);
          if (jobData) {
            setJob(jobData);
          } else {
             // Fallback
             setJob({
               id: jobId,
               title: "Công việc (Đã xóa hoặc URL lỗi)",
             });
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu nộp đơn:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jobId, job]);

  const handleSubmit = async () => {
    if (!selectedCvId) {
      alert("Vui lòng chọn hoặc tải lên một CV để ứng tuyển.");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        job_id: isNaN(Number(jobId)) ? jobId : Number(jobId),
        resume_id: isNaN(Number(selectedCvId)) ? selectedCvId : Number(selectedCvId),
        cover_letter: coverLetter
      };
      await applicationService.apply(payload as typeof payload & { job_id: string });
      alert("Nộp đơn thành công!");
      navigate('/candidate'); // Redirect to dashboard or application history
    } catch (err: unknown) {
      interface ErrorResponse { response?: { data?: { message?: string } } }
      const apiErr = err as ErrorResponse;
      alert(apiErr?.response?.data?.message || "Có lỗi xảy ra khi nộp đơn.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans pb-20">
      <div className="max-w-[800px] mx-auto px-4 pt-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-slate-500 mb-6">
          <Link to="/candidate/recommended" className="hover:text-blue-600">Việc làm</Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-900 font-medium">Nộp đơn</span>
        </div>

        {/* Job Summary Box */}
        <div className="bg-white border border-slate-200 p-5 rounded-[12px] flex items-center justify-between shadow-sm mb-8">
          <div className="flex items-center gap-4">
            {/* --- ĐÃ SỬA PHẦN LOGO Ở ĐÂY --- */}
            <div className="size-16 rounded-lg border border-slate-100 flex items-center justify-center bg-white shadow-sm p-2">
              {job?.company?.logo_url && !imgError ? (
                <img 
                  src={employerService.getLogoUrl(job.company.logo_url)} 
                  alt={job?.company?.name || "logo"} 
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-[#1e3fae] font-black text-xl">
                  {job?.company?.name?.charAt(0).toUpperCase() || "T"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-slate-900 mb-1">{job?.title || "Senior UI/UX Designer"}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" />{job?.company?.name || "TechCorp Solution"}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{job?.location || "TP. Hồ Chí Minh"}</span>
                <span className="flex items-center gap-1.5 text-[#1e3fae] font-bold">
                  <Banknote className="w-4 h-4 text-[#1e3fae]" />
                  {formatSalary(job?.salary_min, job?.salary_max)}
                </span>
              </div>
            </div>
          </div>
          <button
            className="px-5 py-2.5 bg-blue-50 text-[#1e3fae] font-bold rounded-lg text-sm border border-blue-100 hover:bg-blue-100 transition-colors"
            onClick={() => navigate(`/candidate/jobs/${jobId}`)}
          >
            Xem chi tiết công việc
          </button>
        </div>

        {/* CV Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1e3fae]" /> Chọn CV ứng tuyển
            </h2>
            <button className="text-[#1e3fae] font-semibold text-sm hover:underline">+ Tải CV mới</button>
          </div>
          
          <div className="space-y-3">
            {cvs.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 p-8 rounded-xl text-center text-slate-500">
                Bạn chưa có CV nào. Hãy tải CV mới lên để ứng tuyển.
              </div>
            ) : (
              cvs.map((cv) => (
                <label
                  key={cv.id}
                  htmlFor={`cv-${cv.id}`}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCvId === cv.id ? 'border-[#1e3fae] bg-[#f8fbff]' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Hidden radio input – handles selection state */}
                    <input
                      type="radio"
                      id={`cv-${cv.id}`}
                      name="cv_selection"
                      value={cv.id}
                      checked={selectedCvId === cv.id}
                      onChange={() => setSelectedCvId(cv.id)}
                      className="sr-only"
                    />
                    {/* Custom radio circle */}
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedCvId === cv.id ? 'border-[#1e3fae]' : 'border-slate-300'
                      }`}
                    >
                      {selectedCvId === cv.id && <div className="size-2.5 rounded-full bg-[#1e3fae]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cv.file_name || "CV_NguyenVanA.pdf"}</span>
                        {cv.is_default && (
                          <span className="bg-[#1e3fae] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">MẶC ĐỊNH</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Cập nhật {cv.created_at ? new Date(cv.created_at).toLocaleDateString("vi-VN") : "gần đây"} • {cv.file_size || '1.2 MB'}
                      </p>
                    </div>
                  </div>
                  {selectedCvId === cv.id && <CheckCircle2 className="w-6 h-6 text-[#1e3fae]" />}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Cover Letter */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#1e3fae]">edit_note</span> Thư ngỏ (Cover Letter)
          </h2>
          <p className="text-sm text-slate-500 mb-3">Giới thiệu ngắn gọn về bản thân và lý do bạn phù hợp với vị trí này.</p>
          <textarea 
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Chào bộ phận tuyển dụng TechCorp Solution, tôi là..."
            className="w-full bg-white border border-slate-200 rounded-xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3fae] resize-y"
          />
        </div>

        {/* Share Profile Checkbox */}
        <div className="bg-[#f8f9fc] border border-slate-200 p-4 rounded-xl flex items-start gap-3 mb-8">
          <input 
            type="checkbox" 
            checked={shareProfile}
            onChange={(e) => setShareProfile(e.target.checked)}
            className="mt-1 size-4 rounded text-[#1e3fae] focus:ring-[#1e3fae]" 
          />
          <div>
            <span className="block font-bold text-slate-900 text-sm mb-0.5">Cho phép nhà tuyển dụng xem hồ sơ cá nhân của tôi</span>
            <span className="text-xs text-slate-500">Điều này giúp nhà tuyển dụng có thêm thông tin về kinh nghiệm và các dự án của bạn từ trang cá nhân RecruitHub.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mb-8">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 font-bold text-slate-700 hover:text-slate-900"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedCvId}
            className="bg-[#1F45A4] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#163687] disabled:opacity-50 transition-colors"
          >
            {submitting ? "Đang nộp..." : "Nộp hồ sơ ngay"}
            {!submitting && <span className="material-symbols-outlined text-[18px]">send</span>}
          </button>
        </div>

        {/* Footer Note */}
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 italic">
          <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <p>Lưu ý: RecruitHub khuyên bạn nên kiểm tra kỹ thông tin liên lạc và CV trước khi gửi. Nhà tuyển dụng sẽ nhận được thông báo ngay lập tức sau khi bạn nhấn nút "Nộp hồ sơ ngay".</p>
        </div>

      </div>
    </div>
  );
}
