import { useState } from "react";
import { PlayCircle, ChevronDown } from "lucide-react";

// ====== CHỈNH Ở ĐÂY ======
// Đặt file video vào: public/videos/job-simulation-intro.mp4  (đường dẫn trên web: /videos/job-simulation-intro.mp4)
const VIDEO_SRC = "/videos/job-simulation-intro.mp4";
const TITLE = "Video giới thiệu bài mô phỏng";
const SUMMARY = "Xem nhanh bối cảnh, cách làm bài và cách chấm điểm (không bắt buộc).";
const DESCRIPTION = `Video này giới thiệu bối cảnh công việc, cách làm từng nhiệm vụ và tiêu chí chấm điểm của bài Job Simulation.

• Bạn có thể xem video bất cứ lúc nào trong lúc làm bài.
• Thời gian xem video vẫn tính vào thời gian làm bài.
• Bài làm được tự lưu mỗi 30 giây.`;
// =========================

// Thu gọn mặc định để không chiếm chỗ; ứng viên muốn xem chi tiết thì bấm mở.
export default function SimulationIntroVideo({ src = VIDEO_SRC }) {
  const [open, setOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="mx-auto mt-3 max-w-[1400px] px-3">
      <div className="rounded-2xl border border-primary/20 bg-card">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <PlayCircle className="h-6 w-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-700">{TITLE}</p>
            <p className="text-xs text-muted-foreground">{SUMMARY}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-600 text-primary">
            {open ? "Thu gọn" : "Xem chi tiết"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>

        {open && (
          <div className="grid gap-4 border-t border-border/60 p-4 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
            {!videoFailed ? (
              <div
                // Chuột phải trên video không tính là gian lận.
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="overflow-hidden rounded-xl bg-black"
              >
                <video
                  controls
                  preload="metadata"
                  playsInline
                  // Tắt toàn màn hình / PiP / tải xuống để không kích hoạt cảnh báo "thoát toàn màn hình" của bài thi.
                  controlsList="nodownload nofullscreen noplaybackrate"
                  disablePictureInPicture
                  onError={() => setVideoFailed(true)}
                  className="aspect-video w-full"
                >
                  <source src={src} type="video/mp4" />
                </video>
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
                Video chưa sẵn sàng. Bạn vẫn có thể đọc phần mô tả bên cạnh.
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{DESCRIPTION}</p>
          </div>
        )}
      </div>
    </div>
  );
}
