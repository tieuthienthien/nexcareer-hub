import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X, User, LogOut, Briefcase } from "lucide-react";
import { Image } from "@/components/ui/image";

const navLinks = [
  { label: "Trang chủ", path: "/" },
  { label: "Việc làm", path: "/viec-lam" },
  { label: "Liên hệ", path: "/lien-he" },
  { label: "Trung tâm hỗ trợ", path: "/ho-tro" },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout(false);
    navigate("/");
  };

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
          {navLinks.map((l) => {
            const active = location.pathname === l.path || (l.path !== "/" && location.pathname.startsWith(l.path));
            return (
              <Link
                key={l.path}
                to={l.path}
                className={`rounded-lg px-3.5 py-2 text-sm font-500 transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to={isAdmin ? "/hr-studio" : "/candidate-room"}>
                  {isAdmin ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {isAdmin ? "HR Studio" : "Candidate Room"}
                </Link>
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link to="/register">
                  <Briefcase className="h-4 w-4" /> Đăng ký
                </Link>
              </Button>
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
            {navLinks.map((l) => (
              <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted">
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to={isAdmin ? "/hr-studio" : "/candidate-room"}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-500 hover:bg-muted"
              >
                {isAdmin ? "HR Studio" : "Candidate Room"}
              </Link>
            )}
            <div className="mt-2 flex gap-2">
              {isAuthenticated ? (
                <Button onClick={() => { setOpen(false); handleLogout(); }} variant="outline" size="sm" className="w-full gap-2">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/login" onClick={() => setOpen(false)}>Đăng nhập</Link>
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
  );
}