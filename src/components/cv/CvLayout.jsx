import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, Menu, X, ArrowUpRight } from "lucide-react";

const links = [
  { to: "/cv", label: "Trang chủ", end: true },
  { to: "/cv/viec-lam", label: "Việc làm" },
  { to: "/cv/quan-ly-cv", label: "Quản lý CV" },
  { to: "/cv/ung-tuyen", label: "Đơn ứng tuyển" },
];

export default function CvLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout(false);
    navigate("/cv");
  };

  const navClass = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-sm font-500 transition-colors ${
      isActive ? "bg-primary/10 text-primary" : "text-foreground/65 hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="cvsite min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/cv" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[13px] font-800 tracking-tight text-primary-foreground shadow-sm">
              CV
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-[15px] font-700 tracking-tight">NexCareer CV</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Nexora Candidate Network</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-foreground/70">
              <Link to="/">
                NexCareer Hub <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {isAuthenticated ? (
              <>
                <Button asChild size="sm" className="gap-2 rounded-full">
                  <Link to="/cv/cv/new">
                    <FileText className="h-4 w-4" /> Tạo CV
                  </Link>
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login?returnTo=/cv">Đăng nhập</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted">
                  {l.label}
                </Link>
              ))}
              <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted">
                Về NexCareer Hub
              </Link>
              <div className="mt-2 flex gap-2">
                {isAuthenticated ? (
                  <>
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/cv/cv/new" onClick={() => setOpen(false)}>Tạo CV</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setOpen(false); handleLogout(); }} className="gap-2">
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/login?returnTo=/cv" onClick={() => setOpen(false)}>Đăng nhập</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/register" onClick={() => setOpen(false)}>Đăng ký</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="font-heading font-700 text-foreground">NexCareer CV</div>
            <div className="mt-1 text-xs">Nền tảng CV & việc làm vận hành cùng Nexora Technology.</div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/cv/viec-lam" className="hover:text-foreground">Việc làm</Link>
            <Link to="/cv/quan-ly-cv" className="hover:text-foreground">Quản lý CV</Link>
            <Link to="/ho-tro" className="hover:text-foreground">Trung tâm hỗ trợ</Link>
            <Link to="/" className="hover:text-foreground">NexCareer Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}