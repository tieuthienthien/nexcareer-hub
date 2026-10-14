import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Chuẩn hóa text tiếng Việt: thường hóa, bỏ dấu, lowercase, tách từ
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
  // Lọc stopwords cơ bản tiếng Việt + tiếng Anh
  const stop = new Set([
    "va", "hoac", "nhung", "cua", "cho", "trong", "tren", "voi", "la", "mot",
    "the", "va", "thi", "ma", "ay", "nay", "do", "gi", "j", "khong", "ko",
    "the", "and", "or", "the", "a", "an", "of", "to", "in", "on", "for", "is", "are"
  ]);
  return norm.split(" ").filter((w) => w.length > 1 && !stop.has(w));
}

// Điểm khớp giữa câu hỏi người dùng và 1 entry kiến thức
function scoreEntry(userNorm, userTokens, entry) {
  const qNorm = normalize(entry.question);
  const qTokens = tokenize(entry.question);
  if (!qTokens.length) return 0;

  // Trùng token
  const qSet = new Set(qTokens);
  let hit = 0;
  for (const t of userTokens) if (qSet.has(t)) hit++;
  const tokenScore = userTokens.length ? hit / Math.max(userTokens.length, 1) : 0;

  // Bonus nếu keywords xuất hiện
  let kwScore = 0;
  if (entry.keywords && entry.keywords.length) {
    const kwSet = new Set(entry.keywords.flatMap((k) => tokenize(k)));
    let kwHit = 0;
    for (const t of userTokens) if (kwSet.has(t)) kwHit++;
    kwScore = userTokens.length ? kwHit / Math.max(userTokens.length, 1) : 0;
  }

  // Câu hỏi người dùng chứa gần như trọn câu hỏi mẫu
  const containBonus = qNorm && qNorm.length > 8 && userNorm.includes(qNorm) ? 0.25 : 0;

  return tokenScore * 0.7 + kwScore * 0.3 + containBonus;
}

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = (body?.message || "").toString().trim();
    if (!message) return Response.json({ error: "Thiếu nội dung tin nhắn" }, { status: 400 });
    if (message.length > 500) return Response.json({ error: "Tin nhắn quá dài (tối đa 500 ký tự)" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const { items } = await base44.asServiceRole.entities.ChatbotKnowledge.filter(
      { active: true },
      { limit: 200, sort: "-created_date" }
    );

    const userNorm = normalize(message);
    const userTokens = tokenize(message);

    // 1) Tìm entry khớp nhất trong kho kiến thức (không tốn LLM)
    if (items && items.length && userTokens.length) {
      let best = null;
      let bestScore = 0;
      for (const k of items) {
        const s = scoreEntry(userNorm, userTokens, k);
        if (s > bestScore) { bestScore = s; best = k; }
      }
      // Ngưỡng đủ tốt → trả lời trực tiếp, không gọi LLM
      if (best && bestScore >= 0.55) {
        return Response.json({ answer: best.answer, matched: true, score: bestScore });
      }
    }

    // 2) Không khớp đủ → mới gọi LLM với context (dùng model rẻ để tiết kiệm token)
    let context = "";
    if (items && items.length) {
      context = items
        .map((k, i) => `Q${i + 1}: ${k.question}\nA: ${k.answer}`)
        .join("\n\n");
    }

    const systemPrompt =
      "Bạn là Starbuddy, trợ lý ảo dạng chú phi hành gia dễ thương của nền tảng tuyển dụng NexCareer Hub. " +
      "Trả lời ngắn gọn (tối đa 2-3 câu), thân thiện, dễ thương, bằng tiếng Việt. " +
      (context
        ? "Chỉ dựa vào kho kiến thức dưới đây. Nếu không có thông tin, nói bạn chưa được train cho vấn đề đó và gợi ý xem trang Liên hệ hoặc Việc làm.\n\n" +
          "KHO KIẾN THỨC:\n" + context
        : "Hiện chưa có kiến thức nào được train. Hãy nói bạn đang học hỏi và gợi ý người dùng liên hệ qua trang Liên hệ.");

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nCâu hỏi: ${message}`,
      model: "gpt_5_mini",
    });

    const answer = typeof llm === "string" ? llm : (llm?.answer || llm?.text || "Mình chưa hiểu lắm, bạn có thể hỏi lại không?");
    return Response.json({ answer, matched: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}