import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Chặn truy cập chéo giữa khu vực HR Studio (admin) và Candidate Room (ứng viên).
 * allow="admin"  → chỉ HR được vào, ứng viên bị đưa về Candidate Room.
 * allow="candidate" → ứng viên vào Candidate Room, HR bị đưa về HR Studio.
 */
export default function RoleGuard({ allow = "admin" }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  if (allow === "admin" && !isAdmin) {
    return <Navigate to="/candidate-room" replace />;
  }
  if (allow === "candidate" && isAdmin) {
    return <Navigate to="/hr-studio" replace />;
  }

  return <Outlet />;
}