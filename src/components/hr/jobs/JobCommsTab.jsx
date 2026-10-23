import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { Loader2, RefreshCw, Copy, Download, Share2, CalendarClock, Send, Check, X, Pencil, Info } from "lucide-react";

const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "topcv", label: "TopCV / ITviec / VietnamWorks (bản dài)" },
  { value: "x", label: "X / Twitter (bản ngắn)" },
];

const STYLES = [
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "youthful", label: "Trẻ trung" },
  { value: "concise", label: "Ngắn gọn" },
];

const STATUS_META = {
  draft: { label: "Nháp", cls: "bg-muted text-muted-foreground" },
  scheduled: { label: "Đã lên lịch", cls: "bg-amber-100 text-amber-800" },
  posted: { label: "Đã đăng", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Đã hủy", cls: "bg-rose-100 text-rose-700" },
};

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function JobCommsTab({ job }) {
  const [platform, setPlatform] = useState("linkedin");
  const [style, setStyle] = useState("professional");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [editing, setEditing] = useState(null);

  const jobUrl = `${window.location.origin}/viec-lam/${job.id}`;

  const loadPosts = async () => {
    try {
      const res = await base44.entities.SocialPost.filter({ job_id: job.id }, { sort: "scheduled_at", limit: 50 });
      setPosts(res.items || []);
    } catch (e) {
      setPosts([]);
    }
  };

  useEffect(() => { loadPosts(); }, [job.id]);

  const generate = async (only) => {
    setBusy(only || "both");
    setError("");
    try {
      const res = await base44.functions.invoke("generateJobPost", {
        job_id: job.id,
        platform,
        style,
        only: only || "both",
        existing_title: title,
        existing_content: content,
        existing_image: imageUrl,
      });
      const d = res.data || {};
      if (d.error) throw new Error(d.error);
      if (d.title) setTitle(d.title);
      if (d.content) setContent(d.content);
      if (d.image_url) setImageUrl(d.image_url);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Không tạo được bài truyền thông.");
    } finally {
      setBusy("");
    }
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Trình duyệt không cho phép sao chép — hãy copy thủ công.");
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tuyen-dung-${String(job.title || "nexora").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(imageUrl, "_blank", "noopener");
    }
  };

  const shareNow = async (target) => {
    await copyContent();
    if (target === "topcv") {
      window.open(jobUrl, "_blank", "noopener");
      return;
    }
    const urls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.slice(0, 240))}&url=${encodeURIComponent(jobUrl)}`,
    };
    window.open(urls[target], "_blank", "noopener");
  };

  const saveSchedule = async () => {
    if (!scheduleAt) { setError("Vui lòng chọn ngày giờ đăng."); return; }
    setBusy("schedule");
    setError("");
    try {
      await base44.entities.SocialPost.create({
        job_id: job.id,
        job_title: job.title,
        platform,
        style,
        title,
        content,
        image_url: imageUrl,
        scheduled_at: new Date(scheduleAt).toISOString(),
        status: "scheduled",
        created_by_email: (await base44.auth.me()).email,
      });
      setScheduleOpen(false);
      setScheduleAt("");
      await loadPosts();
    } catch (e) {
      setError(e.message || "Không lưu được lịch đăng.");
    } finally {
      setBusy("");
    }
  };

  const setStatus = async (post, status) => {
    await base44.entities.SocialPost.update(post.id, {
      status,
      ...(status === "posted" ? { posted_at: new Date().toISOString() } : {}),
    });
    await loadPosts();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await base44.entities.SocialPost.update(editing.id, { content: editing.content, title: editing.title });
    setEditing(null);
    await loadPosts();
  };

  const now = Date.now();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-700">Truyền thông tuyển dụng</h2>
            <p className="mt-1 text-xs text-muted-foreground">AI tạo ảnh minh họa và nội dung dựa trên JD của vị trí này.</p>
          </div>
          <Button onClick={() => generate("both")} disabled={!!busy} className="gap-2">
            {busy === "both" ? <Loader2 className="h-4 w-4 animate-spin" /> : "✨"} Tạo bài truyền thông tuyển dụng
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Phong cách</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nền tảng đích</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}
      </div>

      {(imageUrl || content) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-700">Ảnh minh họa</h3>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => generate("image")} disabled={!!busy} className="gap-1.5">
                  {busy === "image" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Tạo lại ảnh
                </Button>
                <Button size="sm" variant="ghost" onClick={downloadImage} disabled={!imageUrl} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Tải ảnh
                </Button>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
              {imageUrl ? (
                <Image src={imageUrl} alt={`Minh họa tuyển dụng ${job.title}`} fittingType="fill" className="aspect-square w-full" />
              ) : (
                <div className="grid aspect-square place-items-center text-xs text-muted-foreground">Chưa có ảnh</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-700">Nội dung bài đăng</h3>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => generate("content")} disabled={!!busy} className="gap-1.5">
                  {busy === "content" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Tạo lại content
                </Button>
                <Button size="sm" variant="ghost" onClick={copyContent} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Đã copy" : "Sao chép"}
                </Button>
              </div>
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bài đăng" className="mt-3 h-9 text-sm" />
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={11} className="mt-2 text-sm" />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{content.length} ký tự</p>

            <div className="mt-3 space-y-2">
              <p className="text-xs font-600">Chia sẻ ngay</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => shareNow("linkedin")} className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> LinkedIn</Button>
                <Button size="sm" variant="outline" onClick={() => shareNow("facebook")} className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Facebook</Button>
                <Button size="sm" variant="outline" onClick={() => shareNow("x")} className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> X</Button>
                <Button size="sm" variant="outline" onClick={() => shareNow("topcv")} className="gap-1.5"><Send className="h-3.5 w-3.5" /> TopCV / ITviec</Button>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setScheduleOpen(true)} className="gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Đặt lịch đăng
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Hệ thống <b>nhắc bạn đăng và chuẩn bị sẵn nội dung</b> — chưa có kết nối API tự động đăng lên mạng xã hội.
          Khi đến giờ, bài sẽ hiện nhãn “Đến giờ đăng”; sau khi đăng xong, bấm “Đánh dấu đã đăng”.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-700">Bài đã lên lịch</h3>
        </div>
        {posts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có bài nào được lên lịch cho vị trí này.</p>
        ) : (
          posts.map((post) => {
            const due = post.status === "scheduled" && post.scheduled_at && new Date(post.scheduled_at).getTime() <= now;
            return (
              <div key={post.id} className="border-b border-border/60 p-4 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-600 capitalize">{post.platform}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${STATUS_META[post.status]?.cls}`}>{STATUS_META[post.status]?.label}</span>
                  {due && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-700 text-primary">Đến giờ đăng</span>}
                  <span className="text-xs text-muted-foreground">{formatTime(post.scheduled_at)}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...post })} className="gap-1"><Pencil className="h-3.5 w-3.5" /> Sửa</Button>
                    {post.status !== "posted" && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(post, "posted")} className="gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" /> Đánh dấu đã đăng</Button>
                    )}
                    {post.status !== "cancelled" && post.status !== "posted" && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(post, "cancelled")} className="gap-1 text-rose-600"><X className="h-3.5 w-3.5" /> Hủy</Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{post.content}</p>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Đặt lịch đăng bài</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nền tảng</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ngày giờ đăng</Label>
              <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Hủy</Button>
            <Button onClick={saveSchedule} disabled={busy === "schedule"} className="gap-2">
              {busy === "schedule" && <Loader2 className="h-4 w-4 animate-spin" />} Lưu lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Sửa bài đã lên lịch</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="h-9" />
              <Textarea rows={8} value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={saveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}