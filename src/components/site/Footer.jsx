import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";

export default function Footer() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/logo_tron_1254.png"
                alt="X-ME NexCareer Hub"
                fittingType="fill"
                focalPointY={0.32}
                className="h-10 w-10 rounded-full ring-1 ring-border"
              />
              <span className="font-heading text-[15px] font-700">
                NexCareer Hub
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Cổng tuyển dụng của Nexora Technology - công ty phần mềm tại TP. Hồ Chí Minh.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-600">Khám phá</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/viec-lam" className="hover:text-primary">
                  Việc làm
                </Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link to={isAdmin ? "/hr-studio" : "/candidate-room"} className="hover:text-primary">
                    {isAdmin ? "HR Studio" : "Candidate Room"}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-600">Hỗ trợ</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/lien-he" className="hover:text-primary">
                  Liên hệ
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-600">Kết nối</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                +84 969 536 234
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                email@nexoratechno.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                TP. Hồ Chí Minh
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="text-center">
            © {new Date().getFullYear()} NexCareer Hub. Mọi quyền được bảo lưu.
          </p>

          <p className="max-w-3xl text-center leading-relaxed">
            Website là sản phẩm dự thi SpawnX 2026: POWER UP THE BIZ CHALLENGE
            - Chủ đề CTRL + BUILD
          </p>

          <p className="text-center">
            Nexora Technology · TP. Hồ Chí Minh
          </p>
        </div>
      </div>
    </footer>
  );
}