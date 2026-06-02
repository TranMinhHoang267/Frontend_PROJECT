import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Tìm việc làm", to: "/login?mode=login&redirectTo=/candidate/search" },
  { label: "Hồ sơ & CV",  to: "/login?mode=login&redirectTo=/candidate/profile" },
  { label: "Công ty IT",  to: "/login?mode=login&redirectTo=/candidate/search" },
];

export default function PublicLayout() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const navigate = useNavigate();

  /* ── Sticky scroll effect ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Đóng mobile menu khi resize lên md ── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Khoá scroll body khi mobile menu mở ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ══════════════ HEADER ══════════════ */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/60"
            : "bg-white shadow-sm border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="text-[#1e3fae]">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">RecruitHub</h2>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-slate-50"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login?mode=login")}
              className="text-gray-600 hover:text-blue-600 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate("/login?mode=register_candidate")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
            >
              Đăng ký
            </button>
            <button
              onClick={() => navigate("/login?mode=register_business")}
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Nhà Tuyển Dụng
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Mở menu"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* ── Mobile Drawer ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-5 pt-2 border-t border-slate-100 bg-white space-y-1">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-slate-100">
              <button
                onClick={() => { setMobileOpen(false); navigate("/login?mode=login"); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-slate-50 transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate("/login?mode=register_candidate"); }}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Đăng ký ứng viên
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate("/login?mode=register_business"); }}
                className="w-full border border-blue-600 text-blue-600 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
              >
                Nhà Tuyển Dụng
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4 text-white">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor" />
              </svg>
              <h2 className="text-xl font-bold leading-tight tracking-tight">RecruitHub</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Nền tảng tuyển dụng thông minh kết nối ứng viên và nhà tuyển dụng.</p>
          </div>

          {/* Dành cho ứng viên */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Dành cho ứng viên</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/login?mode=login&redirectTo=/candidate/search" className="hover:text-white transition text-sm">
                  Tìm việc làm
                </Link>
              </li>
              <li>
                <Link to="/login?mode=login&redirectTo=/candidate/profile" className="hover:text-white transition text-sm">
                  Tạo CV online
                </Link>
              </li>
              <li>
                <Link to="/login?mode=login&redirectTo=/candidate/search" className="hover:text-white transition text-sm">
                  Công ty nổi bật
                </Link>
              </li>
            </ul>
          </div>

          {/* Nhà tuyển dụng */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Nhà tuyển dụng</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/login?mode=register_business" className="hover:text-white transition text-sm">
                  Đăng tin tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/login?mode=login&redirectTo=/recruiter/candidates" className="hover:text-white transition text-sm">
                  Tìm kiếm hồ sơ
                </Link>
              </li>
              <li>
                <Link to="/login?mode=register_business" className="hover:text-white transition text-sm">
                  Sản phẩm &amp; Dịch vụ
                </Link>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition text-sm">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-white transition text-sm">Liên hệ</a></li>
              <li><a href="#" className="hover:text-white transition text-sm">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} RecruitHub. Tất cả quyền được bảo lưu.
        </div>
      </footer>
    </div>
  );
}
