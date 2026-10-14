import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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

    let context = "";
    if (items && items.length) {
      context = items
        .map((k, i) => {
          const kw = k.keywords && k.keywords.length ? `\n  (từ khóa: ${k.keywords.join(", ")})` : "";
          return `Q${i + 1}: ${k.question}\n  A: ${k.answer}${kw}`;
        })
        .join("\n\n");
    }

    const systemPrompt =
      "Bạn là Starbuddy, trợ lý ảo dạng chú phi hành gia dễ thương của nền tảng tuyển dụng NexCareer Hub. " +
      "Trả lời ngắn gọn, thân thiện, dễ thương, bằng tiếng Việt. " +
      (context
        ? "Chỉ dựa vào kho kiến thức dưới đây để trả lời câu hỏi của người dùng. " +
          "Nếu câu hỏi không có trong kho kiến thức, hãy nói bạn chưa được train cho vấn đề đó và gợi ý người dùng xem trang Liên hệ hoặc trang Việc làm.\n\n" +
          "KHO KIẾN THỨC:\n" + context
        : "Hiện chưa có kiến thức nào được train. Hãy nói bạn đang học hỏi và gợi ý người dùng liên hệ qua trang Liên hệ.");

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nCâu hỏi của người dùng: ${message}`,
    });

    const answer = typeof llm === "string" ? llm : (llm?.answer || llm?.text || "Mình chưa hiểu lắm, bạn có thể hỏi lại không?");
    return Response.json({ answer });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}