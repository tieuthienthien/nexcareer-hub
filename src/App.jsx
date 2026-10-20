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
import HrFeedback from '@/pages/hr/HrFeedback';
import HrCvJobs from '@/pages/hr/HrCvJobs';
import CvLayout from '@/components/cv/CvLayout';
import CvHome from '@/pages/cv/CvHome';
import CvJobs from '@/pages/cv/CvJobs';
import CvJobDetail from '@/pages/cv/CvJobDetail';
import CvDocuments from '@/pages/cv/CvDocuments';
import CvEditor from '@/pages/cv/CvEditor';
import CvApplications from '@/pages/cv/CvApplications';
import SupportCenter from '@/pages/SupportCenter';
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
        <Route path="/ho-tro" element={<SupportCenter />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/candidate-room" element={<CandidateRoom />} />
        </Route>
      </Route>

      <Route element={<CvLayout />}>
        <Route path="/cv" element={<CvHome />} />
        <Route path="/cv/viec-lam" element={<CvJobs />} />
        <Route path="/cv/viec-lam/:id" element={<CvJobDetail />} />
      </Route>

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<CvLayout />}>
          <Route path="/cv/quan-ly-cv" element={<CvDocuments />} />
          <Route path="/cv/cv/:id" element={<CvEditor />} />
          <Route path="/cv/ung-tuyen" element={<CvApplications />} />
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
          <Route path="feedback" element={<HrFeedback />} />
          <Route path="cv-jobs" element={<HrCvJobs />} />
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