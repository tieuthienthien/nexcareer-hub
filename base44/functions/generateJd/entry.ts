import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const GROUP_LABEL: Record<string, string> = {
  skills: 'Kỹ năng',
  certificates: 'Bằng cấp / Chứng chỉ',
  experience: 'Kinh nghiệm',
  level: 'Cấp bậc',
  work_type: 'Hình thức làm việc',
  salary: 'Mức lương'
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR / Line Manager được dùng công cụ này' }, { status: 403 });

    const body = await req.json();
    const rubric = body?.rubric || {};
    const title = String(body?.title || 'Vị trí tuyển dụng').slice(0, 160);
    const company = String(body?.company || 'Nexora Technology').slice(0, 160);
    const location = String(body?.location || '').slice(0, 120);

    const lines: string[] = [];
    for (const key of Object.keys(GROUP_LABEL)) {
      const items = Array.isArray(rubric[key]) ? rubric[key] : [];
      for (const item of items.slice(0, 40)) {
        const label = String(item?.label || '').slice(0, 80);
        if (!label) continue;
        const band = item?.band ? ` (${String(item.band).slice(0, 40)})` : '';
        const req_ = item?.requirement === 'preferred' ? 'Ưu tiên' : 'Bắt buộc';
        lines.push(`- [${GROUP_LABEL[key]}] ${label}${band} — ${req_}, trọng số ${Number(item?.weight) || 1}`);
      }
    }
    if (!lines.length) return Response.json({ error: 'Chưa có nhãn nào trong phần thô của JD' }, { status: 400 });

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Bạn là chuyên gia tuyển dụng của Nexora Technology. Viết JD (Job Description) tiếng Việt chuyên nghiệp, rõ ràng, dựa CHÍNH XÁC trên phần thô dưới đây. Không bịa thêm yêu cầu không có trong danh sách, không thêm số liệu lương ngoài phần thô.

Vị trí: ${title}
Công ty: ${company}${location ? `\nĐịa điểm: ${location}` : ''}

Phần thô (nhãn — mức độ — trọng số):
${lines.join('\n')}

Yêu cầu đầu ra:
- description: 1 đoạn mô tả công việc (3-5 câu) nêu vai trò, sản phẩm/dự án, môi trường làm việc.
- requirements: danh sách gạch đầu dòng (mỗi ý bắt đầu "- "), nhóm theo Kỹ năng / Bằng cấp - Chứng chỉ / Kinh nghiệm / Cấp bậc / Hình thức làm việc; nêu rõ nhãn nào Bắt buộc, nhãn nào Ưu tiên.
- benefits: danh sách gạch đầu dòng quyền lợi phổ biến của một công ty công nghệ (không bịa con số cụ thể).
Chỉ trả JSON hợp lệ.`,
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          requirements: { type: 'string' },
          benefits: { type: 'string' }
        }
      }
    });

    return Response.json({
      ok: true,
      description: llm?.description || '',
      requirements: llm?.requirements || '',
      benefits: llm?.benefits || '',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}