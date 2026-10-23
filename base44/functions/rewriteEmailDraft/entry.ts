import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { AI_MODEL } from '../../shared/aiModel.ts';

const MODES: Record<string, string> = {
  formal: 'Viết trang trọng hơn, lịch sự và chỉn chu hơn nhưng vẫn ấm áp.',
  friendly: 'Viết thân thiện và gần gũi hơn, giữ mức độ chuyên nghiệp.',
  shorter: 'Viết ngắn gọn hơn, súc tích, giữ đủ ý chính.',
  longer: 'Viết dài và chi tiết hơn, bổ sung giải thích và hướng dẫn cụ thể.',
  personalize: 'Thêm 1-2 câu cá nhân hoá dựa trên dữ liệu hồ sơ được cung cấp (kỹ năng, kinh nghiệm, kết quả Job Simulation). Chỉ dùng dữ liệu có thật, không bịa số liệu.',
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được dùng trợ lý AI' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode || '').trim();
    const html = String(body?.html || '');
    const instruction = MODES[mode];
    if (!instruction) return Response.json({ error: 'Kiểu viết lại không hợp lệ' }, { status: 400 });
    if (!html.trim()) return Response.json({ error: 'Chưa có nội dung để viết lại' }, { status: 400 });

    const facts = body?.context && typeof body.context === 'object' ? JSON.stringify(body.context).slice(0, 4000) : '{}';

    const prompt = `Bạn là chuyên viên tuyển dụng của Nexora Technology, viết email tiếng Việt gửi ứng viên.

NHIỆM VỤ: ${instruction}

QUY TẮC BẮT BUỘC:
1. Giữ nguyên 100% các biến dạng {{ten_bien}} nếu có, không được dịch, đổi tên hay xoá.
2. Không được bịa thêm điểm số, mức lương, ngày giờ, địa điểm, tên người không có trong dữ liệu.
3. Giữ nguyên cấu trúc đoạn văn và danh sách; trả về HTML đơn giản chỉ với thẻ <p>, <strong>, <em>, <u>, <ul>, <ol>, <li>, <a>, <br>. Không thêm <html>, <body>, <style>, class hay thuộc tính style.
4. Không thêm lời chào kết thúc kiểu chữ ký (chữ ký do hệ thống chèn).
5. Chỉ trả về nội dung email, không giải thích.

DỮ LIỆU HỒ SƠ (chỉ dùng khi cần, không bịa thêm):
${facts}

NỘI DUNG HIỆN TẠI (HTML):
${html.slice(0, 12000)}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model: AI_MODEL });
    const cleaned = String(result || '')
      .replace(/^```(?:html)?/i, '')
      .replace(/```$/i, '')
      .trim();

    if (!cleaned) return Response.json({ error: 'AI chưa trả về nội dung, vui lòng thử lại' }, { status: 502 });
    return Response.json({ ok: true, html: cleaned });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Lỗi không xác định' }, { status: 500 });
  }
}