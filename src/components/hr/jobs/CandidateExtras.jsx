import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Github, Link2, Award, FileText, ExternalLink, FolderGit2, GraduationCap, Briefcase, MapPin, Sparkles, Loader2 } from "lucide-react";
import { splitLinks, fileNameOf } from "@/lib/candidateProfile";

const PROJECT_PREFIX = "Dự án / liên kết khác:";

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 break-words text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

function LinkItem({ href }) {
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-primary hover:underline">
      {href} <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

// Hiển thị những gì ứng viên đã điền ở Candidate Room: GitHub, portfolio, dự án, chứng chỉ, giới thiệu, kỹ năng...
// Ưu tiên dữ liệu chụp lại trên hồ sơ lúc nộp; thiếu thì bổ sung từ hồ sơ Candidate Room hiện tại của ứng viên.
export default function CandidateExtras({ app }) {
  const [profile, setProfile] = useState(null);
  const [opening, setOpening] = useState("");

  useEffect(() => {
    let alive = true;
    setProfile(null);
    (async () => {
      try {
        let res = app?.email ? await base44.entities.CandidateProfile.filter({ email: app.email }, { limit: 1 }) : { items: [] };
        if (!res.items?.length && app?.created_by_id) {
          res = await base44.entities.CandidateProfile.filter({ created_by_id: app.created_by_id }, { limit: 1 });
        }
        if (alive) setProfile(res.items?.[0] || null);
      } catch (e) {
        if (alive) setProfile(null);
      }
    })();
    return () => { alive = false; };
  }, [app?.id, app?.email, app?.created_by_id]);

  if (!app) return null;

  const cover = String(app.cover_letter || "");
  const idx = cover.indexOf(PROJECT_PREFIX);
  const snapshotProjects = idx > -1 ? splitLinks(cover.slice(idx + PROJECT_PREFIX.length)) : [];
  const coverText = (idx > -1 ? cover.slice(0, idx) : cover).trim();

  const github = app.github_url || profile?.github_url || "";
  const portfolio = app.portfolio_url || profile?.portfolio_url || "";
  const english = app.english_certificate || profile?.english_certificate || "";
  const projects = snapshotProjects.length ? snapshotProjects : splitLinks(profile?.project_links);
  const certs = (app.certificate_uris && app.certificate_uris.length ? app.certificate_uris : profile?.certificate_uris) || [];
  const skills = (app.skills && app.skills.length ? app.skills : profile?.skills) || [];
  const bio = profile?.bio || "";
  const education = profile?.education || app.education_level || "";
  const years = profile?.experience_years ?? app.years_experience;
  const location = profile?.location || "";
  const headline = profile?.headline || "";

  const openFile = async (uri) => {
    if (/^https?:\/\//i.test(uri)) { window.open(uri, "_blank", "noopener"); return; }
    setOpening(uri);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 });
      window.open(signed_url, "_blank", "noopener");
    } catch (e) {
      alert("Không mở được tệp này.");
    } finally {
      setOpening("");
    }
  };

  const hasAnything = github || portfolio || english || projects.length || certs.length || skills.length || bio || education || years != null || location || headline || coverText;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-sm font-700">Hồ sơ năng lực <span className="font-400 text-muted-foreground">· ứng viên điền ở Candidate Room</span></h4>
      {!hasAnything ? (
        <p className="mt-2 text-sm text-muted-foreground">Ứng viên chưa bổ sung GitHub, portfolio, dự án hay chứng chỉ nào.</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {headline && <Row icon={Sparkles} label="Chức danh">{headline}</Row>}
          {(years != null && years !== "") && <Row icon={Briefcase} label="Kinh nghiệm">{years} năm</Row>}
          {education && <Row icon={GraduationCap} label="Học vấn">{education}</Row>}
          {location && <Row icon={MapPin} label="Địa điểm">{location}</Row>}
          {github && <Row icon={Github} label="GitHub"><LinkItem href={github} /></Row>}
          {portfolio && <Row icon={Link2} label="Portfolio"><LinkItem href={portfolio} /></Row>}
          {english && <Row icon={Award} label="Chứng chỉ tiếng Anh">{english}</Row>}
          {skills.length > 0 && (
            <Row icon={Sparkles} label="Kỹ năng">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-600 text-primary">{s}</span>)}
              </div>
            </Row>
          )}
          {projects.length > 0 && (
            <div className="sm:col-span-2">
              <Row icon={FolderGit2} label={`Dự án / liên kết khác (${projects.length})`}>
                <ul className="space-y-1">{projects.map((p, i) => <li key={`${p}-${i}`}><LinkItem href={p} /></li>)}</ul>
              </Row>
            </div>
          )}
          {certs.length > 0 && (
            <div className="sm:col-span-2">
              <Row icon={FileText} label={`Chứng chỉ đính kèm (${certs.length})`}>
                <div className="flex flex-wrap gap-2">
                  {certs.map((uri, i) => (
                    <Button key={`${uri}-${i}`} type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => openFile(uri)} disabled={opening === uri}>
                      {opening === uri ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      {String(uri).startsWith("http") ? `Chứng chỉ ${i + 1}` : fileNameOf(uri)}
                    </Button>
                  ))}
                </div>
              </Row>
            </div>
          )}
          {bio && <div className="sm:col-span-2"><Row icon={Sparkles} label="Giới thiệu bản thân"><p className="whitespace-pre-wrap">{bio}</p></Row></div>}
          {coverText && <div className="sm:col-span-2"><Row icon={FileText} label="Thư giới thiệu"><p className="whitespace-pre-wrap">{coverText}</p></Row></div>}
        </div>
      )}
    </div>
  );
}
