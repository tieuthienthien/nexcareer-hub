import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim().toUpperCase();
    if (code.length < 6) return Response.json({ valid: false, error: 'Mã chứng chỉ không hợp lệ.' });

    const base44 = createClientFromRequest(req);
    const result = await base44.asServiceRole.entities.Certificate.filter({ code }, { limit: 1 });
    const certificate = result?.items?.[0];
    if (!certificate) return Response.json({ valid: false });

    return Response.json({
      valid: true,
      certificate: {
        code: certificate.code,
        user_name: certificate.user_name,
        course_title: certificate.course_title,
        score: certificate.score,
        issued_at: certificate.issued_at
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}