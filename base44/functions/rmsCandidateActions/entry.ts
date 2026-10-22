import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { appOrigin, renderEmail, buildManagerBrief } from "../../shared/rmsEmails.ts";

type ActionResult = {
  application_id: string;
  candidate: string;
  email_sent: boolean;
  manager_email_sent: boolean;
  warnings: string[];
};

function candidateCode(app: any): string {
  return app?.candidate_code || `NC-${String(app?.id || '').slice(-6).toUpperCase()}`;
}

function slotLabel(app: any): string {
  if (app?.interview_slot) return app.interview_slot;
  if (!app?.interview_at) return '';
  const d = new Date(app.interview_at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function findJobRole(base44: any, app: any) {
  try {
    const byJob = app?.job_id
      ? await base44.asServiceRole.entities.JobRole.filter({ job_id: app.job_id }, { limit: 1 })
      : { items: [] };
    if (byJob?.items?.length) return byJob.items[0];
    const title = String(app?.job_title || '').trim();
    if (!title) return null;
    const byTitle = await base44.asServiceRole.entities.JobRole.filter({ title }, { limit: 1 });
    return byTitle?.items?.[0] || null;
  } catch (e) {
    return null;
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được thực hiện thao tác này' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');
    const ids: string[] = Array.isArray(body?.application_ids)
      ? body.application_ids.slice(0, 20)
      : body?.application_id
        ? [body.application_id]
        : [];
    if (!ids.length) return Response.json({ error: 'Thiếu application_id' }, { status: 400 });

    const origin = appOrigin(req);
    const results: ActionResult[] = [];

    for (const id of ids) {
      const app = await base44.asServiceRole.entities.Application.get(id).catch(() => null);
      if (!app) continue;
      const withCode = { ...app, candidate_code: candidateCode(app), interview_slot: slotLabel(app) };
      const now = new Date().toISOString();
      const warnings: string[] = [];
      let emailSent = false;
      let managerEmailSent = false;

      if (action === 'approve_cv' || action === 'send_offer' || action === 'send_rejection') {
        const subject = String(body?.subject || '').trim();
        const bodyText = String(body?.body || '').trim();
        if (!subject || !bodyText) return Response.json({ error: 'Thiếu tiêu đề hoặc nội dung email' }, { status: 400 });

        const title = action === 'send_offer' ? 'Thư mời nhận việc' : action === 'send_rejection' ? 'Thư cảm ơn' : 'Thư mời phỏng vấn';
        const html = renderEmail(title, bodyText, withCode, origin);

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: app.email,
            subject,
            html
          });
          emailSent = true;
        } catch (e: any) {
          warnings.push(`Không gửi được email tới ${app.email}: ${e?.message || 'lỗi không xác định'}`);
        }

        if (action === 'approve_cv') {
          let managerEmail = app.assigned_manager_email || '';
          let department = app.department || '';
          let managerName = '';
          if (!managerEmail) {
            const role = await findJobRole(base44, app);
            if (role) {
              managerEmail = role.line_manager_email || '';
              department = department || role.department || '';
              managerName = role.manager_name || '';
            }
          }
          if (!managerEmail) {
            warnings.push('Chưa gán Line Manager cho vị trí này — hãy cấu hình ở mục “Vị trí & Line Manager”.');
          } else {
            const brief = buildManagerBrief({ ...withCode, department }, managerName || managerEmail, origin);
            try {
              await base44.asServiceRole.integrations.Core.SendEmail({ to: managerEmail, subject: brief.subject, html: brief.html });
              managerEmailSent = true;
            } catch (e: any) {
              warnings.push(`Không gửi được email cho Line Manager (${managerEmail}): ${e?.message || 'lỗi không xác định'}`);
            }
          }

          await base44.asServiceRole.entities.Application.update(id, {
            candidate_code: withCode.candidate_code,
            rms_status: 'pending_manager',
            step1_done: true,
            step1_at: app.step1_at || app.created_date || now,
            step2_done: true,
            step2_at: now,
            assigned_manager_email: managerEmail,
            department,
            confirmation_sent_at: app.confirmation_sent_at || now
          });
        } else if (action === 'send_offer') {
          await base44.asServiceRole.entities.Application.update(id, {
            candidate_code: withCode.candidate_code,
            rms_status: 'pass',
            step5_done: true,
            step5_at: app.step5_at || now,
            manager_decision: 'pass',
            final_result: 'hired',
            decision_at: app.decision_at || now
          });
        } else {
          await base44.asServiceRole.entities.Application.update(id, {
            candidate_code: withCode.candidate_code,
            rms_status: 'fail',
            step5_done: true,
            step5_at: app.step5_at || now,
            manager_decision: 'fail',
            final_result: 'rejected',
            decision_at: app.decision_at || now
          });
        }

        if (body?.notification_id) {
          await base44.asServiceRole.entities.Notification.update(body.notification_id, {
            is_read: true,
            action_done: true
          }).catch(() => null);
        }
      } else {
        return Response.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
      }

      results.push({
        application_id: id,
        candidate: app.full_name || '',
        email_sent: emailSent,
        manager_email_sent: managerEmailSent,
        warnings
      });
    }

    return Response.json({ ok: true, results });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}