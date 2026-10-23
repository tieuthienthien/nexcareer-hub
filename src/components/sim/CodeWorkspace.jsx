import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Play } from "lucide-react";

const KEYWORDS = /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(function|return|const|let|var|if|else|for|of|while|new|typeof|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g;

function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code) {
  let out = "";
  let last = 0;
  let m;
  KEYWORDS.lastIndex = 0;
  while ((m = KEYWORDS.exec(code))) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += `<span class="text-slate-400">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="text-emerald-600">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="text-violet-600 font-semibold">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="text-amber-600">${esc(m[4])}</span>`;
    last = m.index + m[0].length;
  }
  out += esc(code.slice(last));
  return out;
}

export default function CodeWorkspace({ value, onChange, onPaste, onRun, running, results, error }) {
  const taRef = useRef(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(260, el.scrollHeight)}px`;
  }, [value]);

  const lines = String(value || "").split("\n").length;
  const visibleTests = (results || []).filter((r) => r.visible);
  const hidden = (results || []).filter((r) => !r.visible);
  const hiddenPassed = hidden.filter((r) => r.pass).length;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border bg-slate-50">
        <div className="flex items-center justify-between border-b border-border bg-slate-100 px-3 py-1.5">
          <span className="font-mono text-[11px] text-slate-500">solution.js · {lines} dòng</span>
          <Button size="sm" onClick={onRun} disabled={running} className="h-7 gap-1.5 text-xs">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Chạy kiểm thử
          </Button>
        </div>

        <div className="relative flex max-h-[420px] overflow-auto">
          <div className="select-none border-r border-slate-200 bg-slate-100/70 px-2 py-3 text-right font-mono text-[12.5px] leading-6 text-slate-400">
            {Array.from({ length: lines }).map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <div className="relative min-w-0 flex-1">
            <pre
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-3 font-mono text-[12.5px] leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: `${highlight(value || "")}\n` }}
            />
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={onPaste}
              spellCheck={false}
              className="relative w-full resize-none whitespace-pre-wrap break-words bg-transparent p-3 font-mono text-[12.5px] leading-6 text-transparent caret-slate-900 outline-none"
              style={{ minHeight: 260 }}
            />
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}

      {results && results.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-2.5">
          <p className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">
            Kết quả: {results.filter((r) => r.pass).length}/{results.length} test đạt
            {hidden.length > 0 ? ` · test ẩn ${hiddenPassed}/${hidden.length}` : ""}
          </p>
          <div className="mt-1.5 space-y-1">
            {visibleTests.map((r) => (
              <div key={r.name} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${r.pass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                  {r.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span className={r.pass ? "text-foreground/80" : "text-rose-700"}>{r.name}{!r.pass && r.message ? ` — ${r.message}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}