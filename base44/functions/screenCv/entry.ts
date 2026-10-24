import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { appOrigin } from "../../shared/stageEmails.ts";
import { sendStageMail } from "../../shared/mailer.ts";
import { flattenRubric, readCv, gradeCv } from "../../shared/cvGrading.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applicationId = body?.application_id;
    if (!applicationId) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    if (app.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const job = app.job_id ? await base44.asServiceRole.entities.Job.get(app.job_id).catch(() => null) : null;
    const rubric = flattenRubric(job);

    const { cvText, cvMeta } = await readCv(base44, app);

    // 2) Chứng chỉ do Nexora cấp (mục Khóa học) được tính là chứng chỉ hợp lệ
    let nexoraCerts: string[] = [];
    if (app.created_by_id && !String(app.created_by_id).startsWith('service_')) {
      try {
        const { items } = await base44.asServiceRole.entities.Certificate.filter({ user_id: app.created_by_id }, { limit: 20 });
        nexoraCerts = (items || []).map((c: any) => `${c.course_title} (mã ${c.code}, ${c.score}/100)`);
      } catch (e) {}
    }

    // 3) Gửi email xác nhận đã nhận hồ sơ (chỉ 1 lần) — trả về trạng thái để giao diện báo lỗi nếu không gửi được
    let emailSent = false;
    let emailError = '';
    if (!app.confirmation_sent_at) {
      const mail = await sendStageMail(base44, app, 'application_confirmed', { origin: appOrigin(req) });
      emailSent = mail.sent;
      emailError = mail.error;
      if (mail.sent) {
        await base44.asServiceRole.entities.Application.update(applicationId, { confirmation_sent_at: new Date().toISOString() }).catch(() => null);
      }
    }

    if (!rubric.length || !cvText) {
      return Response.json({
        ok: true,
        match_score: null,
        email_sent: emailSent,
        email_error: emailError || undefined,
        message: 'Chưa đủ dữ liệu để chấm điểm (thiếu barem hoặc nội dung CV).'
      });
    }

    // 4) AI đối chiếu từng nhãn của barem với CV
    const grade = await gradeCv(base44, { app, job, rubric, cvText, cvMeta, nexoraCerts });
    const { score, advice, compared, requiredMissing, metaFields } = grade;

    const updated = await base44.asServiceRole.entities.Application.update(applicationId, {
      ...metaFields,
      cv_match_score: score,
      cv_ai_analysis: grade.analysis,
      cv_strengths: grade.strengths,
      cv_gaps: grade.gaps,
      cv_quality_signals: grade.quality_signals,
      cv_advice: advice,
      cv_rubric: compared,
      cv_required_missing: requiredMissing,
      cv_certificates: nexoraCerts
    });

    return Response.json({
      ok: true,
      match_score: score,
      email_sent: emailSent,
      email_error: emailError || undefined,
      advice,
      analysis: grade.analysis,
      matched: compared.filter((c) => c.matched).map((c) => c.label),
      missing: compared.filter((c) => !c.matched).map((c) => c.label),
      required_missing: requiredMissing,
      certificates: nexoraCerts,
      application: updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}