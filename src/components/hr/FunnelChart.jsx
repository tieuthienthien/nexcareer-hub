// Phễu tuyển dụng cộng dồn: số ứng viên đạt tới mỗi mốc
export default function FunnelChart({ byStatus = {}, total = 0 }) {
  const s = (k) => byStatus[k] || 0;
  const reached_test =
    s("test_invited") + s("test_submitted") + s("test_passed") + s("test_rejected") +
    s("interview_invited") + s("interview_submitted") + s("hired");
  const reached_interview =
    s("interview_invited") + s("interview_submitted") + s("hired");
  const hired = s("hired");
  const rejected = s("cv_rejected") + s("test_rejected") + s("rejected");

  const stages = [
    { label: "Nộp hồ sơ", value: total, color: "from-indigo-500 to-violet-500" },
    { label: "Vào vòng thi", value: reached_test, color: "from-violet-500 to-fuchsia-500" },
    { label: "Vòng phỏng vấn", value: reached_interview, color: "from-fuchsia-500 to-pink-500" },
    { label: "Nhận việc", value: hired, color: "from-emerald-500 to-teal-500" },
  ];

  const max = Math.max(total, 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-700">Phễu tuyển dụng</h2>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-600 text-rose-600">Từ chối: {rejected}</span>
      </div>
      <div className="mt-5 space-y-3">
        {stages.map((st, i) => {
          const pct = Math.round((st.value / max) * 100);
          const conv = i > 0 && stages[i - 1].value > 0
            ? Math.round((st.value / stages[i - 1].value) * 100)
            : null;
          return (
            <div key={st.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-500">{st.label}</span>
                <span className="font-700">{st.value}{conv != null && <span className="ml-2 text-xs font-500 text-muted-foreground">→ {conv}%</span>}</span>
              </div>
              <div className="mt-1.5 h-8 overflow-hidden rounded-lg bg-muted">
                <div className={`h-full rounded-lg bg-gradient-to-r ${st.color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <div className="text-xs text-muted-foreground">Tỷ lệ nhận việc (toàn phễu)</div>
          <div className="mt-0.5 font-heading text-2xl font-800 text-emerald-600">{total ? Math.round((hired / total) * 100) : 0}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Tỷ lệ qua sàng lọc CV</div>
          <div className="mt-0.5 font-heading text-2xl font-800 text-primary">{total ? Math.round((reached_test / total) * 100) : 0}%</div>
        </div>
      </div>
    </div>
  );
}