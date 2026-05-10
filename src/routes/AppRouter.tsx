import { Routes, Route, BrowserRouter } from "react-router-dom";

// Layouts
import PublicLayout from "../layouts/PublicLayout";
import CandidateLayout from "../layouts/CandidateLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import AdminLayout from "../layouts/AdminLayout";

// Public Pages
import Home from "../pages/public/Home";
import Login from "../pages/public/Login";

// Candidate Pages
import CandidateDashboard from "../pages/candidate/Dashboard";
import CandidateProfile from "../pages/candidate/Profile";
import RecommendedJobs from "../pages/candidate/RecommendedJobs";
import ApplyJob from "../pages/candidate/ApplyJob";
import JobDetail from "../pages/candidate/JobDetail";
import MyApplications from "../pages/candidate/MyApplications";
// import ApplicationDetailModal from "../pages/candidate/ApplicationDetailModal";
// Recruiter Pages
import RecruiterDashboard from "../pages/recruiter/Dashboard";
import RecruiterCompanyProfile from "../pages/recruiter/CompanyProfile";
import RecruiterPostJob from "../pages/recruiter/PostJob";
import RecruiterJobsManager from "../pages/recruiter/JobsManager";
import RecruiterCandidatesManager from "../pages/recruiter/CandidatesManager";
import RecruiterCandidateDetail from "../pages/recruiter/candidateDetail";
import RecruiterJobDetail from "../pages/recruiter/JobDetail";

// Admin Pages
import AdminDashboard from "../pages/admin/Dashboard";
import AdminJobReview from "../pages/admin/JobReview";
import AdminCompanyReview from "../pages/admin/CompanyReview";

// AppRouter defines the main routing structure for the application.
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
        
        {/* Auth routes don't usually need the full Public Layout, but for simplicity here */}
        <Route path="/login" element={<Login />} />

        {/* CANDIDATE ROUTES */}
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<CandidateDashboard />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="recommended" element={<RecommendedJobs />} />
          <Route path="jobs/:jobId" element={<JobDetail />} />
          <Route path="apply/:jobId" element={<ApplyJob />} />
          <Route path="applications" element={<MyApplications />} />
        </Route>

        {/* RECRUITER ROUTES */}
        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="company-profile" element={<RecruiterCompanyProfile />} />
          <Route path="post-job" element={<RecruiterPostJob />} />
          <Route path="jobs" element={<RecruiterJobsManager />} />
          <Route path="jobs/:id" element={<RecruiterJobDetail />} />
          <Route path="candidates" element={<RecruiterCandidatesManager />} />
          <Route path="candidates/:applicationId" element={<RecruiterCandidateDetail />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="jobs" element={<AdminJobReview />} />
          <Route path="companies" element={<AdminCompanyReview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
