import { dateRange } from "@/lib/cvUtils";

export default function CvPreview({ cv }) {
  const t = cv.template || "nexora";
  const accent = t === "signal" ? "text-orange-600" : t === "editorial" ? "text-slate-800" : "text-teal-700";
  const rule = t === "signal" ? "border-orange-200" : t === "editorial" ? "border-slate-300" : "border-teal-200";
  const serif = t === "editorial";
  const contact = [cv.email, cv.phone, cv.address].filter(Boolean).join("   ·   ");

  const skills = cv.skills || [];
  const languages = cv.languages || [];
  const certificates = cv.certificates || [];
  const experience = cv.experience || [];
  const education = cv.education || [];

  const Head = ({ children }) => (
    <h3 className={`mb-2 text-[10px] font-700 uppercase tracking-[0.18em] ${accent}`}>{children}</h3>
  );

  const Experience = () =>
    experience.length > 0 && (
      <section>
        <Head>Kinh nghiệm làm việc</Head>
        <div className="space-y-3">
          {experience.map((e, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <span className="text-[12.5px] font-700 text-slate-900">{e.role || "Vị trí"}</span>
                <span className="text-[10px] text-slate-500">{dateRange(e.start_date, e.end_date)}</span>
              </div>
              <div className="text-[11.5px] font-600 text-slate-600">{e.company}</div>
              {e.description && <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-slate-600">{e.description}</p>}
            </div>
          ))}
        </div>
      </section>
    );

  const Education = () =>
    education.length > 0 && (
      <section>
        <Head>Học vấn</Head>
        <div className="space-y-2.5">
          {education.map((e, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <span className="text-[12.5px] font-700 text-slate-900">{e.school || "Trường"}</span>
                <span className="text-[10px] text-slate-500">{dateRange(e.start_date, e.end_date)}</span>
              </div>
              <div className="text-[11.5px] text-slate-600">{e.major}</div>
              {e.description && <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-slate-600">{e.description}</p>}
            </div>
          ))}
        </div>
      </section>
    );

  const SkillList = ({ title, items }) =>
    items.length > 0 && (
      <section>
        <Head>{title}</Head>
        {t === "signal" ? (
          <div className="flex flex-wrap gap-1.5">
            {items.map((s, i) => (
              <span key={i} className="rounded bg-orange-50 px-1.5 py-0.5 text-[10.5px] font-500 text-orange-800">{s}</span>
            ))}
          </div>
        ) : (
          <p className="text-[11.5px] leading-relaxed text-slate-600">{items.join("   ·   ")}</p>
        )}
      </section>
    );

  return (
    <div
      id="cv-print"
      className={`mx-auto w-full max-w-[720px] bg-white ${serif ? "font-serif" : ""} text-slate-800`}
      style={{ fontFamily: serif ? "'Georgia', 'Times New Roman', serif" : "'Be Vietnam Pro', sans-serif" }}
    >
      <div className="p-9 sm:p-11">
        <header className={t === "editorial" ? "border-b pb-4 text-center " + rule : "border-l-4 pl-4 " + (t === "signal" ? "border-orange-500" : "border-teal-600")}>
          <h1 className={`${serif ? "text-[30px] font-400 tracking-tight" : "text-[26px] font-800 tracking-tight"} text-slate-900`}>
            {cv.full_name || "Họ và tên"}
          </h1>
          {cv.headline && <p className={`mt-1 text-[13px] ${accent}`}>{cv.headline}</p>}
          <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">{contact}</p>
        </header>

        {t === "signal" ? (
          <div className="mt-6 grid grid-cols-[1.65fr_1fr] gap-6">
            <div className="space-y-5">
              {cv.summary && (
                <section>
                  <Head>Giới thiệu</Head>
                  <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-slate-600">{cv.summary}</p>
                </section>
              )}
              <Experience />
              <Education />
            </div>
            <aside className={`space-y-5 border-l pl-4 ${rule}`}>
              <SkillList title="Kỹ năng" items={skills} />
              <SkillList title="Chứng chỉ" items={certificates} />
              <SkillList title="Ngoại ngữ" items={languages} />
            </aside>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {cv.summary && (
              <section>
                <Head>Giới thiệu</Head>
                <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-slate-600">{cv.summary}</p>
                <div className={`mt-4 border-t ${rule}`} />
              </section>
            )}
            <Experience />
            <Education />
            <SkillList title="Kỹ năng" items={skills} />
            <SkillList title="Chứng chỉ" items={certificates} />
            <SkillList title="Ngoại ngữ" items={languages} />
          </div>
        )}

        {!cv.summary && experience.length === 0 && education.length === 0 && skills.length === 0 && (
          <p className="mt-10 text-center text-[11px] text-slate-400">Bắt đầu điền thông tin để xem CV của bạn tại đây.</p>
        )}
      </div>
    </div>
  );
}