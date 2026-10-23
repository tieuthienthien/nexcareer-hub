// Phễu tuyển dụng cộng dồn theo 5 bước của quy trình RMS.
const STAGE_INDEX = {
  cv_screening: 0,
  cv_passed: 1,
  cv_rejected: 0,
  test_invited: 1,
  test_submitted: 2,
  test_passed: 3,
  test_rejected: 1,
  interview_invited: 3,
  scheduled: 3,
  interview_submitted: 3,
  final_review: 3,
  hired: 4,
  rejected: 1,
};

export default function FunnelChart({ byStatus = {}, total = 0 }) {
  const reached = [0, 0, 0, 0, 0];
  Object.entries(byStatus).forEach(([status, count]) => {
    const idx = STAGE_INDEX[status];
    if (idx == null) return;
    for (let i = 0; i <= idx; i += 1) reached[i] += count;
  });
  const rejected = (byStatus.cv_rejected || 0) + (byStatus.test_rejected || 0) + (byStatus.rejected || 0);

  const stages = [
    { label: "Nộp hồ sơ", value: total, color: "from-indigo-500 to-violet-500" },
    { label: "Qua sàng lọc CV", value: reached[1], color: "from-violet-500 to-fuchsia-500" },
    { label: "Hoàn thành Job Simulation", value: reached[2], color: "from-fuchsia-500 to-pink-500" },
    { label: "Phỏng vấn Line Manager", value: reached[3], color: "from-pink-500 to-rose-500" },
    { label: "Nhận việc", value: reached[4], color: "from-emerald-500 to-teal-500" },
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
          <div className="mt-0.5 font-heading text-2xl font-800 text-emerald-600">{total ? Math.round((reached[4] / total) * 100) : 0}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Tỷ lệ qua sàng lọc CV</div>
          <div className="mt-0.5 font-heading text-2xl font-800 text-primary">{total ? Math.round((reached[1] / total) * 100) : 0}%</div>
        </div>
      </div>
    </div>
  );
}