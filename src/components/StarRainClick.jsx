import { useEffect, useRef, useState } from "react";

const COLORS = [
  "hsl(266 70% 78%)",
  "hsl(340 70% 80%)",
  "hsl(210 70% 80%)",
  "hsl(165 55% 78%)",
  "hsl(43 96% 70%)",
];

let uid = 0;

export default function StarRainClick() {
  const [bursts, setBursts] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    const onClick = (e) => {
      // bỏ qua khi click lên nút/link/form để không gây phiền
      const tag = e.target?.closest?.("button, a, input, textarea, select, label, [role='button']");
      if (tag) return;

      const x = e.clientX;
      const y = e.clientY;
      const id = ++uid;
      const count = 14;
      const particles = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const dist = 60 + Math.random() * 70;
        // thiên về rơi xuống (mưa sao)
        const dx = Math.cos(angle) * dist;
        const dy = Math.abs(Math.sin(angle)) * dist + 60 + Math.random() * 50;
        return {
          dx,
          dy,
          rot: (Math.random() - 0.5) * 540,
          dur: 900 + Math.random() * 600,
          color: COLORS[i % COLORS.length],
          size: 8 + Math.random() * 8,
          delay: Math.random() * 120,
        };
      });
      setBursts((b) => [...b, { id, x, y, particles }]);
      const t = setTimeout(() => {
        setBursts((b) => b.filter((x2) => x2.id !== id));
      }, 1700);
      timers.current.push(t);
    };
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      window.removeEventListener("click", onClick);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {bursts.map((b) => (
        <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {b.particles.map((p, i) => (
            <span
              key={i}
              className="star-rain"
              style={{
                // @ts-ignore -- custom props
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                "--rot": `${p.rot}deg`,
                color: p.color,
                fontSize: `${p.size}px`,
                animationDuration: `${p.dur}ms`,
                animationDelay: `${p.delay}ms`,
                left: 0,
                top: 0,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}