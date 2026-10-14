import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Menu, X, User, LogOut, Briefcase, Bell, ChevronDown, Settings, Bookmark,
  FileText, Users, CalendarClock, BarChart3, Home, Building2, Compass, Mail, ClipboardList,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";

const publicNav = [
  { label: "Trang chủ", path: "/", icon: Home, exact: true },
  { label: "Việc làm", path: "/viec-lam", icon: Briefcase },
  { label: "Liên hệ", path: "/lien-he", icon: Mail },
];
const exploreNav = [
  { label: "Công ty", path: "/cong-ty", icon: Building2 },
  { label: "Hướng nghiệp", path: "/huong-nghiep", icon: Compass },
];
const candidateNav = [
  { label: "Tổng quan", path: "/candidate-room", icon: Home },
  { label: "Việc làm", path: "/viec-lam", icon: Briefcase },
  { label: "Theo dõi hồ sơ", path: "/ho-so-ung-tuyen", icon: ClipboardList },
  { label: "Việc đã lưu", path: "/viec-da-luu", icon: Bookmark },
];
const recruiterNav = [
  { label: "HR Studio", path: "/hr-studio", icon: Building2, exact: true },
  { label: "Tin tuyển dụng", path: "/hr-studio/jobs", icon: FileText },
  { label: "Quản lý ứng viên", path: "/hr-studio/applications", icon: Users },
  { label: "Lịch phỏng vấn", path: "/hr-studio/lich-phong-van", icon: CalendarClock },
  { label: "Báo cáo", path: "/hr-studio/bao-cao", icon: BarChart3 },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

  useEffect(() => {
    if (!isAuthenticated) { setUnread(0); return; }
    let on = true;
    (async () => {
      try { const c = await base44.entities.Notification.count({ read: false }); if (on) setUnread(c || 0); }
      catch { if (on) setUnread(0); }
    })();
    return () => { on = false; };
  }, [isAuthenticated, location.pathname]);

  const isActive = (path, exact) => {
    if (exact || path === "/") return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const nav = isAdmin ? recruiterNav : isAuthenticated ? candidateNav : publicNav;
  const profileLink = isAdmin ? "/tai-khoan/cai-dat" : "/candidate-room";

  const AccountMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 transition-colors hover:bg-muted">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-700 text-primary">
            {(user?.full_name || user?.email || "U")[0].toUpperCase()}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-600 truncate">{user?.full_name || "Tài khoản"}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to={profileLink} className="flex items-center gap-2"><User className="h-4 w-4" /> Hồ sơ cá nhân</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/tai-khoan/cai-dat" className="flex items-center gap-2"><Settings className="h-4 w-4" /> Cài đặt tài khoản</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-rose-600 focus:text-rose-600"><LogOut className="h-4 w-4" /> Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const NavItem = ({ l }) => {
    const active = isActive(l.path, l.exact);
    return (
      <Link
        to={l.path}
        className={`rounded-lg px-3 py-2 text-sm font-500 transition-colors ${active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}
      >
        {l.label}
      </Link>
    );
  };

  const ExploreDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-500 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground">
          Khám phá <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {exploreNav.map((e) => (
          <DropdownMenuItem asChild key={e.path}>
            <Link to={e.path} className="flex items-center gap-2"><e.icon className="h-4 w-4" /> {e.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <Image
            src="https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/133362060_PhihnhgiaX-MEgiangnhmngm.png"
            alt="X-ME NexCareer Hub"
            fittingType="fill"
            focalPointY={0.32}
            className="h-10 w-10 rounded-full ring-1 ring-border shadow-lg shadow-primary/25"
          />
          <div className="leading-tight">
            <div className="font-heading text-[15px] font-700 tracking-tight">NexCareer Hub</div>
            <div className="text-[10px] font-500 uppercase tracking-[0.18em] text-muted-foreground">Recruitment Platform</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((l) => <NavItem key={l.path} l={l} />)}
          {!isAuthenticated && <ExploreDropdown />}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Link to="/thong-bao" className="relative rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-foreground" aria-label="Thông báo">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-700 text-white">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
              <AccountMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Đăng nhập</Link></Button>
              <Button asChild size="sm" className="gap-2"><Link to="/register"><Briefcase className="h-4 w-4" /> Đăng ký</Link></Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((l) => (
              <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 ${isActive(l.path, l.exact) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            {!isAuthenticated && exploreNav.map((e) => (
              <Link key={e.path} to={e.path} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted">
                <e.icon className="h-4 w-4" /> {e.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link to="/thong-bao" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted">
                  <Bell className="h-4 w-4" /> Thông báo {unread > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-700 text-white">{unread}</span>}
                </Link>
              </>
            )}
            <div className="mt-2 border-t border-border pt-3">
              {isAuthenticated ? (
                <div className="flex flex-col gap-1">
                  <Link to={profileLink} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted"><User className="h-4 w-4" /> Hồ sơ cá nhân</Link>
                  <Link to="/tai-khoan/cai-dat" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted"><Settings className="h-4 w-4" /> Cài đặt tài khoản</Link>
                  <button onClick={() => { setOpen(false); handleLogout(); }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-500 text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Đăng xuất</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/login" onClick={() => setOpen(false)}>Đăng nhập</Link></Button>
                  <Button asChild size="sm" className="flex-1"><Link to="/register" onClick={() => setOpen(false)}>Đăng ký</Link></Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}