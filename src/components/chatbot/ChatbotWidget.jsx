import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X, Sparkles } from "lucide-react";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Chào bạn! Mình là Starbuddy 🚀 — trợ lý của NexCareer Hub. Hỏi mình về việc làm, ứng tuyển hay liên hệ nhé!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("chatWithBot", { message: text });
      setMessages((m) => [...m, { role: "bot", text: res.data?.answer || "Mình chưa hiểu lắm, bạn hỏi lại được không?" }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Ối, kết nối bị gián đoạn. Bạn thử lại sau nhé!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="panel-galaxy flex w-[88vw] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-3xl animate-pop-in" style={{ height: "30rem" }}>
          {/* Header */}
          <div className="galaxy-bg relative flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="relative">
              <img src="/images/astro/happy.png" alt="Starbuddy" className="h-10 w-10 rounded-full object-cover ring-2 ring-pastel-lavender/60" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-card" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-700 text-foreground">Starbuddy</div>
              <div className="text-[11px] text-muted-foreground">Trợ lý NexCareer • online</div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="galaxy-bg flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && <img src="/images/astro/happy.png" alt="" className="mr-2 h-7 w-7 shrink-0 self-end rounded-full object-cover" />}
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "glass text-foreground rounded-bl-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img src="/images/astro/thinking.png" alt="" className="h-7 w-7 animate-float rounded-full object-cover" />
                <span className="glass rounded-2xl px-3.5 py-2">Starbuddy đang nghĩ…</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi…"
              className="h-10 rounded-full"
              disabled={loading}
            />
            <Button type="submit" size="icon" className="btn-galaxy h-10 w-10 shrink-0 rounded-full" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Floating mascot button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-galaxy group relative flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-105 active:animate-jelly"
        aria-label={open ? "Đóng chat" : "Mở chat với Starbuddy"}
      >
        {!open && <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-pastel-pink text-[9px] font-700 text-white">1</span>}
        {open ? (
          <X className="h-7 w-7 text-white" />
        ) : (
          <img src="/images/mascot.png" alt="Starbuddy" className="h-14 w-14 animate-float rounded-full object-cover" />
        )}
      </button>
      {!open && (
        <div className="pointer-events-none flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-600 text-foreground shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-pastel-pink" /> Hỏi Starbuddy
        </div>
      )}
    </div>
  );
}