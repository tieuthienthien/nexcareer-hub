import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureCandidateUser, normalizeEmail } from '../../shared/candidateAccount.ts';

const ALLOWED_STATUS = ['cv_passed', 'test_invited', 'test_submitted', 'test_rejected'];

function token() {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '').slice(0, 40);
}

function origin(req: Request) {
  return (req.headers.get('origin') || req.headers.get('x-base44-app-url') || 'https://nexcareerhubbyxme.base44.app').replace(/\/$/, '');
}

function mailHtml(app: any, sim: any, link: string, deadlineText: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#fbf7fd;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#564be7;color:#ffffff;padding:20px 28px;font-size:16px;font-weight:700">NexCareer Hub · Vòng 2 Job Simulation</div>
    <div style="padding:28px;color:#26163c;font-size:15px;line-height:1.6">
      <p>Chào ${app.full_name || 'bạn'},</p>
      <p>Hồ sơ của bạn cho vị trí <strong>${app.job_title || ''}</strong> đã vượt qua Vòng 1 (duyệt CV). Nexora Technology mời bạn làm bài <strong>Job Simulation</strong> — bài mô phỏng công việc thực tế, gồm 4 nhiệm vụ trong ${sim.duration_min || 60} phút.</p>
      <p><strong>Hạn hoàn thành:</strong> ${deadlineText}</p>
      <p style="margin:26px 0"><a href="${link}" style="background:#564be7;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:12px;font-weight:700">Bắt đầu làm bài</a></p>
      <p style="font-size:13px;color:#8b51d6">Link làm bài chỉ dùng được một lần cho hồ sơ này và sẽ khoá sau khi bạn nộp bài hoặc hết hạn.</p>
      <p style="font-size:13px;color:#8b51d6">Nếu nút không mở được, dán link này vào trình duyệt:<br>${link}</p>
    </div>
  </div>
</div>`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được gửi Job Simulation' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const applicationId = String(body?.application_id || '').trim();
    if (!applicationId) return Response.json({ error: 'Thiếu hồ sơ ứng viên' }, { status: 400 });

    const app = await base44.asServiceRole.entities.Application.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    const stage = app.rms_status || '';
    const canInvite = ALLOWED_STATUS.includes(app.status) || ['cv_approved', 'pending_manager', 'interviewed', 'pass'].includes(stage);
    if (!canInvite) {
      return Response.json({ error: 'Chỉ gửi Job Simulation sau khi HR duyệt CV (Vòng 1)' }, { status: 400 });
    }

    let sim: any = null;
    const requestedId = String(body?.simulation_id || '').trim();
    if (requestedId) sim = await base44.asServiceRole.entities.JobSimulation.get(requestedId).catch(() => null);
    if (!sim) {
      const list = await base44.asServiceRole.entities.JobSimulation.filter({ status: 'active' }, { sort: '-created_date', limit: 50 });
      const items = list.items || [];
      sim = items.find((s: any) => s.job_id && s.job_id === app.job_id) || items[0] || null;
    }
    if (!sim) return Response.json({ error: 'Chưa có Job Simulation đang dùng. Hãy tạo ở mục Job Simulation.' }, { status: 400 });

    const days = Math.min(14, Math.max(1, Number(body?.expires_days) || 3));
    const existing = await base44.asServiceRole.entities.SimulationInvite.filter(
      { application_id: applicationId, status: { $in: ['sent', 'started'] } },
      { sort: '-created_date', limit: 1 }
    );
    let invite = (existing.items || [])[0] || null;
    const stillValid = invite && (!invite.expires_at || new Date(invite.expires_at).getTime() > Date.now());

    if (!stillValid) {
      const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      invite = await base44.asServiceRole.entities.SimulationInvite.create({
        token: token(),
        simulation_id: sim.id,
        simulation_name: sim.name,
        application_id: applicationId,
        job_id: app.job_id || '',
        job_title: app.job_title || '',
        candidate_email: normalizeEmail(app.email),
        candidate_name: app.full_name || '',
        expires_at: expiresAt,
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    }

    if (app.status !== 'test_submitted') {
      await base44.asServiceRole.entities.Application.update(applicationId, { status: 'test_invited' });
    }

    const link = `${origin(req)}/job-simulation/${invite.token}`;
    const deadlineText = new Date(invite.expires_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

    // HR soạn email mời trong trình soạn email → chỉ tạo lời mời, không gửi mail tự động.
    if (body?.skip_email === true) {
      return Response.json({
        ok: true,
        invite: { id: invite.id, token: invite.token, expires_at: invite.expires_at, status: invite.status, simulation_name: invite.simulation_name },
        link,
        duration_min: sim.duration_min || 60,
        email_sent: false
      });
    }

    let emailSent = false;
    let emailError = '';
    const ensured = await ensureCandidateUser(base44, app.email);
    if (!ensured.registered) {
      emailError = ensured.error || 'Ứng viên chưa có tài khoản trong app nên hệ thống chưa gửi được email.';
    } else {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: normalizeEmail(app.email),
          subject: `Mời làm Job Simulation (Vòng 2) — ${app.job_title || sim.name}`,
          html: mailHtml(app, sim, link, deadlineText)
        });
        emailSent = true;
      } catch (e: any) {
        emailError = e?.message || 'Không gửi được email cho ứng viên';
      }
    }

    return Response.json({
      ok: true,
      invite: { id: invite.id, token: invite.token, expires_at: invite.expires_at, status: invite.status, simulation_name: invite.simulation_name },
      link,
      email_sent: emailSent,
      email_error: emailError || undefined
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}