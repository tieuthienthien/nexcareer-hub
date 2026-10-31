import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, Briefcase, Upload, Download, Link2, Loader2, CheckCircle2, ExternalLink, Pencil, Save, Plus, Sparkles, Camera, Award, Github, Trash2, Rocket, AlertCircle, ArrowRight } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";
import ApplicationTimeline from "@/components/candidate/ApplicationTimeline";
import { getMissingItems, fileNameOf } from "@/lib/candidateProfile";

export default function CandidateRoom() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [applications, setApplications] = useState([]);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [invites, setInvites] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const [searchParams] = useSearchParams();
  const wantedTab = searchParams.get("tab");
  const [tab, setTab] = useState(["profile", "cv", "apps"].includes(wantedTab) ? wantedTab : "profile");
  // Thông tin dùng khi ứng tuyển, lưu ở Candidate Room
  const [extra, setExtra] = useState({ english_certificate: "", github_url: "", project_links: "" });

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", headline: "", bio: "",
    location: "", experience_years: "", education: "", skillsText: "", portfolio_url: "",
  });

  useEffect(() => {
    (async () => {
      try {
        let res = await base44.entities.CandidateProfile.filter({ email: user?.email }, { limit: 1 });
        if (!res.items?.length) res = await base44.entities.CandidateProfile.filter({ created_by_id: user?.id }, { limit: 1 });
        const p = res.items?.[0];
        setProfile(p || null);
        if (p) setForm({
          full_name: p.full_name || "", email: p.email || "", phone: p.phone || "",
          headline: p.headline || "", bio: p.bio || "", location: p.location || "",
          experience_years: p.experience_years ?? "", education: p.education || "",
          skillsText: (p.skills || []).join(", "), portfolio_url: p.portfolio_url || "",
        });
        else setForm((f) => ({ ...f, full_name: user?.full_name || "", email: user?.email || "" }));
        if (p) setExtra({ english_certificate: p.english_certificate || "", github_url: p.github_url || "", project_links: p.project_links || "" });
      } catch (e) {}
      try {
        const apps = await base44.entities.Application.filter(
          { $or: [{ created_by_id: user?.id }, { email: user?.email }] },
          { sort: "-created_date", limit: 50 }
        );
        setApplications(apps.items || []);
      } catch (e) {}
      try {
        const inv = await base44.entities.SimulationInvite.filter(
          { status: { $in: ["sent", "started"] } },
          { sort: "-created_date", limit: 10 }
        );
        setInvites(inv.items || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name, email: form.email, phone: form.phone,
        headline: form.headline, bio: form.bio, location: form.location,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        education: form.education,
        skills: form.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
        portfolio_url: form.portfolio_url,
      };
      if (profile?.id) {
        const updated = await base44.entities.CandidateProfile.update(profile.id, payload);
        setProfile(updated);
      } else {
        const created = await base44.entities.CandidateProfile.create(payload);
        setProfile(created);
      }
      setEditing(false);
    } catch (e) {
      alert(e.message || "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const uploadCv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File không quá 10MB."); return; }
    setUploadingCv(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      let p = profile;
      if (!p?.id) {
        p = await base44.entities.CandidateProfile.create({ full_name: form.full_name || user?.full_name || "Ứng viên", cv_file_uri: up.file_uri });
      } else {
        p = await base44.entities.CandidateProfile.update(profile.id, { cv_file_uri: up.file_uri });
      }
      setProfile(p);
    } catch (e) {
      alert(e.message || "Tải lên thất bại.");
    } finally {
      setUploadingCv(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Vui lòng chọn file ảnh (JPG, PNG, WEBP)."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Ảnh không quá 5MB."); return; }
    setUploadingAvatar(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      let p = profile;
      if (!p?.id) {
        p = await base44.entities.CandidateProfile.create({ full_name: form.full_name || user?.full_name || "Ứng viên", avatar_uri: up.file_uri });
      } else {
        p = await base44.entities.CandidateProfile.update(profile.id, { avatar_uri: up.file_uri });
      }
      setProfile(p);
    } catch (err) {
      alert(err.message || "Tải ảnh thất bại.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Cập nhật hồ sơ; chưa có hồ sơ thì tạo mới
  const patchProfile = async (data) => {
    let p;
    if (profile?.id) p = await base44.entities.CandidateProfile.update(profile.id, data);
    else p = await base44.entities.CandidateProfile.create({ full_name: form.full_name || user?.full_name || "Ứng viên", email: form.email || user?.email || "", ...data });
    setProfile(p);
    return p;
  };

  const saveExtra = async (key, fields) => {
    try {
      await patchProfile(fields);
      setSavedKey(key);
      setTimeout(() => setSavedKey(""), 2000);
    } catch (e) {
      alert(e.message || "Không thể lưu.");
    }
  };

  const uploadCerts = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    const current = profile?.certificate_uris || [];
    const room = 5 - current.length;
    if (room <= 0) { alert("Tối đa 5 tệp chứng chỉ."); return; }
    setUploadingCert(true);
    try {
      const uris = [];
      for (const file of picked.slice(0, room)) {
        if (file.size > 10 * 1024 * 1024) { alert(`${file.name} vượt quá 10MB nên bị bỏ qua.`); continue; }
        const up = await base44.integrations.Core.UploadPrivateFile({ file });
        uris.push(up.file_uri);
      }
      if (uris.length) await patchProfile({ certificate_uris: [...current, ...uris] });
    } catch (err) {
      alert(err.message || "Tải chứng chỉ thất bại.");
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCert = async (uri) => {
    try {
      await patchProfile({ certificate_uris: (profile?.certificate_uris || []).filter((u) => u !== uri) });
    } catch (err) { alert(err.message || "Không thể xóa."); }
  };

  const openFile = async (uri) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      window.open(signed_url, "_blank");
    } catch (e) { alert("Không thể mở tệp."); }
  };

  const downloadCv = async () => {
    if (!profile?.cv_file_uri) return;
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: profile.cv_file_uri });
      window.open(signed_url, "_blank");
    } catch (e) { alert("Không thể xem CV."); }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-20"><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>;
  }

  // Mục bắt buộc còn thiếu để ứng tuyển (tên/email lấy tạm từ tài khoản nếu hồ sơ chưa có)
  const missing = getMissingItems({
    ...(profile || {}),
    full_name: profile?.full_name || user?.full_name,
    email: profile?.email || user?.email,
  });

  const completion = profile
    ? Math.round(((!!profile.full_name + !!profile.phone + !!profile.headline + !!profile.bio + (!!profile.cv_file_uri || !!profile.cv_source_url) + !!profile.portfolio_url + (profile.skills?.length > 0)) / 7) * 100)
    : 0;

  // Lời mời còn hạn và hồ sơ chưa nộp bài / chưa bị loại
  const pendingInvites = invites.filter((inv) => {
    if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) return false;
    const a = applications.find((x) => x.id === inv.application_id);
    return !a || ["cv_passed", "test_invited"].includes(a.status);
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-600 p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <label className="relative mb-3 inline-block cursor-pointer" title="Đổi ảnh đại diện">
                <UserAvatar
                  name={profile?.full_name || user?.full_name}
                  email={user?.email}
                  fileUri={profile?.avatar_uri}
                  size={56}
                  className="ring-2 ring-white/40"
                />
                <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-primary shadow">
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploadingAvatar} />
              </label>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-600">
                <Sparkles className="h-3.5 w-3.5" /> Candidate Room
              </div>
              <h1 className="mt-4 font-heading text-2xl font-800 sm:text-3xl">Xin chào, {profile?.full_name || user?.full_name || "Ứng viên"} 👋</h1>
              <p className="mt-1.5 text-sm text-white/85">Quản lý hồ sơ, CV và theo dõi ứng tuyển của bạn.</p>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-3xl font-800">{completion}%</div>
              <div className="text-xs text-white/80">Hoàn thiện hồ sơ</div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        {pendingInvites.map((inv) => (
          <div key={inv.id} className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm sm:flex-row sm:items-center">
            <Rocket className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="font-600 text-primary">Bạn có bài Job Simulation (Vòng 2) cần làm</div>
              <div className="text-xs text-muted-foreground">
                {inv.job_title || inv.simulation_name || "Vị trí ứng tuyển"}
                {inv.expires_at ? ` · Hạn nộp ${new Date(inv.expires_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}` : ""}
              </div>
            </div>
            <Button asChild size="sm" className="btn-galaxy gap-1.5 rounded-full">
              <Link to={`/job-simulation/${inv.token}`}>Vào làm ngay <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        ))}

        {missing.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-600">Hồ sơ chưa đủ để ứng tuyển.</span> Còn thiếu: {missing.map((m) => m.label).join(", ")}.
            </div>
            <Button size="sm" className="btn-galaxy rounded-full" onClick={() => setTab(missing[0].tab)}>Bổ sung ngay</Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" /> Hồ sơ</TabsTrigger>
            <TabsTrigger value="cv" className="gap-2"><FileText className="h-4 w-4" /> CV, chứng chỉ & dự án</TabsTrigger>
            <TabsTrigger value="apps" className="gap-2"><Briefcase className="h-4 w-4" /> Ứng tuyển</TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile" className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-lg font-700">Thông tin cá nhân</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Cập nhật hồ sơ để tăng cơ hội được tuyển.</p>
                </div>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2"><Pencil className="h-4 w-4" /> Chỉnh sửa</Button>
                ) : (
                  <Button size="sm" onClick={saveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu
                  </Button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Họ và tên" value={form.full_name} disabled={!editing} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Email" value={form.email} disabled={!editing} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Số điện thoại" value={form.phone} disabled={!editing} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Tiêu đề hồ sơ" value={form.headline} disabled={!editing} onChange={(v) => setForm({ ...form, headline: v })} placeholder="VD: Frontend Developer" />
                <Field label="Địa điểm" value={form.location} disabled={!editing} onChange={(v) => setForm({ ...form, location: v })} placeholder="TP. Hồ Chí Minh" />
                <Field label="Số năm kinh nghiệm" value={form.experience_years} disabled={!editing} onChange={(v) => setForm({ ...form, experience_years: v })} placeholder="3" />
                <Field label="Học vấn" value={form.education} disabled={!editing} onChange={(v) => setForm({ ...form, education: v })} placeholder="ĐH Bách Khoa" />
                <Field label="Kỹ năng (cách nhau bởi dấu phẩy)" value={form.skillsText} disabled={!editing} onChange={(v) => setForm({ ...form, skillsText: v })} placeholder="React, Node.js, Figma" />
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Giới thiệu bản thân</Label>
                  {editing ? (
                    <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Mô tả ngắn về bản thân..." />
                  ) : (
                    <p className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm min-h-[60px]">{form.bio || <span className="text-muted-foreground">Chưa có</span>}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* CV & Portfolio tab */}
          <TabsContent value="cv" className="mt-4">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
                  <div>
                    <h3 className="font-600">CV của bạn</h3>
                    <p className="text-xs text-muted-foreground">PDF, DOCX — stored privately</p>
                  </div>
                </div>
                <div className="mt-5">
                  {profile?.cv_file_uri ? (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="flex-1 text-sm font-500">CV đã tải lên</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={downloadCv} className="gap-2"><Download className="h-4 w-4" /> Tải CV</Button>
                        <label>
                          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={uploadCv} />
                          <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-500 hover:bg-muted">
                            {uploadingCv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Cập nhật
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile?.cv_source_url && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="flex-1 text-sm font-500">CV bạn đã nộp trên TopCV</div>
                          </div>
                          <Button asChild size="sm" variant="outline" className="mt-3 gap-2">
                            <a href={profile.cv_source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Mở CV đã nộp</a>
                          </Button>
                        </div>
                      )}
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 transition-colors hover:border-primary hover:bg-primary/5">
                        {uploadingCv ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                        <span className="mt-3 text-sm font-500">{uploadingCv ? "Đang tải..." : "Tải lên CV"}</span>
                        <span className="mt-1 text-xs text-muted-foreground">Nhấn để chọn file</span>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={uploadCv} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Link2 className="h-6 w-6" /></div>
                  <div>
                    <h3 className="font-600">Portfolio</h3>
                    <p className="text-xs text-muted-foreground">Đường link portfolio của bạn</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <Input
                    placeholder="https://portfolio.cua-ban.com"
                    defaultValue={form.portfolio_url}
                    onBlur={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                  />
                  <Button size="sm" variant="outline" className="gap-2" onClick={async () => {
                    if (!profile?.id) { alert("Vui lòng lưu hồ sơ trước."); return; }
                    const p = await base44.entities.CandidateProfile.update(profile.id, { portfolio_url: form.portfolio_url });
                    setProfile(p);
                  }}><Save className="h-4 w-4" /> Lưu link</Button>
                  {profile?.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" /> Mở portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Chứng chỉ */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Award className="h-6 w-6" /></div>
                  <div>
                    <h3 className="font-600">Chứng chỉ</h3>
                    <p className="text-xs text-muted-foreground">Tiếng Anh, chuyên môn — tối đa 5 tệp, không bắt buộc</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Chứng chỉ tiếng Anh</Label>
                    <Input
                      value={extra.english_certificate}
                      onChange={(e) => setExtra({ ...extra, english_certificate: e.target.value })}
                      placeholder="VD: IELTS 7.0 (2025), TOEIC 850"
                    />
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => saveExtra("english", { english_certificate: extra.english_certificate })}>
                      <Save className="h-4 w-4" /> {savedKey === "english" ? "Đã lưu" : "Lưu"}
                    </Button>
                  </div>
                  {(profile?.certificate_uris || []).length > 0 && (
                    <ul className="space-y-2">
                      {profile.certificate_uris.map((uri) => (
                        <li key={uri} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <button type="button" onClick={() => openFile(uri)} className="min-w-0 flex-1 truncate text-left hover:text-primary hover:underline">{fileNameOf(uri)}</button>
                          <button type="button" onClick={() => removeCert(uri)} className="text-muted-foreground hover:text-destructive" aria-label="Xóa chứng chỉ"><Trash2 className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/50 px-3 py-1.5 text-xs font-600 text-primary transition-colors hover:bg-primary/5">
                    {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Thêm tệp chứng chỉ
                    <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={uploadCerts} disabled={uploadingCert} />
                  </label>
                </div>
              </div>

              {/* Dự án & liên kết */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Rocket className="h-6 w-6" /></div>
                  <div>
                    <h3 className="font-600">Dự án & liên kết</h3>
                    <p className="text-xs text-muted-foreground">GitHub, website, ứng dụng bạn đã làm</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">GitHub</Label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={extra.github_url} onChange={(e) => setExtra({ ...extra, github_url: e.target.value })} placeholder="https://github.com/ten-ban" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">Link dự án / website / ứng dụng (mỗi dòng một link)</Label>
                    <Textarea
                      rows={4}
                      value={extra.project_links}
                      onChange={(e) => setExtra({ ...extra, project_links: e.target.value })}
                      placeholder={"https://ten-du-an.vercel.app\nhttps://play.google.com/store/apps/..."}
                    />
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => saveExtra("links", { github_url: extra.github_url, project_links: extra.project_links })}>
                    <Save className="h-4 w-4" /> {savedKey === "links" ? "Đã lưu" : "Lưu"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Applications tab */}
          <TabsContent value="apps" className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-700">Tình trạng ứng tuyển</h2>
                <Button asChild size="sm" variant="outline" className="gap-2"><Link to="/viec-lam"><Plus className="h-4 w-4" /> Tìm việc</Link></Button>
              </div>
              {applications.length === 0 ? (
                <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 font-600">Chưa có ứng tuyển nào</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Bắt đầu ứng tuyển việc làm phù hợp với bạn.</p>
                  <Button asChild className="mt-5"><Link to="/viec-lam">Khám phá việc làm</Link></Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {applications.map((a) => (
                    <ApplicationTimeline key={a.id} app={a} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-600 uppercase tracking-wide text-muted-foreground">{label}</Label>
      {disabled ? (
        <p className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm">{value || <span className="text-muted-foreground">Chưa có</span>}</p>
      ) : (
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}