import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/authStore";
import { AxiosError } from "axios";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});

const registerCandidateSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ").endsWith("@gmail.com", "Email phải có đuôi @gmail.com"),
  password: z.string().min(6, "Password phải có ít nhất 6 ký tự"),
});

const registerBusinessSchema = z.object({
  companyName: z.string().min(1, "Vui lòng nhập tên công ty"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ công ty"),
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ").endsWith("@gmail.com", "Email phải có đuôi @gmail.com"),
  password: z.string().min(6, "Password phải có ít nhất 6 ký tự"),
  confirm_password: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Mật khẩu không khớp",
  path: ["confirm_password"]
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterCandidateValues = z.infer<typeof registerCandidateSchema>;
type RegisterBusinessValues = z.infer<typeof registerBusinessSchema>;

export default function Login() {
  const [viewState, setViewState] = useState<'login' | 'register_candidate' | 'register_business'>('login');
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register_candidate' || mode === 'register_business' || mode === 'login') {
      setViewState(mode);
    }
  }, [searchParams]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const candidateForm = useForm<RegisterCandidateValues>({
    resolver: zodResolver(registerCandidateSchema),
  });

  const businessForm = useForm<RegisterBusinessValues>({
    resolver: zodResolver(registerBusinessSchema),
  });

  const onLoginSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await authService.login(data);
      
      // Backend trả về: { status: "success", data: { accessToken, refreshToken, user info... } }
      const responseData = res.data ?? res;
      const accessToken = responseData.accessToken || responseData.token || responseData.access_token;
      const refreshToken = responseData.refreshToken || responseData.refresh_token;
      
      if (!accessToken) {
        setErrorMsg("Đăng nhập thất bại. Không nhận được token từ server.");
        return;
      }
      
      const user = {
        id: responseData.id,
        email: responseData.email,
        fullName: responseData.fullName || responseData.full_name || "User",
        role: responseData.role as 'candidate' | 'recruiter' | 'admin',
        phone: responseData.phone,
        avatar: responseData.avatarUrl || responseData.avatar || undefined,
      };
      
      setAuth(user, accessToken, refreshToken || "");
      
      // Chuyển hướng dựa trên role
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "recruiter") navigate("/recruiter");
      else navigate("/candidate");

    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setErrorMsg(axiosError.response?.data?.message || "Đăng nhập thất bại. Kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterCandidateSubmit = async (data: RegisterCandidateValues) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await authService.register({ ...data });
      alert("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
      setViewState('login'); 
      loginForm.setValue("email", data.email); 
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || "";
      if (msg.includes("Email đã được sử dụng") || msg.includes("Số điện thoại đã sử dụng")) {
        setErrorMsg(msg);
      } else {
        setErrorMsg(msg || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterBusinessSubmit = async (data: RegisterBusinessValues) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await authService.register({ 
        fullName: data.fullName, 
        email: data.email, 
        password: data.password, 
        phone: data.phone, 
        companyName: data.companyName,
        address: data.address
      });
      alert("Đăng ký Doanh nghiệp thành công! Đăng nhập ngay.");
      setViewState('login'); 
      loginForm.setValue("email", data.email); 
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || "";
      if (msg.includes("Email đã được sử dụng") || msg.includes("Số điện thoại đã sử dụng")) {
        setErrorMsg(msg);
      } else {
        setErrorMsg(msg || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-display bg-[#f6f6f8] text-slate-900 min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 px-6 md:px-10 py-4 bg-white">
        <Link to="/" className="flex items-center gap-3">
          <div className="text-[#1e3fae]">
            <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">RecruitHub</h2>
        </Link>
        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
          <nav className="flex items-center gap-8">
            <Link to="/" className="text-slate-600 text-sm font-medium hover:text-[#1e3fae] transition-colors">Jobs</Link>
            <Link to="/" className="text-slate-600 text-sm font-medium hover:text-[#1e3fae] transition-colors">Companies</Link>
            <Link to="/" className="text-slate-600 text-sm font-medium hover:text-[#1e3fae] transition-colors">Salaries</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[480px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="p-8 pb-4 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {viewState === 'login' ? "Welcome Back" : (viewState === 'register_business' ? "Create Business Account" : "Create Account")}
            </h1>
            <p className="text-slate-500 text-base">
              {viewState === 'login' ? "Sign in to continue your journey" : "Join RecruitHub and start your career journey"}
            </p>
          </div>
          
          {/* Login/Signup Toggle */}
          {viewState !== 'register_business' && (
            <div className="px-8 py-4">
              <div className="flex h-12 items-center justify-center rounded-xl bg-slate-100 p-1.5">
                <button 
                  type="button" 
                  onClick={() => setViewState('login')}
                  className={`flex-1 flex items-center justify-center h-full rounded-lg text-sm font-semibold transition-all ${viewState === 'login' ? 'bg-white text-[#1e3fae] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                  Login
                </button>
                <button 
                  type="button" 
                  onClick={() => setViewState('register_candidate')}
                  className={`flex-1 flex items-center justify-center h-full rounded-lg text-sm font-semibold transition-all ${viewState === 'register_candidate' ? 'bg-white text-[#1e3fae] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="px-8 mb-2">
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {errorMsg}
              </div>
            </div>
          )}
          
          {/* FORMS */}
          {viewState === 'login' && (
            <form className="px-8 py-4 space-y-5" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input 
                    {...loginForm.register("email")}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none transition-all text-slate-900 placeholder:text-slate-400" 
                    placeholder="name@company.com" 
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <span className="text-xs text-red-500 font-medium">{loginForm.formState.errors.email.message}</span>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 text-sm font-semibold">Password</label>
                  <a className="text-[#1e3fae] text-xs font-semibold hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                  <input 
                    {...loginForm.register("password")}
                    type="password"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 focus:border-[#1e3fae] outline-none transition-all text-slate-900 placeholder:text-slate-400" 
                    placeholder="••••••••" 
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <span className="text-xs text-red-500 font-medium">{loginForm.formState.errors.password.message}</span>
                )}
              </div>
              
              <button 
                disabled={isLoading}
                className="w-full bg-[#1e3fae] text-white font-bold py-4 rounded-lg shadow-lg shadow-[#1e3fae]/20 hover:bg-[#1e3fae]/90 transition-all active:scale-[0.98] disabled:opacity-70" 
                type="submit"
              >
                {isLoading ? "Vui lòng chờ..." : "Sign In"}
              </button>
              <div className="mt-4 text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setViewState('register_business'); }} className="text-sm font-semibold text-[#1e3fae] hover:underline">
                  Bạn là nhà tuyển dụng? Đăng ký tại đây
                </a>
              </div>
            </form>
          )}

          {viewState === 'register_candidate' && (
            /* REGISTER CANDIDATE FORM */
            <form className="px-8 py-4 space-y-4" onSubmit={candidateForm.handleSubmit(onRegisterCandidateSubmit)}>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                  <input 
                    {...candidateForm.register("fullName")}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${candidateForm.formState.errors.fullName ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900 placeholder:text-slate-400`}
                    placeholder="John Doe" 
                  />
                </div>
                {candidateForm.formState.errors.fullName && (
                  <span className="text-xs text-red-500 font-medium">{candidateForm.formState.errors.fullName.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">call</span>
                  <input 
                    {...candidateForm.register("phone")}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${candidateForm.formState.errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900 placeholder:text-slate-400`}
                    placeholder="0123965874" 
                  />
                </div>
                 {candidateForm.formState.errors.phone && (
                  <span className="text-xs text-red-500 font-medium">{candidateForm.formState.errors.phone.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input 
                    {...candidateForm.register("email")}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${candidateForm.formState.errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900 placeholder:text-slate-400`}
                    placeholder="name@example.com" 
                  />
                </div>
                {candidateForm.formState.errors.email && (
                  <span className="text-xs text-red-500 font-medium">{candidateForm.formState.errors.email.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                  <input 
                    {...candidateForm.register("password")}
                    type="password"
                    className={`w-full pl-11 pr-12 py-3 bg-slate-50 border ${candidateForm.formState.errors.password ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900 placeholder:text-slate-400`}
                    placeholder="••••••••" 
                  />
                </div>
                 {candidateForm.formState.errors.password && (
                  <span className="text-xs text-red-500 font-medium">{candidateForm.formState.errors.password.message}</span>
                )}
              </div>

              <button 
                disabled={isLoading}
                className="w-full bg-[#1e3fae] text-white font-bold py-4 rounded-lg shadow-lg shadow-[#1e3fae]/20 hover:bg-[#1e3fae]/90 transition-all active:scale-[0.98] mt-2 disabled:opacity-70" 
                type="submit"
              >
                {isLoading ? "Vui lòng chờ..." : "Create Account"}
              </button>

              <div className="mt-4 text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setViewState('register_business'); }} className="text-sm font-medium text-slate-500 hover:text-[#1e3fae] hover:underline">
                  Bạn là nhà tuyển dụng? Tạo tài khoản doanh nghiệp.
                </a>
              </div>
            </form>
          )}

          {viewState === 'register_business' && (
            /* REGISTER BUSINESS FORM */
            <form className="px-8 py-4 space-y-4" onSubmit={businessForm.handleSubmit(onRegisterBusinessSubmit)}>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-semibold">Full Name</label>
                  <input 
                    {...businessForm.register("fullName")}
                    className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.fullName ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                    placeholder="Jane Doe" 
                  />
                  {businessForm.formState.errors.fullName && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.fullName.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-semibold">Phone Number</label>
                  <input 
                    {...businessForm.register("phone")}
                    className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                    placeholder="0123965874" 
                  />
                  {businessForm.formState.errors.phone && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.phone.message}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Work Email</label>
                <input 
                  {...businessForm.register("email")}
                  className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                  placeholder="jane.doe@company.com" 
                />
                {businessForm.formState.errors.email && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.email.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Company Name</label>
                <input 
                  {...businessForm.register("companyName")}
                  className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.companyName ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                  placeholder="Acme Corp" 
                />
                {businessForm.formState.errors.companyName && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.companyName.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-semibold">Company Address</label>
                <input 
                  {...businessForm.register("address")}
                  className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.address ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                  placeholder="123 Business Way, SF, CA" 
                />
                {businessForm.formState.errors.address && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.address.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-semibold">Password</label>
                  <input 
                    {...businessForm.register("password")}
                    type="password"
                    className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.password ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                    placeholder="••••••••" 
                  />
                  {businessForm.formState.errors.password && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.password.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-semibold">Confirm Password</label>
                  <input 
                    {...businessForm.register("confirm_password")}
                    type="password"
                    className={`w-full px-4 py-3 bg-slate-50 border ${businessForm.formState.errors.confirm_password ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-[#1e3fae]/20 outline-none transition-all text-slate-900`}
                    placeholder="••••••••" 
                  />
                  {businessForm.formState.errors.confirm_password && <span className="text-xs text-red-500 font-medium">{businessForm.formState.errors.confirm_password.message}</span>}
                </div>
              </div>

              <button 
                disabled={isLoading}
                className="w-full bg-[#1e3fae] text-white font-bold py-4 rounded-lg shadow-lg shadow-[#1e3fae]/20 hover:bg-[#1e3fae]/90 transition-all active:scale-[0.98] mt-2 disabled:opacity-70" 
                type="submit"
              >
                {isLoading ? "Vui lòng chờ..." : "Register as Business"}
              </button>

              <div className="mt-4 text-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setViewState('register_candidate'); }} className="text-sm font-medium text-slate-500 hover:text-[#1e3fae] hover:underline">
                  Bạn đang tìm việc? Đăng ký với tư cách ứng viên
                </a>
              </div>
            </form>
          )}

          {/* Removed Social Logins to keep form clean */}
          <div className="pb-4"></div>
        </div>
      </main>
      
      <footer className="p-6 text-center text-slate-400 text-xs mt-auto">
        <p>© 2026 RecruitHub Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
