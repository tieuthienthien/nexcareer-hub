import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Video, Search, Sparkles, CheckCircle2 } from "lucide-react";

const sections = [
  {
    id: "cv",
    icon: FileText,
    title: "Viết CV ấn tượng",
    items: [
      { q: "Cấu trúc CV chuẩn nên có những mục gì?", a: "Thông tin liên hệ, Tiêu đề hồ sơ, Kinh nghiệm, Học vấn, Kỹ năng, Dự án. Sắp xếp theo thứ tự quan trọng với vị trí bạn ứng tuyển." },
      { q: "Làm sao để CV dễ qua hệ thống ATS?", a: "Dùng font phổ biến (Arial, Calibri), bố cục một cột, tiêu đề mục chuẩn, tránh bảng/cột phức tạp. Lưu PDF để định dạng không lệch." },
      { q: "Mô tả kinh nghiệm thế nào cho thuyết phục?", a: "Dùng gạch đầu dòng, bắt đầu bằng động từ mạnh, kèm số liệu: 'Tối ưu API giảm 40% thời gian phản hồi'. Số liệu cụ thể đáng tin hơn chữ chung chung." },
      { q: "Khi chưa có nhiều kinh nghiệm thì làm gì?", a: "Đưa dự án cá nhân, thực tập, hoạt động học thuật lên trên. Nhấn kỹ năng có bằng chứng (repo, demo, giải thưởng)." },
    ],
  },
  {
    id: "interview",
    icon: Video,
    title: "Chuẩn bị phỏng vấn",
    items: [
      { q: "Trả lời câu hành vi theo STAR là gì?", a: "Situation (bối cảnh) → Task (nhiệm vụ) → Action (bạn làm gì) → Result (kết quả, có số liệu). Ngắn gọn, tập trung vai trò của bạn." },
      { q: "Chuẩn bị phỏng vấn kỹ thuật thế nào?", a: "Ôn kiến thức nền của vị trí, luyện giải bài thành tiếng, tập giải thích tư duy. Chuẩn bị 1–2 dự án để kể có số liệu và bài học." },
      { q: "Phỏng vấn video AI trên NexCareer Hub cần gì?", a: "Webcam + micro tốt, phòng yên tĩnh, đủ sáng. Trả lời rõ ràng, nhìn camera. AI chấm nội dung trả lời, không phải ngoại hình hay giọng nói." },
      { q: "Nói về điểm yếu thế nào?", a: "Nêu một điểm yếu thật nhưng đang cải thiện kèm hành động cụ thể. Tránh điểm yếu thiếu liên quan hoặc câu 'tôi hoàn hảo quá'." },
    ],
  },
  {
    id: "search",
    icon: Search,
    title: "Chiến lược tìm việc",
    items: [
      { q: "Tìm việc phù hợp kỹ năng thế nào?", a: "Đọc kỹ yêu cầu, ưu tiên vị trí khớp 60–70% kỹ năng cốt lõi. Dùng bộ lọc địa điểm, loại hình, lĩnh vực trên NexCareer Hub để thu hẹp." },
      { q: "Ứng tuyển bao nhiêu vị trí là hợp lý?", a: "Chất lượng hơn số lượng. Tùy chỉnh CV cho từng vị trí, nộp 5–10 vị trí thật phù hợp tốt hơn 50 vị trí chung chung." },
      { q: "Lưu việc làm để xem lại sau được không?", a: "Có. Trên trang chi tiết việc làm, nhấn 'Lưu việc'. Danh sách lưu ở mục Việc đã lưu." },
      { q: "Theo dõi tình trạng ứng tuyển ở đâu?", a: "Mục Theo dõi hồ sơ hiển thị tiến trình 3 vòng: sàng lọc CV, bài thi, phỏng vấn AI, kèm quyết định cuối của HR." },
    ],
  },
];

export default function CareerGuide() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-600 text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Hướng nghiệp NexCareer
        </div>
        <h1 className="mt-4 font-heading text-3xl font-800 tracking-tight sm:text-4xl">Hành trang ứng tuyển</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Cẩm nang CV, phỏng vấn và chiến lược tìm việc để bạn tự tin vượt qua 3 vòng tuyển dụng.</p>
      </div>

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.id} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-6 w-6" /></div>
              <h2 className="font-heading text-xl font-700">{s.title}</h2>
            </div>
            <Accordion type="single" collapsible className="mt-5">
              {s.items.map((it, i) => (
                <AccordionItem key={i} value={`${s.id}-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-600 hover:no-underline">{it.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
        <h3 className="mt-3 font-heading text-lg font-700">Sẵn sàng ứng tuyển?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Khám phá việc làm phù hợp và bắt đầu hành trình của bạn.</p>
        <a href="/viec-lam" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground hover:bg-primary/90">Xem việc làm</a>
      </div>
    </div>
  );
}