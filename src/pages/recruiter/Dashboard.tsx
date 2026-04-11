export default function RecruiterDashboard() {
  return (
    <>
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý Ứng viên</h1>
        <p className="text-slate-500">Theo dõi và quản lý các hồ sơ ứng tuyển từ các tin tuyển dụng của bạn.</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#1e3fae] text-white shadow-md shadow-[#1e3fae]/20 transition-all">Tất cả</button>
        <button className="px-5 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-all">Mới (12)</button>
        <button className="px-5 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-all">Đang xem xét (8)</button>
        <button className="px-5 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-all">Phỏng vấn (5)</button>
        <button className="px-5 py-2 text-sm font-medium rounded-lg text-green-600 hover:bg-slate-100 transition-all">Đã tuyển (2)</button>
        <button className="px-5 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-slate-100 transition-all">Từ chối (14)</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ứng viên</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vị trí ứng tuyển</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ngày nộp</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#1e3fae]/10 text-[#1e3fae] flex items-center justify-center font-bold text-sm">NA</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Nguyễn Văn An</span>
                      <span className="text-xs text-slate-500">an.nguyen@email.com</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-600">Senior React Developer</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">12/10/2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-tighter">Mới</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1e3fae] hover:underline text-sm font-bold">Xem hồ sơ</button>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     <div className="size-10 rounded-full bg-slate-100 overflow-hidden">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGGTG8TEz1fgcOGJqZL7fBvrBJog8ySESgVbUkA8cABd9p8mV5AzfJgg_WJiw7tGBVEqRoaflr0DzifZV1G_AvfybFS85YbCQfIO7SeztOKOPFKjodwqTdPdArKRsoPFhMX6oDlnXaxLgqFvHiT9J6b4W3keXlCqbMcPlw7I3vKBqkoCb4WIqHfSfWVCiQ5Cya7Md6EfaJ9SJHV0W9nctvT6zYsecwT0Tua8CPv3fjcRg1jWprE07w8k6AagAiiUrJn5MYnNHRQksA" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Trần Thị Bích</span>
                      <span className="text-xs text-slate-500">bich.tran@email.com</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-600">Product Designer (UI/UX)</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">10/10/2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-tighter">Phỏng vấn</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1e3fae] hover:underline text-sm font-bold">Xem hồ sơ</button>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm">LC</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Lê Văn Cường</span>
                      <span className="text-xs text-slate-500">cuong.le@email.com</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-600">Marketing Manager</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">08/10/2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-tighter">Đang xem xét</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1e3fae] hover:underline text-sm font-bold">Xem hồ sơ</button>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">HD</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Hoàng Minh Dũng</span>
                      <span className="text-xs text-slate-500">dung.hm@email.com</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-600">Project Manager</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">05/10/2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-tighter">Đã tuyển</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1e3fae] hover:underline text-sm font-bold">Xem hồ sơ</button>
                </td>
              </tr>
              {/* Row 5 */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">PH</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Phạm Văn Hưng</span>
                      <span className="text-xs text-slate-500">hung.pham@email.com</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-600">Junior Java Developer</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">01/10/2026</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-tighter">Từ chối</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1e3fae] hover:underline text-sm font-bold">Xem hồ sơ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination mb */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <p className="text-sm text-slate-500">Hiển thị <span className="font-bold">1-5</span> của <span className="font-bold">53</span> ứng viên</p>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center size-8 rounded border border-slate-200 text-slate-400 cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="flex items-center justify-center size-8 rounded border border-[#1e3fae] bg-[#1e3fae] text-white text-sm font-bold">1</button>
            <button className="flex items-center justify-center size-8 rounded border border-slate-200 text-sm hover:bg-slate-50">2</button>
            <button className="flex items-center justify-center size-8 rounded border border-slate-200 text-sm hover:bg-slate-50">3</button>
            <span className="text-slate-400">...</span>
            <button className="flex items-center justify-center size-8 rounded border border-slate-200 text-sm hover:bg-slate-50">11</button>
            <button className="flex items-center justify-center size-8 rounded border border-slate-200 hover:bg-slate-50">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
