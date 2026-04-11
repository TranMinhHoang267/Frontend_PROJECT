export default function Home() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl form-bold text-gray-900 mb-6 font-extrabold tracking-tight sm:text-5xl">
          Tìm kiếm công việc mơ ước của bạn
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10">
          Kết nối hàng ngàn nhà tuyển dụng hàng đầu với ứng viên công nghệ.
        </p>
        
        <div className="bg-white p-4 rounded-xl shadow-lg max-w-4xl mx-auto flex flex-col md:flex-row gap-4 border border-gray-100">
          <input 
            type="text" 
            placeholder="Tên công việc, từ khóa..." 
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <input 
            type="text" 
            placeholder="Khu vực" 
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            Tìm Kiếm
          </button>
        </div>
      </div>
    </div>
  );
}
