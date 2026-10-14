import { Link } from "react-router-dom";
import { Facebook, Phone, Mail, MapPin } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Image
                src="https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/133362060_PhihnhgiaX-MEgiangnhmngm.png"
                alt="X-ME NexCareer Hub"
                fittingType="fill"
                focalPointY={0.32}
                className="h-10 w-10 rounded-xl ring-1 ring-border"
              />
              <span className="font-heading text-[15px] font-700">NexCareer Hub</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nền tảng tuyển dụng hiện đại kết nối ứng viên tài năng với nhà tuyển dụng hàng đầu tại Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-600">Khám phá</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Trang chủ</Link></li>
              <li><Link to="/viec-lam" className="hover:text-primary">Việc làm</Link></li>
              <li><Link to="/candidate-room" className="hover:text-primary">Candidate Room</Link></li>
              <li><Link to="/hr-studio" className="hover:text-primary">HR Studio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-600">Hỗ trợ</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/lien-he" className="hover:text-primary">Liên hệ</Link></li>
              <li><a href="#" className="hover:text-primary">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-primary">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-600">Kết nối</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Facebook className="h-4 w-4 text-primary" /> facebook.com/nexcareerhub</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Hotline: 1900 1234</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> tuyen dung@nexcareer.vn</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> TP. Hồ Chí Minh</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} NexCareer Hub. Mọi quyền được bảo lưu.</p>
          <p>Thiết kế cho ứng viên & nhà tuyển dụng Việt Nam.</p>
        </div>
      </div>
    </footer>
  );
}