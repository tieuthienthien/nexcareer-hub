// Nội dung dùng chung cho Job Simulation (Vòng 2) — bài mẫu và ngân hàng câu hỏi tình huống.

export const SAMPLE_SIMULATION = {
  name: "Một ngày làm Software Engineer tại Nexora Technology",
  role_title: "Lập trình viên / Kỹ sư phần mềm (JavaScript/Node.js)",
  description:
    "Bạn là kỹ sư phần mềm mới của đội Thanh toán (Payments) tại Nexora Technology. Sáng thứ Hai, trưởng nhóm giao cho bạn xử lý một lỗi sản xuất và một tính năng mới. Bài mô phỏng tái hiện đúng công việc hằng ngày: đọc ticket, sửa code, viết tính năng, xử lý sự cố và báo cáo lại cho đội.",
  duration_min: 60,
  pass_score: 80,
  status: "active",
  criteria: "100 điểm · Đạt từ 80 điểm · Task 1 (30) sửa lỗi, Task 2 (30) viết tính năng, Task 3 (20) xử lý sự cố, Task 4 (20) giao tiếp.",
  tasks: [
    {
      id: "task1",
      title: "Sửa lỗi sản xuất",
      type: "code",
      points: 30,
      prompt:
        "Ticket #4821 — Khách bị tính sai giảm giá đơn hàng.\n\nMô tả: khách áp 2 voucher nhưng hệ thống chỉ trừ 1 voucher, và tổng tiền lệch vài đồng so với hoá đơn.\n\nYêu cầu nghiệp vụ của hàm total(items, vouchers, taxRate):\n• subtotal = Σ(price × qty)\n• discount = subtotal × tổng các voucher (cộng dồn, tối đa 100%)\n• thuế tính trên giá SAU giảm: taxable = subtotal − discount\n• trả về Math.round(taxable × (1 + taxRate) × 100) / 100 (làm tròn 2 chữ số thập phân)\n• đơn rỗng trả về 0\n\nSửa code bên phải rồi bấm “Chạy kiểm thử”.",
      starter_code: `// Ticket #4821 — hàm tính tổng tiền đơn hàng (đang có lỗi)
function total(items, vouchers = [], taxRate = 0) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.qty;
  }

  // TODO: voucher phải cộng dồn, không ghi đè
  let discount = 0;
  for (const v of vouchers) {
    discount = subtotal * v;
  }

  const afterDiscount = subtotal - discount;

  // TODO: thuế phải tính trên giá sau giảm, làm tròn 2 chữ số
  return Math.round(afterDiscount + subtotal * taxRate);
}
`,
    },
    {
      id: "task2",
      title: "Viết tính năng mới",
      type: "code",
      points: 30,
      prompt:
        "Yêu cầu từ Product Manager: API thanh toán bị gọi quá nhiều từ một đối tác. Viết hàm giới hạn tần suất gọi (rate limiter).\n\nHợp đồng hàm:\nfunction createRateLimiter({ limit, windowMs }) → trả về hàm allow(key, now)\n• allow(key, now) trả về true nếu key còn lượt trong cửa sổ hiện tại, false nếu vượt limit.\n• Cửa sổ tính theo tham số now (mili-giây). Nếu now − thời điểm mở cửa sổ ≥ windowMs thì mở cửa sổ mới và đếm lại.\n• Mỗi key có bộ đếm riêng. Nếu không truyền now, dùng Date.now().\n\nVí dụ: const allow = createRateLimiter({ limit: 3, windowMs: 1000 });\nallow('a', 0) → true (lần 1) … lần thứ 4 trong cùng 1000ms → false; sau 1000ms → true.\n\n80% điểm từ test tự động, 20% từ AI nhận xét chất lượng code (đặt tên, độ phức tạp, dễ đọc).",
      starter_code: `// Yêu cầu từ PM: giới hạn tần suất gọi API theo key
function createRateLimiter({ limit, windowMs }) {
  // Viết code của bạn ở đây
  return function allow(key, now) {
    return true;
  };
}
`,
    },
    {
      id: "task3",
      title: "Xử lý sự cố tình huống",
      type: "mcq",
      points: 20,
      prompt:
        "2 giờ sáng, cảnh báo tự động báo tỉ lệ thanh toán lỗi tăng từ 0,5% lên 32% ngay sau bản deploy 20 phút trước. Chọn phương án bạn sẽ làm cho mỗi tình huống.",
    },
    {
      id: "task4",
      title: "Giao tiếp công việc",
      type: "writing",
      points: 20,
      prompt:
        "Viết tin nhắn ngắn (120–220 từ) gửi trưởng nhóm và PM, trong đó nêu: (1) nguyên nhân gốc của lỗi tính giảm giá, (2) cách bạn đã sửa, (3) rủi ro còn lại và (4) việc bạn sẽ làm tiếp theo.\n\nGiọng chuyên nghiệp, trung thực, không đổ lỗi cho người khác.",
    },
  ],
};

export const MCQ_TASK3 = [
  {
    id: "q1",
    prompt: "Việc đầu tiên bạn làm khi thấy cảnh báo?",
    options: [
      { text: "Kiểm tra log, metric và xác định bản deploy liên quan trước khi hành động", points: 5 },
      { text: "Rollback ngay bản deploy gần nhất rồi mới điều tra", points: 4 },
      { text: "Chờ tới sáng để có người review cùng", points: 1 },
      { text: "Tắt toàn bộ cổng thanh toán và không thông báo cho ai", points: 0 },
    ],
  },
  {
    id: "q2",
    prompt: "Cách xử lý production trong lúc sự cố?",
    options: [
      { text: "Rollback về bản ổn định trước, sau đó sửa trên nhánh riêng và kiểm thử", points: 5 },
      { text: "Vừa hotfix trực tiếp vừa rollback cùng lúc trên production", points: 2 },
      { text: "Sửa trực tiếp trên production cho nhanh", points: 1 },
      { text: "Không làm gì, chờ lỗi tự hết", points: 0 },
    ],
  },
  {
    id: "q3",
    prompt: "Bạn báo cáo sự cố thế nào?",
    options: [
      { text: "Báo ngay cho trưởng nhóm và PM theo kênh sự cố, kèm mốc thời gian và phạm vi ảnh hưởng", points: 5 },
      { text: "Chờ sửa xong hoàn toàn rồi mới báo một lần", points: 2 },
      { text: "Chỉ báo khi có khách phàn nàn", points: 1 },
      { text: "Tự xử lý, không cần báo ai", points: 0 },
    ],
  },
  {
    id: "q4",
    prompt: "Sau khi đã sửa, bạn kiểm tra thế nào?",
    options: [
      { text: "Chạy bộ test, thử luồng thanh toán trên staging với dữ liệu mẫu, theo dõi metric production", points: 5 },
      { text: "Đặt thử một đơn thật trên production bằng tài khoản khách", points: 2 },
      { text: "Nhờ khách thử lại giúp", points: 1 },
      { text: "Tin là code đã đúng nên không cần kiểm tra", points: 0 },
    ],
  },
];

// Chỉ trả về phần ứng viên được thấy (không kèm điểm/đáp án).
export function publicTasks(sim: any) {
  const tasks = Array.isArray(sim?.tasks) && sim.tasks.length ? sim.tasks : SAMPLE_SIMULATION.tasks;
  return tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    points: t.points,
    prompt: t.prompt,
    starter_code: t.starter_code || "",
  }));
}

export function mcqQuestions() {
  return MCQ_TASK3.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options.map((o) => o.text) }));
}