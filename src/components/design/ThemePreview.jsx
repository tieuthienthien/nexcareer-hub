import { Sparkles, Users } from "lucide-react";
import { previewStyles } from "@/lib/siteDesign";

export default function ThemePreview({ theme, background }) {
  const s = previewStyles(theme, background);
  return (
    <div style={s.page} className="overflow-hidden p-5 shadow-lg">
      <div className="flex items-center justify-between text-[11px] font-600 opacity-80">
        <span>NexCareer Hub</span>
        <div className="flex gap-2">
          <span>Việc làm</span>
          <span>Khóa học</span>
          <span>Liên hệ</span>
        </div>
      </div>

      <div
        className="mt-6 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-600"
        style={s.card}
      >
        <Sparkles className="h-3 w-3" style={{ color: theme.primary }} />
        <span style={{ color: theme.primary }}>Cổng tuyển dụng</span>
      </div>

      <h4 className="mt-3 text-xl font-800 leading-tight" style={s.heading}>
        Gia nhập Nexora Technology cùng NexCareer Hub
      </h4>
      <p className="mt-2 text-[11px] leading-relaxed opacity-75">
        Ứng tuyển dễ, theo dõi hồ sơ minh bạch qua 3 vòng đánh giá.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span style={s.button} className="px-3 py-1.5 text-[11px] font-700">
          Tìm việc
        </span>
        <span className="text-[11px] font-600" style={{ color: theme.accent }}>
          Khám phá ngay →
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div key={i} style={s.card} className="p-2.5">
            <div
              className="grid h-6 w-6 place-items-center rounded-md"
              style={{ background: `${theme.primary}1a`, color: theme.primary }}
            >
              <Users className="h-3 w-3" />
            </div>
            <div className="mt-1.5 text-[10px] font-600" style={s.heading}>
              Thẻ mẫu {i}
            </div>
            <div className="text-[9px] opacity-60">Nội dung mô tả ngắn</div>
          </div>
        ))}
      </div>
    </div>
  );
}