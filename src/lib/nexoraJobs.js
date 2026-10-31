// 6 vị trí tuyển dụng chuẩn của Nexora Technology, theo 6 mục chuyên môn trên nexoratechno.com.
// Trường `skills` chính là các nhãn (tag) của từng mục. `category` trùng tên mục để lọc ở trang Việc làm.

export const NEXORA_SOURCE = "nexora-seed";

export const CAT = {
  web: "Web & trải nghiệm số",
  mobile: "Ứng dụng di động",
  enterprise: "Phần mềm doanh nghiệp",
  ai: "AI & kỹ thuật dữ liệu",
  iot: "IoT & hệ thống kết nối",
  ops: "Hiện đại hóa & vận hành",
};

const COMMON = {
  company: "Nexora Technology",
  location: "TP. Hồ Chí Minh",
  work_type: "hybrid",
  employment_type: "full-time",
  salary_visible: true,
  deadline: "2026-12-31",
  status: "published",
  featured: false,
  exam_question_count: 10,
  exam_duration_min: 45,
  test_type: "none",
  external_source: NEXORA_SOURCE,
};

const BENEFITS = [
  "• Thu nhập cạnh tranh, xét điều chỉnh lương định kỳ theo năng lực.",
  "• Làm việc hybrid linh hoạt tại TP. Hồ Chí Minh.",
  "• Tham gia dự án thực tế cho khách hàng, có người hướng dẫn kèm cặp.",
  "• Lộ trình phát triển rõ ràng, hỗ trợ học tập và chứng chỉ chuyên môn.",
  "• Bảo hiểm và chế độ theo quy định của pháp luật.",
].join("\n");

export const NEXORA_JOBS = [
  {
    external_id: "nexora-01-web",
    title: "Frontend Engineer (React / Next.js)",
    category: CAT.web,
    experience_level: "junior",
    salary_min: 12,
    salary_max: 25,
    vacancy: 2,
    exam_group: "lap-trinh",
    skills: ["React", "Next.js", "Vue", "UI & UX"],
    description: [
      "Xây dựng website, nền tảng web và giao diện sản phẩm cho khách hàng của Nexora, kết hợp UI/UX, hiệu năng và khả năng truy cập.",
      "",
      "• Phát triển giao diện bằng React / Next.js (có thể làm thêm Vue) từ thiết kế Figma.",
      "• Phối hợp với designer để hiện thực hóa trải nghiệm người dùng đúng thiết kế, responsive trên mọi thiết bị.",
      "• Tối ưu hiệu năng tải trang, SEO kỹ thuật và khả năng truy cập (accessibility).",
      "• Làm việc với backend qua REST/GraphQL API; viết code sạch, có review và kiểm thử.",
    ].join("\n"),
    requirements: [
      "• Nắm vững HTML, CSS, JavaScript/TypeScript; có kinh nghiệm thực tế với React.",
      "• Biết Next.js hoặc Vue là lợi thế; hiểu SSR/SSG, routing, quản lý state.",
      "• Có tư duy UI/UX, chú ý chi tiết giao diện và trải nghiệm người dùng.",
      "• Quen dùng Git, làm việc nhóm; đọc được tài liệu tiếng Anh kỹ thuật.",
      "• Sinh viên năm cuối hoặc 0–2 năm kinh nghiệm; có sản phẩm/portfolio là điểm cộng.",
    ].join("\n"),
    benefits: BENEFITS,
    interview_questions: [
      "Bạn hiểu thế nào về SSR, SSG và CSR? Khi nào chọn mỗi cách trong Next.js?",
      "Bạn tối ưu hiệu năng một trang web chậm theo những bước nào?",
      "Hãy kể về một giao diện bạn đã làm: bạn xử lý responsive và khả năng truy cập ra sao?",
    ],
  },
  {
    external_id: "nexora-02-mobile",
    title: "Mobile Developer (iOS / Android / Flutter)",
    category: CAT.mobile,
    experience_level: "mid",
    salary_min: 15,
    salary_max: 32,
    vacancy: 2,
    exam_group: "lap-trinh",
    skills: ["Swift", "Kotlin", "React Native", "Flutter"],
    description: [
      "Phát triển ứng dụng iOS, Android và đa nền tảng, kết nối trải nghiệm người dùng với hệ thống phía sau, từ MVP đến các phiên bản tiếp theo.",
      "",
      "• Xây dựng và duy trì ứng dụng di động bằng Swift, Kotlin, React Native hoặc Flutter.",
      "• Tích hợp API, xác thực, thông báo đẩy, thanh toán và lưu trữ dữ liệu cục bộ.",
      "• Tối ưu hiệu năng, dung lượng, mức tiêu thụ pin và chất lượng ổn định (crash-free).",
      "• Tham gia đưa ứng dụng lên App Store / Google Play và theo dõi phản hồi người dùng.",
    ].join("\n"),
    requirements: [
      "• Tối thiểu 1–3 năm kinh nghiệm phát triển ứng dụng di động, thành thạo ít nhất một trong: Swift, Kotlin, React Native, Flutter.",
      "• Hiểu kiến trúc ứng dụng (MVVM/Clean), quản lý state và xử lý bất đồng bộ.",
      "• Có kinh nghiệm làm việc với REST API và quy trình phát hành ứng dụng.",
      "• Chủ động, có tinh thần học hỏi các nền tảng mới.",
    ].join("\n"),
    benefits: BENEFITS,
    interview_questions: [
      "So sánh phát triển native (Swift/Kotlin) và đa nền tảng (Flutter/React Native): bạn chọn thế nào cho từng dự án?",
      "Bạn xử lý đồng bộ dữ liệu khi người dùng mất kết nối mạng như thế nào?",
      "Bạn đã từng tối ưu một ứng dụng chậm hoặc hay crash chưa? Hãy kể cách làm.",
    ],
  },
  {
    external_id: "nexora-03-enterprise",
    title: "Backend Engineer (.NET / Go / Node.js)",
    category: CAT.enterprise,
    experience_level: "mid",
    salary_min: 18,
    salary_max: 38,
    vacancy: 2,
    exam_group: "lap-trinh",
    skills: [".NET", "Go", "Node.js", "PostgreSQL"],
    description: [
      "Xây dựng phần mềm doanh nghiệp (CRM, ERP, SaaS) và hệ thống nghiệp vụ theo yêu cầu: thiết kế luồng dữ liệu, tích hợp hệ thống và tự động hóa quy trình.",
      "",
      "• Thiết kế và phát triển dịch vụ backend bằng .NET, Go hoặc Node.js.",
      "• Thiết kế cơ sở dữ liệu PostgreSQL, tối ưu truy vấn và đảm bảo toàn vẹn dữ liệu.",
      "• Tích hợp với hệ thống bên thứ ba (thanh toán, kế toán, nhân sự…) qua API.",
      "• Viết kiểm thử, tài liệu API, tham gia code review và vận hành dịch vụ.",
    ].join("\n"),
    requirements: [
      "• 2–4 năm kinh nghiệm backend, thành thạo ít nhất một trong: .NET, Go, Node.js.",
      "• Vững SQL và PostgreSQL; hiểu transaction, index, migration.",
      "• Có kinh nghiệm thiết kế REST API, xác thực/phân quyền và xử lý lỗi.",
      "• Hiểu nghiệp vụ doanh nghiệp (CRM/ERP/SaaS) là lợi thế.",
      "• Quen dùng Git, Docker và quy trình làm việc nhóm.",
    ].join("\n"),
    benefits: BENEFITS,
    interview_questions: [
      "Bạn thiết kế schema và phân quyền cho một hệ thống CRM nhiều công ty (multi-tenant) như thế nào?",
      "Một truy vấn PostgreSQL chạy chậm: bạn phân tích và tối ưu theo các bước nào?",
      "Bạn đảm bảo tính nhất quán dữ liệu khi tích hợp với nhiều hệ thống bên ngoài ra sao?",
    ],
  },
  {
    external_id: "nexora-04-ai",
    title: "AI & Data Engineer",
    category: CAT.ai,
    experience_level: "mid",
    salary_min: 20,
    salary_max: 40,
    vacancy: 1,
    exam_group: "lap-trinh",
    skills: ["AI Agents", "PyTorch", "ONNX", "Data Pipelines"],
    description: [
      "Ứng dụng AI agent, thị giác máy tính và dữ liệu vào các bài toán cụ thể, từ thử nghiệm tính khả thi đến tích hợp vào quy trình sản phẩm.",
      "",
      "• Xây dựng và huấn luyện mô hình bằng PyTorch; chuyển đổi và triển khai bằng ONNX.",
      "• Phát triển AI agent và quy trình xử lý ngôn ngữ/hình ảnh cho sản phẩm thực tế.",
      "• Thiết kế data pipeline thu thập, làm sạch, gán nhãn và lưu trữ dữ liệu.",
      "• Đánh giá chất lượng mô hình, theo dõi hiệu năng và cải tiến liên tục.",
    ].join("\n"),
    requirements: [
      "• 2–4 năm kinh nghiệm AI/ML hoặc data engineering; thành thạo Python.",
      "• Có kinh nghiệm với PyTorch; biết ONNX và triển khai mô hình là lợi thế.",
      "• Hiểu thiết kế data pipeline, SQL và các công cụ xử lý dữ liệu.",
      "• Có tư duy đo lường, biết đánh giá mô hình bằng các chỉ số phù hợp.",
      "• Đọc hiểu tài liệu và bài báo kỹ thuật bằng tiếng Anh.",
    ].join("\n"),
    benefits: BENEFITS,
    interview_questions: [
      "Bạn chọn chỉ số nào để đánh giá một mô hình phân loại mất cân bằng dữ liệu, và vì sao?",
      "Bạn đưa một mô hình PyTorch vào môi trường chạy thực tế (ONNX, tối ưu suy luận) theo các bước nào?",
      "Hãy mô tả một data pipeline bạn từng xây dựng và cách đảm bảo chất lượng dữ liệu.",
    ],
  },
  {
    external_id: "nexora-05-iot",
    title: "IoT & Embedded Engineer",
    category: CAT.iot,
    experience_level: "mid",
    salary_min: 15,
    salary_max: 32,
    vacancy: 1,
    exam_group: "iot",
    skills: ["IoT", "Edge AI", "MQTT", "Real-time Data"],
    description: [
      "Kết nối thiết bị, thu thập dữ liệu và trực quan hóa hoạt động; tích hợp cảm biến, hệ thống công nghiệp và dashboard phục vụ vận hành.",
      "",
      "• Phát triển firmware và phần mềm cho thiết bị IoT, kết nối cảm biến và bộ điều khiển.",
      "• Truyền dữ liệu thời gian thực qua MQTT; xây dựng luồng xử lý và lưu trữ dữ liệu.",
      "• Triển khai Edge AI để xử lý dữ liệu ngay trên thiết bị.",
      "• Xây dựng dashboard giám sát và cảnh báo cho vận hành.",
    ].join("\n"),
    requirements: [
      "• 1–3 năm kinh nghiệm lập trình nhúng hoặc IoT (C/C++, Python; ESP32, STM32, Raspberry Pi…).",
      "• Hiểu giao thức MQTT, HTTP và các chuẩn kết nối thiết bị.",
      "• Có kinh nghiệm hoặc quan tâm đến Edge AI và xử lý dữ liệu thời gian thực.",
      "• Biết đọc sơ đồ mạch và gỡ lỗi phần cứng cơ bản là lợi thế.",
    ].join("\n"),
    benefits: BENEFITS,
    interview_questions: [
      "Bạn thiết kế kiến trúc MQTT cho hàng nghìn thiết bị gửi dữ liệu liên tục như thế nào?",
      "Thiết bị mất kết nối mạng giữa chừng: bạn đảm bảo không mất dữ liệu ra sao?",
      "Khi nào nên chạy mô hình AI trên thiết bị (Edge) thay vì trên đám mây?",
    ],
  },
  {
    external_id: "nexora-06-ops",
    title: "DevOps & Cloud Migration Engineer",
    category: CAT.ops,
    experience_level: "senior",
    salary_min: 22,
    salary_max: 42,
    vacancy: 1,
    exam_group: "lap-trinh",
    skills: ["Cloud", "Migration", "CI/CD", "Maintenance"],
    description: [
      "Đánh giá hệ thống cũ, di chuyển từng giai đoạn, bảo trì và xử lý sự cố production; ưu tiên tính liên tục của hoạt động và khả năng quan sát hệ thống.",
      "",
      "• Đánh giá hệ thống hiện hữu và lập kế hoạch di chuyển lên Cloud theo từng giai đoạn.",
      "• Xây dựng và duy trì CI/CD, hạ tầng dưới dạng mã (IaC), môi trường staging/production.",
      "• Giám sát, ghi log và cảnh báo; xử lý sự cố production và rà soát sau sự cố.",
      "• Bảo trì định kỳ, vá lỗi bảo mật và tối ưu chi phí hạ tầng.",
    ].join("\n"),
    requirements: [
      "• 3–5 năm kinh nghiệm DevOps/SRE hoặc vận hành hệ thống.",
      "• Thành thạo ít nhất một nền tảng Cloud (AWS, GCP hoặc Azure), Docker và CI/CD.",
      "• Có kinh nghiệm di chuyển hệ thống (migration) hoặc hiện đại hóa ứng dụng cũ.",
      "• Hiểu giám sát, logging, backup và quy trình xử lý sự cố.",
      "• Kỹ năng giao tiếp tốt để phối hợp với nhóm phát triển và khách hàng.",
    ].join("\n"),
    benefits: BENEFITS,
    interview_questions: [
      "Bạn lập kế hoạch di chuyển một hệ thống cũ lên Cloud mà không làm gián đoạn hoạt động như thế nào?",
      "Hãy mô tả một sự cố production bạn đã xử lý: nguyên nhân gốc và bạn ngăn tái diễn ra sao?",
      "Bạn thiết kế pipeline CI/CD an toàn (kiểm thử, phê duyệt, rollback) theo các bước nào?",
    ],
  },
];

/**
 * Nạp 6 việc làm vào cơ sở dữ liệu và XÓA mọi việc làm khác (kể cả bản nháp, đã đóng).
 * - Chạy lại nhiều lần không bị trùng: việc đã nạp được cập nhật thay vì tạo mới.
 * - Xóa là vĩnh viễn, không khôi phục được.
 */
export async function replaceWithNexoraJobs(base44) {
  const Job = base44.entities.Job;
  const existing = (await Job.filter({ external_source: NEXORA_SOURCE }, { limit: 50 })).items || [];
  const byId = new Map(existing.map((j) => [j.external_id, j]));
  let created = 0;
  let updated = 0;

  // Tạo theo thứ tự ngược để việc số 01 là mới nhất và hiện đầu danh sách.
  for (const spec of [...NEXORA_JOBS].reverse()) {
    const data = { ...COMMON, ...spec };
    const found = byId.get(spec.external_id);
    if (found) {
      await Job.update(found.id, data);
      updated += 1;
    } else {
      await Job.create(data);
      created += 1;
    }
  }

  let removed = 0;
  for (let round = 0; round < 50; round += 1) {
    const items = ((await Job.filter({}, { limit: 100 })).items || []).filter(
      (j) => j.external_source !== NEXORA_SOURCE,
    );
    if (items.length === 0) break;
    for (const j of items) {
      await Job.delete(j.id);
      removed += 1;
    }
  }
  return { created, updated, removed };
}

