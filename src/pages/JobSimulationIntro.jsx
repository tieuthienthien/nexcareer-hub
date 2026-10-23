import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bug, Code2, MessageSquare, Siren, Clock, Award, Sparkles, Lock } from "lucide-react";

const ROUNDS = [
  { step: "Vòng 1", title: "AI chấm CV theo JD", desc: "Hệ thống đối chiếu CV với nhãn của JD, HR là người duyệt cuối cùng." },
  { step: "Vòng 2", title: "Job Simulation", desc: "Bạn nhận lời mời làm bài mô phỏng công việc thật của vị trí đang ứng tuyển." },
  { step: "Vòng 3", title: "Phỏng vấn Line Manager", desc: "Trao đổi trực tiếp với quản lý chuyên môn về cách bạn xử lý công việc." },
];

const TASKS = [
  { icon: Bug, title: "Sửa lỗi sản xuất", desc: "Đọc ticket, sửa hàm tính giá bị sai giảm giá, chạy bộ test tự động.", points: 30 },
  { icon: Code2, title: "Viết tính năng mới", desc: "Nhận yêu cầu từ Product Manager và viết rate limiter có kiểm thử.", points: 30 },
  { icon: Siren, title: "Xử lý sự cố", desc: "Quyết định bước xử lý khi production lỗi lúc 2 giờ sáng.", points: 20 },
  { icon: MessageSquare, title: "Giao tiếp công việc", desc: "Viết báo cáo ngắn cho trưởng nhóm và PM về nguyên nhân, cách sửa, rủi ro.", points: 20 },
];

export default function JobSimulationIntro() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <Badge className="rounded-full border-0 bg-primary/10 text-primary">Vòng 2 · Quy trình tuyển dụng Nexora</Badge>
        <h1 className="mt-3 font-heading text-3xl font-700 leading-tight sm:text-4xl">Job Simulation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70 sm:text-base">
          Job Simulation là bài mô phỏng tình huống công việc thực tế tại Nexora Technology, dùng để đánh giá năng lực ứng viên
          thay cho bài thi lý thuyết. Ứng viên chỉ làm bài khi được HR gửi lời mời ở Vòng 2.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild className="gap-2"><Link to="/viec-lam">Xem vị trí đang tuyển <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to="/ho-tro">Câu hỏi thường gặp</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {ROUNDS.map((r) => (
          <div key={r.step} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] font-700 uppercase tracking-wider text-primary">{r.step}</p>
            <h3 className="mt-1 text-sm font-700">{r.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-lg font-700">Bài mô phỏng mẫu</h2>
              <p className="text-xs text-muted-foreground">Một ngày làm Software Engineer tại Nexora Technology</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><Clock className="h-3 w-3" /> 60 phút</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><Award className="h-3 w-3" /> Đạt từ 80/100</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TASKS.map((t) => (
              <div key={t.title} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><t.icon className="h-4 w-4" /></span>
                  <span className="text-[11px] font-700 text-muted-foreground">{t.points} điểm</span>
                </div>
                <p className="mt-2 text-xs font-700">{t.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Bạn không thể tự làm bài từ trang này. Khi hồ sơ qua Vòng 1, HR gửi email kèm link làm bài riêng (có hạn nộp). Đạt từ 80 điểm, bạn nhận Chứng nhận Nexora.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-700">Ngành khác</h2>
          <p className="mt-1 text-xs text-muted-foreground">Chúng tôi đang xây thêm bài mô phỏng cho các nhóm nghề khác.</p>
          <div className="mt-3 space-y-2">
            {["UX/UI Designer", "IoT Engineer", "Nhân sự (HR)"].map((name) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2.5">
                <span className="text-xs font-600 text-foreground/70">{name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-600 text-muted-foreground"><Sparkles className="h-3 w-3" /> Sắp ra mắt</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}