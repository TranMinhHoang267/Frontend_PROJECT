import { useState, useEffect } from "react";
import { FileText, MessageSquare, Bookmark, MoreVertical, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { applicationService } from "../../services/application.service";
import type { Application } from "../../services/application.service";

// Define the steps to avoid 'any'
type JourneyStep = 'applied' | 'review' | 'interview' | 'decision';

// Stats with placeholders for dynamic values
const INITIAL_STATS = [
  { label: "Total Applications", value: "0", subtext: "Live update", icon: FileText, color: "text-[#1e3fae]", bg: "bg-blue-50", subColor: "text-emerald-500" },
  { label: "Active Interviews", value: "0", subtext: "Upcoming interviews", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-50", subColor: "text-slate-400" },
  { label: "Bookmarked Jobs", value: "0", subtext: "Saved for later", icon: Bookmark, color: "text-orange-500", bg: "bg-orange-50", subColor: "text-slate-400" },
];

export default function CandidateDashboard() {
  const user = useAuthStore(state => state.user);
  const firstName = user?.fullName?.split(" ")[0] || "Alex";

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await applicationService.getApplications();
        const appList = Array.isArray(data) ? data : (data.data || []);
        
        setApps(appList);
        if (appList.length > 0) setSelectedApp(appList[0]);

        // Dynamically compute stats based on your app list
        const total = appList.length;
        const interviewing = appList.filter((a: Application) => a.status === 'interviewing').length;
        // Assume you might have bookmarkStore later, for now mock
        
        setStats(prev => [
           { ...prev[0], value: String(total) },
           { ...prev[1], value: String(interviewing) },
           prev[2] // Bookmark stays for now
        ]);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'interviewing': return 'bg-violet-100 text-violet-700';
      case 'reviewing':    return 'bg-orange-100 text-orange-700';
      case 'offered':      return 'bg-emerald-100 text-emerald-700';
      case 'submitted':    return 'bg-blue-100 text-blue-700';
      case 'rejected':     return 'bg-red-100 text-red-700';
      default:             return 'bg-slate-100 text-slate-700';
    }
  };

  const getStepStatusClass = (step: JourneyStep, currentStatus: string) => {
    // Basic logic mapping status to journey steps
    const levels: Record<string, number> = { submitted: 1, reviewing: 2, interviewing: 3, offered: 4, rejected: 4 };
    const stepLevel: Record<string, number> = { applied: 1, review: 2, interview: 3, decision: 4 };
    
    const currentLevel = levels[currentStatus] || 1;
    const sLevel = stepLevel[step];

    if (currentLevel > sLevel) return 'completed';
    if (currentLevel === sLevel) return 'active';
    return 'upcoming';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Candidate Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {firstName}. Here's your application status overview.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-[#1e3fae]" /></div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    <s.icon className="w-5 h-5 fill-current" />
                  </div>
                  <span className={`text-[11px] font-bold ${s.subColor}`}>{s.subtext}</span>
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-semibold">{s.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Apps */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Recent Applications</h2>
              <button className="text-sm font-bold text-[#1e3fae] hover:underline" onClick={() => window.location.href='/candidate/applications'}>View All</button>
            </div>
            {apps.length === 0 ? (
               <div className="p-10 text-center text-slate-400 font-bold">Chưa có đơn ứng tuyển nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f8fafc] border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Company & Job</th>
                      <th className="px-6 py-4">Date Applied</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apps.slice(0, 5).map(app => (
                      <tr key={app.id} onClick={() => setSelectedApp(app)} className={`cursor-pointer transition-colors ${selectedApp?.id === app.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                               {app.job?.company?.logo_url ? <img src={app.job?.company?.logo_url} className="w-full h-full object-contain" /> : <span className="font-bold text-slate-300">{app.job?.company?.name?.charAt(0)}</span>}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-tight">{app.job?.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{app.job?.company?.name} • {app.job?.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 capitalize">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${getStatusStyle(app.status)}`}>
                            <span className="size-1.5 rounded-full bg-current opacity-60"></span>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4"><button className="text-slate-300 hover:text-slate-500"><MoreVertical className="w-5 h-5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stepper for Selected App */}
          {selectedApp && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 relative">
              <p className="text-[10px] font-bold text-[#1e3fae] uppercase tracking-widest mb-2">Selected Application Journey</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {selectedApp.job?.title} at {selectedApp.job?.company?.name}
                </h2>
                <button className="px-5 py-2.5 rounded-xl bg-[#1e3fae] text-white font-bold text-sm hover:bg-[#162f8c] transition-all shadow-lg shadow-blue-200">
                  Manage Interview
                </button>
              </div>

              <div className="relative pt-4 pb-4 sm:px-6">
                 {/* Progress Bar Background */}
                 <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 -z-10 mx-6 sm:mx-12"></div>
                 
                 <div className="flex justify-between relative">
                    {[
                      { step: 'applied' as JourneyStep, label: 'Applied', date: new Date(selectedApp.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit'}) },
                      { step: 'review' as JourneyStep, label: 'Review', date: 'Ongoing' },
                      { step: 'interview' as JourneyStep, label: 'Interview', date: 'To be scheduled' },
                      { step: 'decision' as JourneyStep, label: 'Decision', date: 'Expected' }
                    ].map((s, idx) => {
                       const state = getStepStatusClass(s.step, selectedApp.status);
                       return (
                         <div key={idx} className="flex flex-col items-center flex-1">
                            {state === 'completed' ? (
                               <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                               </div>
                            ) : state === 'active' ? (
                               <div className="size-9 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center -translate-y-2 mb-1 z-10 text-[#1e3fae]">
                                  <div className="size-3.5 bg-[#1e3fae] rounded-full animate-pulse"></div>
                               </div>
                            ) : (
                               <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center mb-3"></div>
                            )}
                            <p className={`text-xs font-bold ${state === 'upcoming' ? 'text-slate-400' : 'text-slate-900'} ${state === 'active' ? 'text-[#1e3fae]' : ''}`}>{s.label}</p>
                            <p className={`text-[10px] font-medium ${state === 'active' ? 'text-blue-400' : 'text-slate-400'}`}>{s.date}</p>
                         </div>
                       )
                    })}
                 </div>
              </div>

              {/* Note from Recruiter (if rejected or specified) */}
              {selectedApp.status === 'rejected' && selectedApp.note_by_recruiter && (
                <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                  <h3 className="text-sm font-bold text-red-800 mb-1">Feedback from Employer</h3>
                  <p className="text-sm text-red-600">{selectedApp.note_by_recruiter}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

