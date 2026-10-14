import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import SiteLayout from '@/components/site/SiteLayout';
import HrLayout from '@/components/hr/HrLayout';
import Home from '@/pages/Home';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetail';
import CandidateRoom from '@/pages/CandidateRoom';
import Contact from '@/pages/Contact';
import HrDashboard from '@/pages/hr/HrDashboard';
import HrJobs from '@/pages/hr/HrJobs';
import HrApplications from '@/pages/hr/HrApplications';
import HrChatbot from '@/pages/hr/HrChatbot';
import HrCompare from '@/pages/hr/HrCompare';
import HrSchedule from '@/pages/hr/HrSchedule';
import HrReports from '@/pages/hr/HrReports';
import Companies from '@/pages/Companies';
import CareerGuide from '@/pages/CareerGuide';
import ApplicationTracking from '@/pages/ApplicationTracking';
import SavedJobs from '@/pages/SavedJobs';
import Notifications from '@/pages/Notifications';
import AccountSettings from '@/pages/AccountSettings';
import AssessmentTest from '@/pages/AssessmentTest';
import AssessmentInterview from '@/pages/AssessmentInterview';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/viec-lam" element={<Jobs />} />
        <Route path="/viec-lam/:id" element={<JobDetail />} />
        <Route path="/lien-he" element={<Contact />} />
        <Route path="/cong-ty" element={<Companies />} />
        <Route path="/huong-nghiep" element={<CareerGuide />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/candidate-room" element={<CandidateRoom />} />
          <Route path="/ho-so-ung-tuyen" element={<ApplicationTracking />} />
          <Route path="/viec-da-luu" element={<SavedJobs />} />
          <Route path="/thong-bao" element={<Notifications />} />
          <Route path="/tai-khoan/cai-dat" element={<AccountSettings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/phong-thi/:applicationId" element={<AssessmentTest />} />
        <Route path="/phong-van/:applicationId" element={<AssessmentInterview />} />
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/hr-studio" element={<HrLayout />}>
          <Route index element={<HrDashboard />} />
          <Route path="jobs" element={<HrJobs />} />
          <Route path="applications" element={<HrApplications />} />
          <Route path="compare" element={<HrCompare />} />
          <Route path="chatbot" element={<HrChatbot />} />
          <Route path="lich-phong-van" element={<HrSchedule />} />
          <Route path="bao-cao" element={<HrReports />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App