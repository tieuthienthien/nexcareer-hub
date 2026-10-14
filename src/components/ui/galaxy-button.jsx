import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const PASTEL_COLORS = ["#c8b6ff", "#ffc8dd", "#b8e0ff", "#b8ffd9", "#ffe9a8"];

/**
 * GalaxyButton — nút CTA với hiệu ứng click galaxy:
 *  - Ripple (sóng từ điểm chạm)
 *  - Confetti (pháo giấy pastel)
 *  - Jelly (nảy như thạch khi nhấn)
 *  Tôn trọng prefers-reduced-motion (tắt hiệu ứng nếu hệ thống yêu cầu).
 *  Props: ripple?, confetti?, ...toàn bộ props của Button.
 */
export default function GalaxyButton({ children, ripple = true, confetti: confettiOn = true, onClick, className = "", ...props }) {
  const btnRef = useRef(null);
  const [ripples, setRipples] = useState([]);
  const [pressing, setPressing] = useState(false);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const handlePointerDown = useCallback(() => setPressing(true), []);
  const handlePointerUp = useCallback(() => setPressing(false), []);

  const fireConfetti = useCallback((x, y) => {
    if (reduceMotion) return;
    confetti({
      particleCount: 18,
      spread: 55,
      startVelocity: 28,
      gravity: 0.7,
      scalar: 0.8,
      ticks: 90,
      origin: { x, y },
      colors: PASTEL_COLORS,
      disableForReducedMotion: true,
    });
  }, [reduceMotion]);

  const handleClick = useCallback((e) => {
    const btn = btnRef.current;
    if (btn && ripple && !reduceMotion) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = Date.now() + Math.random();
      setRipples((rs) => [...rs, { id, x, y, size }]);
      setTimeout(() => setRipples((rs) => rs.filter((r) => r.id !== id)), 600);
    }
    if (btn && confettiOn) {
      let x = 0.5, y = 0.5;
      if (e.clientX != null && e.clientY != null) {
        x = (e.clientX - btn.getBoundingClientRect().left) / btn.getBoundingClientRect().width;
        y = (e.clientY - btn.getBoundingClientRect().top) / btn.getBoundingClientRect().height;
      }
      fireConfetti(Math.min(Math.max(x, 0), 1), Math.min(Math.max(y, 0), 1));
    }
    onClick?.(e);
  }, [ripple, confettiOn, reduceMotion, fireConfetti, onClick]);

  return (
    <Button
      ref={btnRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative overflow-hidden ${pressing ? "active:animate-jelly" : ""} ${className}`}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/40 animate-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Button>
  );
}