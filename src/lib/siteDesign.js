// Cấu hình Design Studio: bộ màu mặc định, bộ mẫu, danh sách nội dung chỉnh được và hàm dựng CSS.

const FONT_STACK = {
  "be-vietnam": "'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif",
  quicksand: "'Quicksand', ui-sans-serif, system-ui, sans-serif",
  system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

export const FONT_OPTIONS = [
  { key: "be-vietnam", label: "Be Vietnam Pro" },
  { key: "quicksand", label: "Quicksand (tròn, mềm)" },
  { key: "system", label: "Hệ thống (nhanh nhất)" },
  { key: "serif", label: "Serif (Georgia)" },
];

export const DEFAULT_THEME = {
  background: "#fbf6fd",
  foreground: "#26163b",
  primary: "#8b51d6",
  accent: "#de7396",
  radius: 0.75,
  font_heading: "be-vietnam",
  font_body: "be-vietnam",
};

export const DEFAULT_BACKGROUND = {
  mode: "galaxy",
  color_from: "#e9d5ff",
  color_to: "#ffe4f0",
  image_url: "",
};

export const DEFAULT_DESIGN = {
  theme: DEFAULT_THEME,
  background: DEFAULT_BACKGROUND,
  content: {},
  preset: "galaxy",
};

export const PRESETS = [
  {
    key: "galaxy",
    label: "Galaxy Pastel",
    theme: { ...DEFAULT_THEME },
    background: { mode: "galaxy", color_from: "#e9d5ff", color_to: "#ffe4f0", image_url: "" },
  },
  {
    key: "ocean",
    label: "Xanh biển",
    theme: { ...DEFAULT_THEME, background: "#f4f9ff", foreground: "#0f172a", primary: "#2563eb", accent: "#06b6d4" },
    background: { mode: "gradient", color_from: "#dbeafe", color_to: "#ecfeff", image_url: "" },
  },
  {
    key: "coral",
    label: "Hồng san hô",
    theme: { ...DEFAULT_THEME, background: "#fff6f3", foreground: "#2a1518", primary: "#d94a5a", accent: "#f59e0b" },
    background: { mode: "gradient", color_from: "#ffe4e6", color_to: "#fff7ed", image_url: "" },
  },
  {
    key: "minimal",
    label: "Tối giản",
    theme: { ...DEFAULT_THEME, background: "#ffffff", foreground: "#111827", primary: "#111827", accent: "#6b7280" },
    background: { mode: "solid", color_from: "#ffffff", color_to: "#ffffff", image_url: "" },
  },
];

// Nội dung chỉnh được theo từng trang. default = câu chữ gốc trong code.
export const CONTENT_PAGES = [
  {
    key: "home",
    label: "Trang chủ",
    groups: [
      {
        title: "Khối mở đầu (Hero)",
        fields: [
          { key: "hero_badge", label: "Nhãn nhỏ phía trên tiêu đề", default: "Cổng tuyển dụng của Nexora Technology" },
          { key: "hero_title", label: "Tiêu đề lớn", multiline: true, default: "Gia nhập Nexora Technology cùng NexCareer Hub" },
          { key: "hero_subtitle", label: "Mô tả ngắn", multiline: true, default: "Các vị trí đang mở tại Nexora Technology - công ty phần mềm tại TP. Hồ Chí Minh. Ứng tuyển dễ, theo dõi hồ sơ minh bạch qua 3 vòng đánh giá." },
          { key: "search_placeholder", label: "Gợi ý trong ô tìm kiếm", default: "Vị trí, từ khóa..." },
          { key: "search_cta", label: "Chữ trên nút tìm kiếm", default: "Tìm việc" },
        ],
      },
      {
        title: "Hai cổng truy cập",
        fields: [
          { key: "candidate_title", label: "Tên cổng ứng viên", default: "Candidate Room" },
          { key: "candidate_desc", label: "Mô tả cổng ứng viên", multiline: true, default: "Quản lý hồ sơ cá nhân, tải lên CV & portfolio, theo dõi tình trạng ứng tuyển mọi lúc, mọi nơi." },
          { key: "candidate_cta", label: "Nút cổng ứng viên", default: "Khám phá ngay" },
          { key: "hr_title", label: "Tên cổng HR", default: "HR Studio" },
          { key: "hr_desc", label: "Mô tả cổng HR", multiline: true, default: "Dành cho bộ phận Nhân sự Nexora: đăng vị trí, sàng lọc và theo dõi ứng viên trong một studio." },
          { key: "hr_cta", label: "Nút cổng HR", default: "Khám phá ngay" },
        ],
      },
      {
        title: "Việc làm nổi bật",
        fields: [
          { key: "jobs_title", label: "Tiêu đề mục", default: "Việc làm nổi bật" },
          { key: "jobs_subtitle", label: "Mô tả mục", default: "Các vị trí đang tuyển tại Nexora Technology" },
        ],
      },
      {
        title: "Phòng ban",
        fields: [
          { key: "categories_title", label: "Tiêu đề mục", default: "Khám phá theo phòng ban" },
          { key: "categories_subtitle", label: "Mô tả mục", default: "Các phòng ban đang tuyển tại Nexora" },
        ],
      },
      {
        title: "Giới thiệu Nexora",
        fields: [
          { key: "about_badge", label: "Nhãn nhỏ", default: "Về Nexora Technology" },
          { key: "about_title", label: "Tiêu đề", multiline: true, default: "Công ty phần mềm sinh năm 2025, tại Sài Gòn" },
          { key: "about_desc", label: "Đoạn 1", multiline: true, default: "Nexora Technology là đối tác phát triển phần mềm theo yêu cầu - từ web, mobile đến IoT và chuyển đổi hệ thống cũ. Chúng tôi là đội ngũ kỹ sư, thiết kế và quản lý sản phẩm cùng chung triết lý: làm ít hơn, làm tốt hơn." },
          { key: "about_desc2", label: "Đoạn 2", multiline: true, default: "NexCareer Hub là cổng tuyển dụng nội bộ của Nexora - Candidate Room cho ứng viên và HR Studio cho bộ phận Nhân sự, giúp Nexora tìm đúng người, đúng việc." },
        ],
      },
      {
        title: "Khối kêu gọi cuối trang",
        fields: [
          { key: "cta_title", label: "Tiêu đề", default: "Sẵn sàng bước tiếp theo?" },
          { key: "cta_subtitle", label: "Mô tả", multiline: true, default: "Ứng tuyển vào Nexora Technology hôm nay - minh bạch, nhanh chóng." },
        ],
      },
    ],
  },
  {
    key: "jobs",
    label: "Trang việc làm",
    groups: [
      {
        title: "Đầu trang",
        fields: [
          { key: "title", label: "Tiêu đề", default: "Tìm việc làm" },
          { key: "subtitle", label: "Mô tả", multiline: true, default: "Các vị trí đang tuyển tại Nexora Technology" },
          { key: "search_placeholder", label: "Gợi ý trong ô tìm kiếm", default: "Vị trí, từ khóa..." },
        ],
      },
    ],
  },
  {
    key: "courses",
    label: "Trang khóa học",
    groups: [
      {
        title: "Đầu trang",
        fields: [
          { key: "badge", label: "Nhãn nhỏ", default: "Học nghề cùng Nexora Technology" },
          { key: "title", label: "Tiêu đề", default: "Khóa học" },
          { key: "subtitle", label: "Mô tả", multiline: true, default: "Lộ trình học theo ngành nghề, có bài giảng, video case thực tế và bài kiểm tra chấm bằng AI. Hoàn thành từ 80/100 để nhận chứng chỉ." },
        ],
      },
    ],
  },
];

export function contentFor(design, page) {
  const def = CONTENT_PAGES.find((p) => p.key === page);
  const values = design?.content?.[page] || {};
  const out = {};
  (def?.groups || []).forEach((g) => {
    g.fields.forEach((f) => {
      out[f.key] = values[f.key] ?? f.default;
    });
  });
  return out;
}

function parseHex(input) {
  const hex = String(input || "").trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return { h: 266, s: 62, l: 58 };
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hexToHsl(hex) {
  const { h, s, l } = parseHex(hex);
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

export function lightnessOf(hex) {
  return parseHex(hex).l;
}

function shiftLightness(hex, delta) {
  const { h, s, l } = parseHex(hex);
  const next = Math.max(0, Math.min(100, l + delta));
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(next)}%`;
}

// CSS ghi đè token màu/font của toàn app + kiểu nền trang.
export function buildCss(design) {
  const t = { ...DEFAULT_THEME, ...(design?.theme || {}) };
  const b = { ...DEFAULT_BACKGROUND, ...(design?.background || {}) };

  const bg = hexToHsl(t.background);
  const bgLight = lightnessOf(t.background);
  const light = bgLight > 55;
  const fg = hexToHsl(t.foreground);
  const fgHue = Math.round(parseHex(t.foreground).h);
  const primary = hexToHsl(t.primary);
  const accent = hexToHsl(t.accent);
  const onPrimary = lightnessOf(t.primary) > 62 ? "0 0% 11%" : "0 0% 100%";
  const onAccent = lightnessOf(t.accent) > 62 ? "0 0% 11%" : "0 0% 100%";
  const card = shiftLightness(t.background, light ? 2 : 6);
  const muted = shiftLightness(t.background, light ? -5 : 6);
  const border = shiftLightness(t.background, light ? -12 : 15);
  const mutedText = light ? `${fgHue} 12% 42%` : `${fgHue} 10% 68%`;
  const heading = FONT_STACK[t.font_heading] || FONT_STACK["be-vietnam"];
  const body = FONT_STACK[t.font_body] || FONT_STACK["be-vietnam"];
  const radius = Number.isFinite(Number(t.radius)) ? Number(t.radius) : 0.75;

  const css = [
    ":root, .galaxy {",
    `--background: ${bg}; --foreground: ${fg};`,
    `--card: ${card}; --card-foreground: ${fg}; --popover: ${card}; --popover-foreground: ${fg};`,
    `--primary: ${primary}; --primary-foreground: ${onPrimary}; --ring: ${primary};`,
    `--accent: ${accent}; --accent-foreground: ${onAccent};`,
    `--secondary: ${muted}; --secondary-foreground: ${fg};`,
    `--muted: ${muted}; --muted-foreground: ${mutedText};`,
    `--border: ${border}; --input: ${border};`,
    `--sidebar-primary: ${primary}; --sidebar-ring: ${primary};`,
    `--radius: ${radius}rem;`,
    `--font-heading: ${heading}; --font-body: ${body}; --font-display: ${heading};`,
    "}",
    `.text-galaxy { background-image: linear-gradient(100deg, hsl(${primary}), hsl(${accent}) 55%, hsl(${primary})) !important; -webkit-background-clip: text !important; background-clip: text !important; color: transparent !important; }`,
    `.btn-galaxy { background-image: linear-gradient(100deg, hsl(${primary}), hsl(${accent}), hsl(${primary})) !important; border-color: hsl(${primary} / 0.35) !important; box-shadow: 0 0 22px hsl(${primary} / 0.35), 0 8px 26px -10px hsl(${accent} / 0.5) !important; }`,
  ];

  if (b.mode === "solid") {
    css.push(`.galaxy-bg { background-image: none !important; background-color: hsl(${bg}) !important; }`);
  } else if (b.mode === "gradient") {
    css.push(
      `.galaxy-bg { background-image: linear-gradient(150deg, ${b.color_from || t.background}, ${b.color_to || t.background}) !important; background-size: cover !important; background-attachment: fixed !important; }`
    );
  } else if (b.mode === "image" && b.image_url) {
    css.push(
      `.galaxy-bg { background-image: linear-gradient(hsl(${bg} / 0.82), hsl(${bg} / 0.88)), url("${b.image_url}") !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; }`
    );
  }

  return css.join("\n");
}

// Style inline cho khung xem trước (không phụ thuộc biến CSS toàn cục).
export function previewStyles(theme, background) {
  const t = { ...DEFAULT_THEME, ...(theme || {}) };
  const b = { ...DEFAULT_BACKGROUND, ...(background || {}) };
  const bgLight = lightnessOf(t.background) > 55;
  let pageBackground = t.background;
  if (b.mode === "gradient") pageBackground = `linear-gradient(150deg, ${b.color_from}, ${b.color_to})`;
  if (b.mode === "image" && b.image_url) pageBackground = `linear-gradient(${t.background}dd, ${t.background}ee), url("${b.image_url}") center/cover`;
  return {
    page: {
      background: pageBackground,
      color: t.foreground,
      borderRadius: `${Number(t.radius) * 1.4}rem`,
      fontFamily: FONT_STACK[t.font_body],
    },
    card: {
      background: bgLight ? "#ffffff" : `color-mix(in srgb, ${t.background} 88%, ${t.foreground})`,
      borderRadius: `${Number(t.radius)}rem`,
      border: `1px solid ${t.primary}22`,
    },
    button: {
      background: `linear-gradient(100deg, ${t.primary}, ${t.accent})`,
      color: lightnessOf(t.primary) > 62 ? "#111827" : "#ffffff",
      borderRadius: `${Number(t.radius)}rem`,
      fontFamily: FONT_STACK[t.font_heading],
    },
    heading: { fontFamily: FONT_STACK[t.font_heading], color: t.foreground },
  };
}