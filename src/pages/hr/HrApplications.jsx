import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, FileText, ExternalLink, Download, Mail, Phone, Link2, Save, Loader2, Filter } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";

const statusOptions = ["pending", "reviewing", "interview", "offer", "rejected", "hired"];

export default function HrApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      if (status !== "all") query.status = status;
      if (q.trim()) query.full_name = { $regex: q.trim(), $options: "i" };
      const res = await base44.entities.Application.filter(query, { sort: "-created_date", limit: 100 });
      setApps(res.items || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [status, q]);

  const updateStatus = async (app, newStatus) => {
    try {
      const updated = await base44.entities.Application.update(app.id, { status: newStatus });
      setApps((prev) => prev.map((a) => (a.id === app.id ? updated : a)));
      if (selected?.id === app.id) setSelected(updated);
    } catch (e) { alert(e.message || "Không thể cập nhật."); }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const updated = await base44.entities.Application.update(selected.id, { notes });
      setSelected(updated);
    } catch (e) { alert("Không thể lưu ghi chú."); }
    setSavingNote(false);
  };

  const viewCv = async (uri) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      window.open(signed_url, "_blank");
    } catch (e) { alert("Không thể xem CV."); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-700">Quản lý ứng viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem hồ sơ, cập nhật trạng thái và ghi chú ứng viên</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên ứng viên..." className="h-10 border-0 bg-muted/40 pl-9 shadow-none" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 sm:w-48 gap-2"><Filter className="h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{applicationStatusLabel[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có ứng viên nào.</div>
        ) : (
          apps.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 border-b border-border/60 p-4 last:border-0 hover:bg-muted/30 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-700 text-primary">{(a.full_name || "?")[0].toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <button onClick={() => { setSelected(a); setNotes(a.notes || ""); }} className="truncate text-left text-sm font-600 hover:text-primary">{a.full_name}</button>
                  <div className="truncate text-xs text-muted-foreground">{a.job_title} · {a.company}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(a.created_date).toLocaleDateString("vi-VN")}</span>
                <Select value={a.status} onValueChange={(v) => updateStatus(a, v)}>
                  <SelectTrigger className={`h-8 w-36 border-0 text-xs font-600 ${applicationStatusColor[a.status]}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{applicationStatusLabel[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selected.full_name}</DialogTitle>
                <DialogDescription>Ứng tuyển: {selected.job_title} · {selected.company}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selected.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selected.phone || "—"}</div>
                </div>
                {selected.portfolio_url && (
                  <a href={selected.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Link2 className="h-4 w-4" /> Xem portfolio <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {selected.cv_file_uri && (
                  <Button variant="outline" size="sm" onClick={() => viewCv(selected.cv_file_uri)} className="gap-2"><Download className="h-4 w-4" /> Tải / xem CV</Button>
                )}
                {selected.cover_letter && (
                  <div>
                    <div className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Thư ứng tuyển</div>
                    <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{selected.cover_letter}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Ghi chú nội bộ</div>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú về ứng viên..." className="mt-1.5" />
                  <Button size="sm" variant="outline" onClick={saveNote} disabled={savingNote} className="mt-2 gap-2">{savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu ghi chú</Button>
                </div>
                <div>
                  <div className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Cập nhật trạng thái</div>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected, v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{applicationStatusLabel[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}