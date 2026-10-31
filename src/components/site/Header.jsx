import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X, User, LogOut, Briefcase } from "lucide-react";

const navLinks = [
  { label: "Trang chủ", path: "/" },
  { label: "Việc làm", path: "/viec-lam" },
  { label: "Liên hệ", path: "/lien-he" },
  { label: "Trung tâm hỗ trợ", path: "/ho-tro" },
];

// Nền trắng đục (giống ô tìm kiếm ở trang chủ)
const PILL = "shrink-0 rounded-full border border-border/60 bg-card/95 shadow-sm backdrop-blur-xl";

// Mục trong pill: bình thường = chữ thường (như "Recruitment Platform"), đang ở trang đó = nền gradient chạy (giống nút "Tìm việc")
function PillLink({ to, active, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-500 transition-colors xl:px-4 xl:text-sm ${
        active ? "btn-galaxy" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </Link>
  );
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const portalPath = isAdmin ? "/hr-studio" : "/candidate-room";
  const isActive = (path) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className={`group flex items-center gap-2.5 py-1.5 pl-1.5 pr-4 xl:pr-5 ${PILL}`}>
          <img
            src="/images/logo_tron_1254.png"
            alt="X-ME NexCareer Hub"
            className="h-10 w-10 rounded-full object-cover ring-1 ring-border shadow-lg shadow-primary/25"
          />
          <div className="whitespace-nowrap leading-tight">
            <div className="text-galaxy font-heading text-[15px] font-700 tracking-tight">NexCareer Hub</div>
            <div className="hidden text-[10px] font-500 uppercase tracking-[0.18em] text-muted-foreground xl:block">Recruitment Platform</div>
          </div>
        </Link>

        <nav className={`hidden items-center gap-1 p-1.5 lg:flex ${PILL}`}>
          {navLinks.map((l) => (
            <PillLink key={l.path} to={l.path} active={isActive(l.path)}>
              {l.label}
            </PillLink>
          ))}
        </nav>

        <div className={`hidden items-center gap-1 p-1.5 lg:flex ${PILL}`}>
          {isAuthenticated ? (
            <>
              <PillLink to={portalPath} active={isActive(portalPath)} icon={isAdmin ? Building2 : User}>
                {isAdmin ? "HR Studio" : "Candidate Room"}
              </PillLink>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <PillLink to="/login" active={isActive("/login")}>Đăng nhập</PillLink>
              <PillLink to="/register" active icon={Briefcase}>Đăng ký</PillLink>
            </>
          )}
        </div>

        <button className={`grid h-11 w-11 place-items-center text-foreground lg:hidden ${PILL}`} onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-4 rounded-2xl border border-border/60 bg-card/95 px-4 py-4 shadow-lg backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <PillLink key={l.path} to={l.path} active={isActive(l.path)} onClick={() => setOpen(false)}>
                {l.label}
              </PillLink>
            ))}
            {isAuthenticated && (
              <PillLink to={portalPath} active={isActive(portalPath)} onClick={() => setOpen(false)}>
                {isAdmin ? "HR Studio" : "Candidate Room"}
              </PillLink>
            )}
            <div className="mt-2 flex gap-2">
              {isAuthenticated ? (
                <Button onClick={() => { setOpen(false); handleLogout(); }} variant="outline" size="sm" className="w-full gap-2 rounded-full">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1 rounded-full">
                    <Link to="/login" onClick={() => setOpen(false)}>Đăng nhập</Link>
                  </Button>
                  <Button asChild size="sm" className="btn-galaxy flex-1 rounded-full">
                    <Link to="/register" onClick={() => setOpen(false)}>Đăng ký</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
