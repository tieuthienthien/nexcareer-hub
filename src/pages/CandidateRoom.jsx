import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, Briefcase, Upload, Download, Link2, Loader2, CheckCircle2, ExternalLink, Pencil, Save, Plus, Sparkles } from "lucide-react";
import { applicationStatusLabel, applicationStatusColor } from "@/lib/jobUtils";
import ApplicationTimeline from "@/components/candidate/ApplicationTimeline";

export default function CandidateRoom() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [applications, setApplications] = useState([]);
  const [uploadingCv, setUploadingCv] = useState(false);

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
      } catch (e) {}
      try {
        const apps = await base44.entities.Application.filter(
          { $or: [{ created_by_id: user?.id }, { email: user?.email }] },
          { sort: "-created_date", limit: 50 }
        );
        setApplications(apps.items || []);
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

  const completion = profile
    ? Math.round(((!!profile.full_name + !!profile.phone + !!profile.headline + !!profile.bio + (!!profile.cv_file_uri || !!profile.cv_source_url) + !!profile.portfolio_url + (profile.skills?.length > 0)) / 7) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-600 p-6 text-white shadow-xl sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <UserAvatar
                name={profile?.full_name || user?.full_name}
                email={user?.email}
                size={56}
                className="mb-3 ring-2 ring-white/40"
              />
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

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" /> Hồ sơ</TabsTrigger>
            <TabsTrigger value="cv" className="gap-2"><FileText className="h-4 w-4" /> CV & Portfolio</TabsTrigger>
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