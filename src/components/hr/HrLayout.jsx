import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, LogOut, LayoutDashboard, FileText, Users, MessageCircle, GitCompare, MessageSquare, Sparkles, CalendarClock, GraduationCap, Workflow, UserCog, Palette, Mail } from "lucide-react";
import { Image } from "@/components/ui/image";
import StarRainClick from "@/components/StarRainClick";
import HrChatbotNotifications from "@/components/hr/rms/HrChatbotNotifications";
import ManagerWorkspace from "@/pages/hr/ManagerWorkspace";

const mainNav = [
  { label: "Tổng quan", path: "/hr-studio", icon: LayoutDashboard, end: true },
  { label: "Hồ sơ ứng viên", path: "/hr-studio/applications", icon: Users },
  { label: "Tiến trình", path: "/hr-studio/pipeline", icon: Workflow },
  { label: "Line Manager", path: "/hr-studio/manager", icon: UserCog },
];

const moreNav = [
  { label: "Việc làm", path: "/hr-studio/jobs", icon: FileText },
  { label: "Tạo JD", path: "/hr-studio/jd", icon: Sparkles },
  { label: "Lịch phỏng vấn", path: "/hr-studio/schedule", icon: CalendarClock },
  { label: "Khóa học", path: "/hr-studio/courses", icon: GraduationCap },
  { label: "So sánh", path: "/hr-studio/compare", icon: GitCompare },
  { label: "Chatbot", path: "/hr-studio/chatbot", icon: MessageCircle },
  { label: "Phản hồi", path: "/hr-studio/feedback", icon: MessageSquare },
  { label: "Mẫu email", path: "/hr-studio/email-templates", icon: Mail },
  { label: "Design web", path: "/hr-studio/design", icon: Palette },
];

export default function HrLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30 p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-heading text-xl font-700">Đang tải HR Studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">Vui lòng đăng nhập để tiếp tục.</p>
        </div>
      </div>
    );
  }

  // Line Manager: chỉ thấy workspace của mình, không thấy dữ liệu phòng ban khác.
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/133362060_PhihnhgiaX-MEgiangnhmngm.png"
              alt="X-ME NexCareer Hub"
              fittingType="fill"
              focalPointY={0.32}
              className="h-8 w-8 rounded-full ring-1 ring-border"
            />
            <div className="leading-tight">
              <div className="font-heading text-sm font-700">HR Studio · Line Manager</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2"><Link to="/"><ArrowLeft className="h-4 w-4" /> Trang chủ</Link></Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Đăng xuất"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <ManagerWorkspace />
        </main>
        <StarRainClick />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Image
            src="https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/133362060_PhihnhgiaX-MEgiangnhmngm.png"
            alt="X-ME NexCareer Hub"
            fittingType="fill"
            focalPointY={0.32}
            className="h-9 w-9 rounded-full ring-1 ring-border"
          />
          <div className="leading-tight">
            <div className="font-heading text-sm font-700">HR Studio</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">NexCareer Hub</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {mainNav.map((n) => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-500 transition-colors hover:bg-muted hover:text-foreground ${
                    isActive ? "bg-primary/10 text-primary font-600" : "text-foreground/70"
                  }`
                }
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-5 px-3 text-[10px] font-700 uppercase tracking-wider text-muted-foreground">Công cụ khác</div>
          <div className="mt-1 space-y-1">
            {moreNav.map((n) => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-500 transition-colors hover:bg-muted hover:text-foreground ${
                    isActive ? "bg-primary/10 text-primary font-600" : "text-foreground/60"
                  }`
                }
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="border-t border-border p-3">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-500 text-foreground/70 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Về NexCareer Hub
          </Link>
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-700 text-primary">
              {(user?.full_name || user?.email || "HR")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-600">{user?.full_name || "HR"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground" aria-label="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src="https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/133362060_PhihnhgiaX-MEgiangnhmngm.png"
              alt="X-ME NexCareer Hub"
              fittingType="fill"
              focalPointY={0.32}
              className="h-8 w-8 rounded-full ring-1 ring-border"
            />
            <span className="font-heading text-sm font-700">HR Studio</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-heading text-lg font-600">Trung tâm quản lý tuyển dụng</h1>
          </div>
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-500 text-foreground/70 hover:bg-muted lg:hidden">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <HrChatbotNotifications />
      <StarRainClick />
    </div>
  );
}