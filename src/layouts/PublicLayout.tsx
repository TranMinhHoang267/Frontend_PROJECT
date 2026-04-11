import { Outlet, Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-[#1e3fae]">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">RecruitHub</h2>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Tìm việc làm</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Hồ sơ & CV</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Công ty ty IT</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button onClick={() => window.location.href = '/login?mode=login'} className="text-gray-600 hover:text-blue-600 font-medium">Đăng nhập</button>
            <button onClick={() => window.location.href = '/login?mode=register_candidate'} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">Đăng ký</button>
            <button onClick={() => window.location.href = '/login?mode=register_business'} className="hidden md:block border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition">Nhà Tuyển Dụng</button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 text-white">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
              </svg>
              <h2 className="text-xl font-bold leading-tight tracking-tight">RecruitHub</h2>
            </div>
            <p className="text-gray-400">Nền tảng tuyển dụng thông minh kết nối ứng viên và nhà tuyển dụng.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Dành cho ứng viên</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Tìm việc làm</a></li>
              <li><a href="#" className="hover:text-white transition">Tạo CV online</a></li>
              <li><a href="#" className="hover:text-white transition">Công ty nổi bật</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Nhà tuyển dụng</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Đăng tin tuyển dụng</a></li>
              <li><a href="#" className="hover:text-white transition">Tìm kiếm hồ sơ</a></li>
              <li><a href="#" className="hover:text-white transition">Sản phẩm & Dịch vụ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-white transition">Liên hệ</a></li>
              <li><a href="#" className="hover:text-white transition">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
