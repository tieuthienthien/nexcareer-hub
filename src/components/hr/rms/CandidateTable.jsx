import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ChevronLeft, ChevronRight, FileSearch, Mail, Pencil, StickyNote, Workflow } from "lucide-react";
import CvButtons from "./CvButtons";
import { candidateCode, formatDate, rmsMeta } from "@/lib/rms";

const PAGE_SIZE = 10;

const valueOf = (app, key) => {
  if (key === "code") return candidateCode(app);
  if (key === "status") return rmsMeta(app).label;
  if (key === "cv_match_score") return Number(app.cv_match_score ?? -1);
  return app[key] || "";
};

export default function CandidateTable({ apps = [], onViewDetail, onCompose, onOpenPipeline, onEdit, onNote }) {
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState([]);

  const sorted = useMemo(() => {
    const list = [...apps];
    list.sort((a, b) => {
      const av = valueOf(a, sortKey);
      const bv = valueOf(b, sortKey);
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "vi")
        : String(bv).localeCompare(String(av), "vi");
    });
    return list;
  }, [apps, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const selectedApps = sorted.filter((a) => selected.includes(a.id));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "created_date" || key === "cv_match_score" ? "desc" : "asc");
    }
  };

  const toggleRow = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allOnPage = current.length > 0 && current.every((a) => selected.includes(a.id));

  const head = [
    { key: "code", label: "Mã ứng viên" },
    { key: "full_name", label: "Họ tên" },
    { key: "job_title", label: "Vị trí ứng tuyển" },
    { key: "created_date", label: "Ngày nộp" },
    { key: "", label: "SĐT & Email" },
    { key: "status", label: "Trạng thái" },
    { key: "cv_match_score", label: "Match" },
    { key: "", label: "CV" },
    { key: "", label: "Hành động" },
  ];

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-600 text-primary">Đã chọn {selected.length} hồ sơ</span>
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => onCompose?.(selectedApps)}>
            <Mail className="h-4 w-4" /> Duyệt CV & gửi mail mời PV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Bỏ chọn</Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allOnPage}
                  onCheckedChange={(v) => {
                    if (v) setSelected((prev) => Array.from(new Set([...prev, ...current.map((a) => a.id)])));
                    else setSelected((prev) => prev.filter((id) => !current.some((a) => a.id === id)));
                  }}
                  aria-label="Chọn tất cả"
                />
              </th>
              {head.map((h, i) => (
                <th key={`${h.label}-${i}`} className="px-3 py-2.5 text-left text-[11px] font-700 uppercase tracking-wide text-muted-foreground">
                  {h.key ? (
                    <button type="button" onClick={() => toggleSort(h.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {h.label}
                      <ArrowUpDown className={`h-3 w-3 ${sortKey === h.key ? "text-primary" : "text-muted-foreground/60"}`} />
                    </button>
                  ) : (
                    h.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map((a) => (
              <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2.5">
                  <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggleRow(a.id)} aria-label={`Chọn ${a.full_name}`} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">{candidateCode(a)}</td>
                <td className="px-3 py-2.5 font-600">{a.full_name}</td>
                <td className="px-3 py-2.5">{a.job_title}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{formatDate(a.created_date)}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="font-500">{a.phone || "—"}</div>
                  <div className="text-muted-foreground">{a.email}</div>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-600 ${rmsMeta(a).color}`}>{rmsMeta(a).label}</span>
                </td>
                <td className="px-3 py-2.5">
                  {a.cv_match_score != null ? (
                    <span className="font-700 text-primary">{Math.round(a.cv_match_score)}%</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5"><CvButtons app={a} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button type="button" title="Sửa thông tin" onClick={() => onEdit?.(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button type="button" title="Ghi chú HR" onClick={() => onNote?.(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><StickyNote className="h-4 w-4" /></button>
                    <button type="button" title="Xem tiến trình" onClick={() => onOpenPipeline?.(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Workflow className="h-4 w-4" /></button>
                    <button type="button" title="Chi tiết hồ sơ" onClick={() => onViewDetail?.(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><FileSearch className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {current.length === 0 && (
              <tr>
                <td colSpan={10} className="py-14 text-center text-sm text-muted-foreground">Không có hồ sơ phù hợp bộ lọc.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{sorted.length} hồ sơ · trang {page + 1}/{pageCount}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Trước
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1} className="gap-1">
            Sau <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}