import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, LogOut, LayoutDashboard, FileText, Users, MessageCircle } from "lucide-react";
import StarRainClick from "@/components/StarRainClick";

const hrNav = [
  { label: "Tổng quan", path: "/hr-studio", icon: LayoutDashboard, end: true },
  { label: "Việc làm", path: "/hr-studio/jobs", icon: FileText },
  { label: "Ứng viên", path: "/hr-studio/applications", icon: Users },
  { label: "Chatbot", path: "/hr-studio/chatbot", icon: MessageCircle },
];

export default function HrLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

  if (user && user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30 p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-heading text-xl font-700">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            HR Studio dành riêng cho nhà tuyển dụng. Tài khoản của bạn không có quyền quản trị.
          </p>
          <Button asChild className="mt-6"><Link to="/">Về trang chủ</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-heading text-sm font-700">HR Studio</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">NexCareer Hub</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {hrNav.map((n) => (
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
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
              <Building2 className="h-4 w-4" />
            </div>
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
      <StarRainClick />
    </div>
  );
}