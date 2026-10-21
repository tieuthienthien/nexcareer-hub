// Thư viện nhãn cho công cụ tạo JD. Mỗi nhóm có danh sách nhãn gợi ý kèm band (nếu có).
export const RUBRIC_GROUPS = [
  {
    key: "skills",
    label: "Kỹ năng",
    hint: "Kỹ năng chuyên môn và công cụ cần dùng",
    tags: [
      { label: "C++" }, { label: "C#" }, { label: "JavaScript" }, { label: "TypeScript" }, { label: "Python" },
      { label: "Java" }, { label: "ReactJS" }, { label: "Node.js" }, { label: "SQL" }, { label: "Docker" },
      { label: "Git" }, { label: "REST API" }, { label: "Figma" }, { label: "UX Research" }, { label: "Embedded C" },
    ],
  },
  {
    key: "certificates",
    label: "Bằng cấp / Chứng chỉ",
    hint: "Bằng cấp và chứng chỉ, có thể chọn band cụ thể",
    tags: [
      { label: "IELTS", bands: ["5.5", "6.0", "6.5", "7.0+"] },
      { label: "TOEIC", bands: ["600", "700", "800", "850+"] },
      { label: "MOS", bands: ["Word", "Excel", "PowerPoint"] },
      { label: "AWS", bands: ["Cloud Practitioner", "Solutions Architect"] },
      { label: "Cisco CCNA" },
      { label: "ISTQB" },
      { label: "Google UX" },
      { label: "Bằng Đại học", bands: ["Khá", "Giỏi", "Xuất sắc"] },
    ],
  },
  {
    key: "experience",
    label: "Kinh nghiệm",
    hint: "Số năm và loại kinh nghiệm",
    tags: [
      { label: "Dưới 1 năm" }, { label: "1-2 năm" }, { label: "2-3 năm" }, { label: "3-5 năm" }, { label: "Trên 5 năm" },
      { label: "Kinh nghiệm dự án thực tế" }, { label: "Kinh nghiệm làm việc nhóm" }, { label: "Kinh nghiệm IoT" },
    ],
  },
  {
    key: "level",
    label: "Cấp bậc",
    hint: "Cấp bậc của vị trí",
    tags: [{ label: "Intern" }, { label: "Junior" }, { label: "Mid-level" }, { label: "Senior" }, { label: "Team Lead" }, { label: "Manager" }],
  },
  {
    key: "work_type",
    label: "Hình thức làm việc",
    hint: "Địa điểm và hình thức",
    tags: [{ label: "Tại văn phòng" }, { label: "Lai trộn (hybrid)" }, { label: "Làm từ xa" }, { label: "Toàn thời gian" }, { label: "Bán thời gian" }, { label: "Thực tập" }],
  },
  {
    key: "salary",
    label: "Mức lương",
    hint: "Khoảng lương mong muốn",
    tags: [{ label: "Thỏa thuận" }, { label: "8-12 triệu" }, { label: "12-18 triệu" }, { label: "18-25 triệu" }, { label: "25-35 triệu" }, { label: "Trên 35 triệu" }],
  },
];

export const emptyRubric = () =>
  RUBRIC_GROUPS.reduce((acc, g) => ({ ...acc, [g.key]: [] }), {});

export const requirementLabel = {
  required: "Bắt buộc",
  preferred: "Ưu tiên",
};

export function rubricWeightTotal(rubric) {
  return RUBRIC_GROUPS.reduce(
    (sum, g) => sum + (rubric?.[g.key] || []).reduce((s, i) => s + (Number(i.weight) || 0), 0),
    0
  );
}