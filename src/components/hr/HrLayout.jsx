import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Building2, ArrowLeft, LogOut, LayoutDashboard, FileText, Users, MessageCircle, GitCompare, MessageSquare, CalendarClock, GraduationCap, Mail } from "lucide-react";
import StarRainClick from "@/components/StarRainClick";
import HrChatbotNotifications from "@/components/hr/rms/HrChatbotNotifications";
import ManagerWorkspace from "@/pages/hr/ManagerWorkspace";
import UserAvatar from "@/components/UserAvatar";

const mainNav = [
  { label: "Tổng quan", path: "/hr-studio", icon: LayoutDashboard, end: true },
  { label: "Việc làm", path: "/hr-studio/jobs", icon: FileText },
  { label: "Hồ sơ ứng viên", path: "/hr-studio/applications", icon: Users },
  { label: "Lịch phỏng vấn", path: "/hr-studio/schedule", icon: CalendarClock },
];

const moreNav = [
  { label: "Job Simulation", path: "/hr-studio/job-simulations", icon: GraduationCap },
  { label: "So sánh", path: "/hr-studio/compare", icon: GitCompare },
  { label: "Chatbot", path: "/hr-studio/chatbot", icon: MessageCircle },
  { label: "Phản hồi", path: "/hr-studio/feedback", icon: MessageSquare },
  { label: "Mẫu email", path: "/hr-studio/email-templates", icon: Mail },
];

// Nền trắng đục + mục đang chọn là gradient chạy: cùng phong cách với Header của trang chủ
const PILL = "rounded-full border border-border/60 bg-card/95 shadow-sm backdrop-blur-xl";

function Logo({ className = "h-9 w-9" }) {
  return (
    <img
      src="/images/logo_tron_1254.png"
      alt="X-ME NexCareer Hub"
      className={`${className} shrink-0 rounded-full object-cover ring-1 ring-border shadow-lg shadow-primary/25`}
    />
  );
}

function SideLink({ n }) {
  return (
    <NavLink
      to={n.path}
      end={n.end}
      className={({ isActive }) =>
        `flex items-center gap-3 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-500 transition-colors ${
          isActive ? "btn-galaxy" : "border-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        }`
      }
    >
      <n.icon className="h-4 w-4 shrink-0" /> {n.label}
    </NavLink>
  );
}

function TopLink({ n }) {
  return (
    <NavLink
      to={n.path}
      end={n.end}
      className={({ isActive }) =>
        `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-[13px] font-500 transition-colors ${
          isActive ? "btn-galaxy" : "border-transparent text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        }`
      }
    >
      <n.icon className="h-4 w-4 shrink-0" /> {n.label}
    </NavLink>
  );
}

function GalaxyShell({ children, overlay }) {
  return (
    <div className="galaxy galaxy-bg relative min-h-screen">
      <div aria-hidden="true" className="starfield pointer-events-none absolute inset-0 animate-twinkle opacity-60" />
      <div className="relative z-10 min-h-screen">{children}</div>
      {overlay}
    </div>
  );
}

export default function HrLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

  if (!user) {
    return (
      <GalaxyShell>
        <div className="grid min-h-screen place-items-center p-6">
          <div className={`max-w-md rounded-3xl p-8 text-center ${PILL}`}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="mt-5 font-heading text-xl font-700">Đang tải HR Studio</h1>
            <p className="mt-2 text-sm text-muted-foreground">Vui lòng đăng nhập để tiếp tục.</p>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  // Line Manager: chỉ thấy workspace của mình, không thấy dữ liệu phòng ban khác.
  if (user.role !== "admin") {
    return (
      <GalaxyShell overlay={<StarRainClick />}>
        <header className={`sticky top-3 z-30 mx-4 mt-3 flex h-14 items-center justify-between gap-3 px-3 sm:mx-6 lg:mx-8 ${PILL}`}>
          <Link to="/" className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80">
            <Logo className="h-9 w-9" />
            <div className="min-w-0 leading-tight">
              <div className="text-galaxy truncate font-heading text-sm font-700">HR Studio · Line Manager</div>
              <div className="hidden truncate text-[10px] uppercase tracking-wider text-muted-foreground sm:block">{user.email}</div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Link to="/" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-500 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Trang chủ
            </Link>
            <button type="button" onClick={handleLogout} aria-label="Đăng xuất" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <ManagerWorkspace />
        </main>
      </GalaxyShell>
    );
  }

  return (
    <GalaxyShell
      overlay={
        <>
          <HrChatbotNotifications />
          <StarRainClick />
        </>
      }
    >
      <aside className="fixed inset-y-3 left-3 z-30 hidden w-60 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-sm backdrop-blur-xl lg:flex">
        <Link to="/" className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/60 px-4 transition-colors hover:bg-primary/5">
          <Logo className="h-10 w-10" />
          <div className="leading-tight">
            <div className="text-galaxy font-heading text-[15px] font-700 tracking-tight">HR Studio</div>
            <div className="text-[10px] font-500 uppercase tracking-[0.18em] text-muted-foreground">NexCareer Hub</div>
          </div>
        </Link>
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="px-3 pb-1 text-[10px] font-700 uppercase tracking-wider text-muted-foreground">Tuyển dụng</div>
          <div className="space-y-1">
            {mainNav.map((n) => (
              <SideLink key={n.path} n={n} />
            ))}
          </div>
          <div className="mt-5 px-3 pb-1 text-[10px] font-700 uppercase tracking-wider text-muted-foreground">Công cụ khác</div>
          <div className="space-y-1">
            {moreNav.map((n) => (
              <SideLink key={n.path} n={n} />
            ))}
          </div>
        </nav>
        <div className="shrink-0 border-t border-border/60 p-3">
          <Link to="/" className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-500 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Về NexCareer Hub
          </Link>
          <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-primary/5 px-3 py-2.5">
            <UserAvatar name={user?.full_name} email={user?.email} size={32} />
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

      <div className="lg:pl-[16.5rem]">
        <header className={`sticky top-3 z-20 mx-4 mt-3 flex h-14 items-center justify-between gap-3 px-3 sm:mx-6 lg:mx-8 lg:px-6 ${PILL}`}>
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="text-galaxy font-heading text-sm font-700">HR Studio</span>
          </Link>
          <div className="hidden lg:block">
            <h1 className="text-galaxy font-heading text-lg font-600">Trung tâm quản lý tuyển dụng</h1>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-500 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground lg:hidden">
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>
        </header>

        {/* Màn hình nhỏ: không có sidebar nên hiện thanh tag cuộn ngang */}
        <nav className={`mx-4 mt-3 flex gap-1 overflow-x-auto p-1.5 sm:mx-6 lg:hidden ${PILL}`}>
          {[...mainNav, ...moreNav].map((n) => (
            <TopLink key={n.path} n={n} />
          ))}
        </nav>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </GalaxyShell>
  );
}
