import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";

const CATEGORIES = [
  { label: "CV & Hồ sơ", q: "Làm sao để tải CV lên NexCareer Hub?" },
  { label: "Tìm việc", q: "Tìm việc làm trên NexCareer Hub thế nào?" },
  { label: "Vòng 1", q: "Vòng 1 sàng lọc CV hoạt động ra sao?" },
  { label: "Vòng 2", q: "Vòng 2 bài thi kỹ thuật diễn ra thế nào?" },
  { label: "Phỏng vấn AI", q: "Vòng 3 phỏng vấn AI cần chuẩn bị gì?" },
  { label: "Kết quả", q: "Tôi xem kết quả ứng tuyển ở đâu?" },
  { label: "Tài khoản", q: "Đăng nhập bằng Google thế nào?" },
  { label: "Hỗ trợ", q: "Làm sao để liên hệ hỗ trợ?" },
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Chào bạn! Mình là Starbuddy 🚀 — trợ lý của NexCareer Hub. Hỏi mình về việc làm, ứng tuyển hay liên hệ nhé!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsHidden, setSuggestionsHidden] = useState(false);
  const [feedback, setFeedback] = useState({});
  const scrollRef = useRef(null);

  const handleFeedback = async (i, helpful) => {
    if (feedback[i]) return;
    setFeedback((f) => ({ ...f, [i]: helpful }));
    const userMsg = [...messages].reverse().find((m) => m.role === "user");
    try {
      await base44.entities.ChatbotLog.create({ message: userMsg?.text || "", source: "feedback", helpful });
    } catch {}
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      if (e?.detail?.q) ask(e.detail.q);
    };
    window.addEventListener("starbuddy:open", handler);
    return () => window.removeEventListener("starbuddy:open", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    base44.entities.ChatbotKnowledge.filter({ active: true }, { sort: "-created_date", limit: 8 })
      .then((res) => {
        if (!alive) return;
        const items = (res.items || []).map((k) => k.question).filter(Boolean);
        setSuggestions(items);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [open]);

  const ask = async (text) => {
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSuggestionsHidden(true);
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

  const send = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    ask(text);
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

          {/* Category shortcuts */}
          <div className="galaxy-bg flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => ask(c.q)}
                className="shrink-0 rounded-full border border-pastel-lavender/50 bg-card/70 px-2.5 py-1 text-[11px] font-500 text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-pastel-pink hover:bg-pastel-pink/10"
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="galaxy-bg flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && <img src="/images/astro/happy.png" alt="" className="mr-2 h-7 w-7 shrink-0 self-end rounded-full object-cover" />}
                <div className="max-w-[78%]">
                  <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "glass text-foreground rounded-bl-sm"}`}>
                    {m.text}
                  </div>
                  {m.role === "bot" && i > 0 && !loading && (
                    <div className="mt-1 flex items-center gap-2 pl-1">
                      {feedback[i] ? (
                        <span className="text-[10px] font-500 text-muted-foreground">Cảm ơn phản hồi! 💫</span>
                      ) : (
                        <>
                          <button onClick={() => handleFeedback(i, true)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-emerald-600" aria-label="Có ích"><ThumbsUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleFeedback(i, false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-rose-600" aria-label="Không ích"><ThumbsDown className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img src="/images/astro/thinking.png" alt="" className="h-7 w-7 animate-galaxy-zoom rounded-full object-cover" />
                <span className="glass rounded-2xl px-3.5 py-2">Starbuddy đang nghĩ…</span>
              </div>
            )}
            {suggestions.length > 0 && !suggestionsHidden && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => ask(q)}
                    className="rounded-full border border-pastel-lavender/60 bg-card/80 px-3 py-1.5 text-xs font-500 text-foreground transition-all hover:-translate-y-0.5 hover:border-pastel-pink hover:bg-pastel-pink/10 hover:shadow-[0_0_12px_hsl(340_70%_80%/0.4)]"
                  >
                    {q}
                  </button>
                ))}
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
          <img src="/images/mascot.png" alt="Starbuddy" className="h-14 w-14 animate-galaxy-zoom rounded-full object-cover" />
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