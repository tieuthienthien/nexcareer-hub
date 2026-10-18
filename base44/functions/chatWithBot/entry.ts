import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============ Tiện ích chuẩn hoá text ============
function normalize(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const norm = normalize(text);
  if (!norm) return [];
  const stop = new Set([
    "va", "hoac", "nhung", "cua", "cho", "trong", "tren", "voi", "la", "mot",
    "the", "thi", "ma", "ay", "nay", "do", "gi", "j", "khong", "ko",
    "and", "or", "a", "an", "of", "to", "in", "on", "for", "is", "are", "my", "i"
  ]);
  return norm.split(" ").filter((w) => w.length > 1 && !stop.has(w));
}

// ============ Layer 1+2: khớp FAQ từ kho kiến thức ============
function scoreEntry(userNorm, userTokens, entry) {
  const qNorm = normalize(entry.question);
  const qTokens = tokenize(entry.question);
  if (!qTokens.length) return 0;

  const qSet = new Set(qTokens);
  let hit = 0;
  for (const t of userTokens) if (qSet.has(t)) hit++;
  const tokenScore = userTokens.length ? hit / Math.max(userTokens.length, 1) : 0;

  let kwScore = 0;
  if (entry.keywords && entry.keywords.length) {
    const kwSet = new Set(entry.keywords.flatMap((k) => tokenize(k)));
    let kwHit = 0;
    for (const t of userTokens) if (kwSet.has(t)) kwHit++;
    kwScore = userTokens.length ? kwHit / Math.max(userTokens.length, 1) : 0;
  }

  let varScore = 0;
  if (entry.variants && entry.variants.length) {
    const varSet = new Set(entry.variants.flatMap((v) => tokenize(v)));
    let vHit = 0;
    for (const t of userTokens) if (varSet.has(t)) vHit++;
    varScore = userTokens.length ? vHit / Math.max(userTokens.length, 1) : 0;
  }

  const containBonus = qNorm && qNorm.length > 8 && userNorm.includes(qNorm) ? 0.25 : 0;
  return tokenScore * 0.6 + kwScore * 0.25 + varScore * 0.15 + containBonus;
}

// ============ Layer 3: định tuyến intent xác định ============
const GUIDANCE_MARKERS = ["lam sao", "cach", "lam the nao", "lam gi de", "huong dan", "how to", "how do", "how can", "neu muon", "de qua", "de vao", "de pass", "de vuot"];
const STATUS_POSSESSIVE = ["cua toi", "cua minh", "ho so cua", "cua ban", "cua tui", "my application", "my cv", "my status", "ho so cua minh"];
const STATUS_SIGNALS = ["trang thai", "vong may", "vong may roi", "da qua chua", "qua chua", "ket qua", "tien trinh", "den dau", "dang o dau", "dang o", "stage", "status", "kq", "ket qua ung tuyen", "xem ho so", "ho so dang", "da nop chua"];

function isGuidanceQuery(norm) {
  return GUIDANCE_MARKERS.some((m) => norm.includes(m));
}
function isStatusQuery(norm) {
  if (isGuidanceQuery(norm)) return false;
  const hasPossessive = STATUS_POSSESSIVE.some((p) => norm.includes(p));
  const hasSignal = STATUS_SIGNALS.some((s) => norm.includes(s));
  return hasPossessive || (hasSignal && /toi|minh|cua minh|cua toi|my/.test(norm));
}

// Mô tả trạng thái ứng viên thân thiện
function statusLabel(st) {
  const m = {
    cv_screening: "Đang sàng lọc CV (Vòng 1)",
    cv_passed: "Đã qua sàng lọc CV",
    cv_rejected: "Chưa qua Vòng 1 — sàng lọc CV",
    test_invited: "Đã được mời làm bài thi Vòng 2",
    test_submitted: "Đã nộp bài thi Vòng 2, đang chờ chấm",
    test_passed: "Đã qua Vòng 2, chờ mời phỏng vấn",
    test_rejected: "Chưa qua Vòng 2",
    interview_invited: "Đã được mời phỏng vấn AI (Vòng 3)",
    interview_submitted: "Đã hoàn thành phỏng vấn, đang chờ đánh giá",
    hired: "Chúc mừng! Bạn đã trúng tuyển 🎉",
    rejected: "Chưa trúng tuyển lần này",
  };
  return m[st] || st;
}
function nextStep(st) {
  const m = {
    cv_screening: "HR đang xem CV, bạn vui lòng chờ kết quả Vòng 1 nhé.",
    cv_passed: "Hãy đợi thư mời Vòng 2 qua email và mục Hồ sơ ứng tuyển.",
    test_invited: "Mở mục Hồ sơ ứng tuyển để làm bài thi Vòng 2 trong thời hạn.",
    test_submitted: "Đang chờ AI + HR chấm bài, kết quả sẽ cập nhật trong Hồ sơ ứng tuyển.",
    test_passed: "Hãy đợi thư mời phỏng vấn Vòng 3.",
    interview_invited: "Mở mục Hồ sơ ứng tuyển để làm phỏng vấn AI Vòng 3.",
    interview_submitted: "Đang chờ hội đồng đánh giá, kết quả sẽ sớm có.",
    hired: "HR sẽ liên hệ hướng dẫn nhận việc.",
    cv_rejected: "Bạn có thể ứng tuyển vị trí khác phù hợp hơn ở mục Việc làm.",
    test_rejected: "Bạn có thể xem gợi ý cải thiện ở mục Hồ sơ ứng tuyển và thử vị trí khác.",
    rejected: "Cảm ơn bạn đã ứng tuyển, mong gặp lại ở cơ hội sau.",
  };
  return m[st] || "";
}

// ============ Layer 4: truy vấn DB theo người dùng đã đăng nhập ============
async function answerStatusQuery(base44) {
  let user = null;
  try { user = await base44.auth.me(); } catch {}
  if (!user) {
    return { answer: "Để mình xem trạng thái hồ sơ của bạn, bạn cần đăng nhập vào NexCareer Hub trước nhé — nút đăng nhập nằm ở góc trên bên phải.", source: "db", matched_intent: "auth.required" };
  }
  let apps: any[] = [];
  try {
    const res = await base44.entities.Application.filter({ created_by_id: user.id }, { sort: "-created_date", limit: 5 });
    apps = res.items || [];
  } catch {}
  if (!apps.length) {
    return { answer: "Mình chưa thấy hồ sơ ứng tuyển nào của bạn trên hệ thống. Bạn có thể xem việc làm và ứng tuyển tại mục Việc làm.", source: "db", matched_intent: "status.none" };
  }
  if (apps.length === 1) {
    const a = apps[0];
    return { answer: `Hồ sơ của bạn cho vị trí "${a.job_title}"${a.company ? " — " + a.company : ""} đang ở trạng thái: ${statusLabel(a.status)}. ${nextStep(a.status)}`, source: "db", matched_intent: "status.single" };
  }
  const lines = apps.map((a) => `• ${a.job_title}${a.company ? " (" + a.company + ")" : ""}: ${statusLabel(a.status)}`);
  return { answer: `Bạn đang có ${apps.length} hồ sơ ứng tuyển:\n${lines.join("\n")}\n\nChi tiết xem trong mục Hồ sơ ứng tuyển.`, source: "db", matched_intent: "status.multi" };
}

// ============ Ghi log ============
async function logChat(base44, message, source, matchedIntent) {
  try {
    await base44.asServiceRole.entities.ChatbotLog.create({
      message: message.slice(0, 500),
      normalized: normalize(message).slice(0, 200),
      source,
      matched_intent: matchedIntent || null,
    });
  } catch {}
}

// ============ Layer 5: AI trả lời (dùng khi không khớp kho kiến thức) ============
const BOT_CONTEXT = `Bạn là Starbuddy — trợ lý ảo của NexCareer Hub, cổng tuyển dụng của Nexora Technology (công ty phần mềm tại TP. Hồ Chí Minh).
Quy trình tuyển dụng gồm 3 vòng: (1) Sàng lọc CV bằng AI, (2) Bài thi kỹ thuật hoặc tình huống giới hạn thời gian, (3) Phỏng vấn video do AI đặt câu hỏi và hội đồng đánh giá.
Ứng viên dùng Candidate Room (/candidate-room) để quản lý hồ sơ, CV và theo dõi tiến trình 3 vòng; tìm việc tại /viec-lam. Nhà tuyển dụng dùng HR Studio (/hr-studio). Trang hỗ trợ: /ho-tro, liên hệ: /lien-he.
Quy tắc trả lời: tiếng Việt, thân thiện, ngắn gọn (tối đa 120 từ), chỉ dựa trên thông tin trên. Khi nhắc tới một trang, dùng tên tiếng Việt (Trang chủ, Việc làm, Candidate Room, Trung tâm hỗ trợ, Liên hệ, HR Studio), không in đường dẫn kỹ thuật. Không bịa thông tin về lương, thời hạn hay trạng thái hồ sơ cá nhân — với các câu hỏi đó hãy hướng dẫn người dùng mở Trung tâm hỗ trợ hoặc liên hệ HR.`;

function buildAiPrompt(message) {
  return `${BOT_CONTEXT}

Câu hỏi của người dùng: "${message}"

Hãy trả lời trực tiếp, không lặp lại câu hỏi, không dùng tiêu đề hay markdown phức tạp.`;
}

// ============ Entry point ============
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = (body?.message || "").toString().trim();
    if (!message) return Response.json({ error: "Thiếu nội dung tin nhắn" }, { status: 400 });
    if (message.length > 500) return Response.json({ error: "Tin nhắn quá dài (tối đa 500 ký tự)" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const userNorm = normalize(message);
    const userTokens = tokenize(message);

    // Tải kho kiến thức (chỉ những mục đang bật)
    const { items } = await base44.asServiceRole.entities.ChatbotKnowledge.filter(
      { active: true },
      { limit: 500, sort: "-created_date" }
    );

    // --- Layer 4: câu hỏi trạng thái cá nhân — ưu tiên truy vấn DB thật ---
    if (isStatusQuery(userNorm)) {
      const out = await answerStatusQuery(base44);
      return Response.json({ answer: out.answer, matched: true, source: out.source });
    }

    // --- Layer 1+2: khớp FAQ ---
    if (items && items.length && userTokens.length) {
      let best = null;
      let bestScore = 0;
      for (const k of items) {
        const s = scoreEntry(userNorm, userTokens, k);
        if (s > bestScore) { bestScore = s; best = k; }
      }
      if (best && bestScore >= 0.55) {
        return Response.json({ answer: best.answer, matched: true, source: "faq", intent: best.intent_id });
      }
    }

    // --- Layer 5: AI trả lời cho câu hỏi ngoài kho kiến thức ---
    try {
      const aiRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildAiPrompt(message),
      });
      const aiAnswer = (typeof aiRes === "string" ? aiRes : aiRes?.answer || aiRes?.text || "").trim();
      if (aiAnswer) {
        await logChat(base44, message, "ai", "ai.fallback");
        return Response.json({ answer: aiAnswer, matched: true, source: "ai" });
      }
    } catch {}

    // --- Layer 6: trả lời an toàn khi AI không phản hồi ---
    const answer = "Mình chưa có câu trả lời sẵn cho câu hỏi này. Bạn có thể thử câu hỏi mẫu bên dưới, xem trang Trung tâm hỗ trợ / Câu hỏi thường gặp, hoặc liên hệ HR qua trang Liên hệ để được hỗ trợ nhé.";

    await logChat(base44, message, "escalation", "escalation.safe");

    return Response.json({ answer, matched: false, source: "escalation" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}