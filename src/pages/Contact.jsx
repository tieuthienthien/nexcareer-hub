import { Facebook, Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const channels = [
  {
    icon: Facebook,
    title: "Facebook",
    value: "facebook.com/nexcareerhub",
    href: "https://facebook.com",
    desc: "Inbox trực tiếp để được hỗ trợ nhanh nhất",
  },
  {
    icon: Phone,
    title: "Hotline",
    value: "1900 1234",
    href: "tel:19001234",
    desc: "Hỗ trợ ứng viên & nhà tuyển dụng",
  },
  {
    icon: Mail,
    title: "Email tuyển dụng",
    value: "tuyendung@nexcareer.vn",
    href: "mailto:tuyendung@nexcareer.vn",
    desc: "Gửi yêu cầu hợp tác tuyển dụng",
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">
              Liên hệ
            </div>
            <h1 className="mt-5 font-heading text-4xl font-800 tracking-tight sm:text-5xl">Kết nối với chúng tôi</h1>
            <p className="mt-4 text-muted-foreground">
              Bạn có câu hỏi về ứng tuyển, hợp tác tuyển dụng hoặc muốn trở thành đối tác? Đội ngũ NexCareer Hub luôn sẵn sàng lắng nghe.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-700">Kênh liên hệ</h2>
            <div className="mt-6 space-y-4">
              {channels.map((c) => (
                <a
                  key={c.title}
                  href={c.href}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-600">{c.title}</div>
                    <div className="mt-0.5 text-sm text-primary group-hover:underline">{c.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/50 p-5 text-sm">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-600">Giờ làm việc</div>
                <div className="mt-1 text-muted-foreground">Thứ 2 – Thứ 6: 8:00 – 18:00 · Thứ 7: 8:00 – 12:00</div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-muted/50 p-5 text-sm">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-600">Văn phòng</div>
                <div className="mt-1 text-muted-foreground">Tòa nhà NexCareer, Quận 1, TP. Hồ Chí Minh</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
            <h2 className="font-heading text-2xl font-700">Gửi tin nhắn</h2>
            <p className="mt-2 text-sm text-muted-foreground">Để lại thông tin, chúng tôi sẽ phản hồi trong 24h.</p>
            {sent ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-primary/5 py-16 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-white">
                  <Send className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-600">Đã gửi thông tin!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Cảm ơn bạn, chúng tôi sẽ liên hệ sớm.</p>
                <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>Gửi thêm</Button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input id="name" required placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required placeholder="you@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Chủ đề</Label>
                  <Input id="subject" placeholder="Hợp tác tuyển dụng" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg">Nội dung</Label>
                  <Textarea id="msg" rows={5} required placeholder="Mô tả nhu cầu của bạn..." />
                </div>
                <Button type="submit" size="lg" className="w-full gap-2">
                  <Send className="h-4 w-4" /> Gửi thông tin
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}