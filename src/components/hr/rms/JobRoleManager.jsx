import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users } from "lucide-react";

const empty = { title: "", department: "", line_manager_email: "", manager_name: "", headcount: 1, status: "open" };

export default function JobRoleManager() {
  const [roles, setRoles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [r, j] = await Promise.all([
        base44.entities.JobRole.list({ sort: "-created_date", limit: 100 }),
        base44.entities.Job.list({ sort: "-created_date", limit: 100 }).catch(() => ({ items: [] })),
      ]);
      setRoles(r.items || []);
      setJobs(j.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = (role) => {
    setEditing(role || null);
    setForm(role ? { ...empty, ...role } : empty);
    setError("");
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.line_manager_email.trim()) {
      setError("Vui lòng nhập tên vị trí và email Line Manager.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        department: form.department,
        line_manager_email: form.line_manager_email.trim().toLowerCase(),
        manager_name: form.manager_name,
        headcount: Number(form.headcount) || 1,
        status: form.status,
        job_id: form.job_id || "",
      };
      if (editing) await base44.entities.JobRole.update(editing.id, payload);
      else await base44.entities.JobRole.create(payload);
      setOpen(false);
      await load();
    } catch (e) {
      setError(e?.message || "Không lưu được vị trí.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role) => {
    await base44.entities.JobRole.delete(role.id);
    await load();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-700"><Users className="h-4 w-4 text-primary" /> Vị trí & Line Manager</h3>
          <p className="mt-1 text-xs text-muted-foreground">Gán Line Manager phụ trách từng vị trí và chỉ tiêu tuyển dụng (dùng cho tỷ lệ lấp đầy).</p>
        </div>
        <Button size="sm" onClick={() => openForm(null)} className="gap-2"><Plus className="h-4 w-4" /> Thêm vị trí</Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-700">Vị trí</th>
              <th className="py-2 pr-3 font-700">Phòng ban</th>
              <th className="py-2 pr-3 font-700">Line Manager</th>
              <th className="py-2 pr-3 font-700">Chỉ tiêu</th>
              <th className="py-2 pr-3 font-700">Trạng thái</th>
              <th className="py-2 font-700" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Chưa cấu hình vị trí nào.</td></tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-600">{r.title}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{r.department || "—"}</td>
                  <td className="py-2.5 pr-3 text-xs">{r.line_manager_email}</td>
                  <td className="py-2.5 pr-3">{r.headcount || 1}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-600 ${r.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {r.status === "open" ? "Đang tuyển" : "Đã đóng"}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openForm(r)}>Sửa</Button>
                      <button type="button" onClick={() => remove(r)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-rose-600" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa vị trí" : "Thêm vị trí"}</DialogTitle>
            <DialogDescription>Tên vị trí cần khớp với tên trên tin tuyển dụng để hệ thống tự gán Line Manager.</DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Chọn từ tin tuyển dụng (không bắt buộc)</Label>
              <Select
                value={form.job_id || "none"}
                onValueChange={(v) => {
                  const job = jobs.find((j) => j.id === v);
                  setForm({ ...form, job_id: v === "none" ? "" : v, title: job?.title || form.title, department: job?.department || form.department });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Tin tuyển dụng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nhập tay</SelectItem>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tên vị trí</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phòng ban</Label>
              <Input value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email Line Manager</Label>
              <Input type="email" value={form.line_manager_email} onChange={(e) => setForm({ ...form, line_manager_email: e.target.value })} placeholder="manager@congty.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Tên Line Manager</Label>
              <Input value={form.manager_name || ""} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Số lượng cần tuyển</Label>
              <Input type="number" min="1" value={form.headcount} onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Đang tuyển</SelectItem>
                  <SelectItem value="closed">Đã đóng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}