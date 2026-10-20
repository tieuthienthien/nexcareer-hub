import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CV_TEMPLATES } from "@/lib/cvUtils";
import { FileText, Plus, Pencil, Copy, Star, Trash2, Loader2 } from "lucide-react";

export default function CvDocuments() {
  const navigate = useNavigate();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const res = await base44.entities.CvDocument.filter({}, { sort: "-updated_date", limit: 50 });
    setCvs(res.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const duplicate = async (cv) => {
    setBusyId(cv.id);
    const { id, created_by_id, created_date, updated_date, ...rest } = cv;
    await base44.entities.CvDocument.create({ ...rest, title: `${cv.title} (bản sao)`, is_default: false });
    await load();
    setBusyId(null);
  };

  const makeDefault = async (cv) => {
    setBusyId(cv.id);
    await base44.entities.CvDocument.update(cv.id, { is_default: true });
    await load();
    setBusyId(null);
  };

  const remove = async (cv) => {
    if (!window.confirm(`Xoá CV "${cv.title}"?`)) return;
    setBusyId(cv.id);
    await base44.entities.CvDocument.delete(cv.id);
    await load();
    setBusyId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-800 tracking-tight">CV của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lưu nhiều phiên bản CV cho từng nhóm vị trí và ứng tuyển bằng CV mặc định.</p>
        </div>
        <Button onClick={() => navigate("/cv/cv/new")} className="gap-2 rounded-full">
          <Plus className="h-4 w-4" /> Tạo CV mới
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : cvs.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
          <h2 className="mt-4 font-heading text-lg font-700">Bạn chưa có CV nào</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tạo CV đầu tiên để bắt đầu ứng tuyển.</p>
          <Button className="mt-5 gap-2 rounded-full" onClick={() => navigate("/cv/cv/new")}>
            <Plus className="h-4 w-4" /> Tạo CV đầu tiên
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => {
            const template = CV_TEMPLATES.find((t) => t.id === cv.template) || CV_TEMPLATES[0];
            const busy = busyId === cv.id;
            return (
              <div key={cv.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_18px_40px_-30px_hsl(var(--primary)/0.6)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-[15px] font-700">{cv.title}</h3>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{cv.full_name || "Chưa điền tên"} · {cv.headline || "Chưa có chức danh"}</p>
                  </div>
                  {cv.is_default && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-600 text-primary">
                      <Star className="h-3 w-3" /> Mặc định
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${template.dot}`} /> {template.name}
                  <span className="font-400">·</span>
                  <span>Cập nhật {new Date(cv.updated_date).toLocaleDateString("vi-VN")}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                  <Button asChild size="sm" className="gap-1.5 rounded-full">
                    <Link to={`/cv/cv/${cv.id}`}><Pencil className="h-3.5 w-3.5" /> Sửa</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => duplicate(cv)} disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />} Nhân bản
                  </Button>
                  {!cv.is_default && (
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-full text-muted-foreground" onClick={() => makeDefault(cv)} disabled={busy}>
                      <Star className="h-3.5 w-3.5" /> Mặc định
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="ml-auto rounded-full text-muted-foreground hover:text-destructive" onClick={() => remove(cv)} disabled={busy}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}