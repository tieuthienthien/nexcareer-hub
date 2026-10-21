import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildEmail, appOrigin } from "../../shared/stageEmails.ts";

const TZ_OFFSET = '+07:00';
const HOUR = 3600 * 1000;

function slotStart(booking: any): number {
  return new Date(`${booking.date}T${String(booking.start_time || '09:00').slice(0, 5)}:00${TZ_OFFSET}`).getTime();
}

function slotLabel(booking: any): string {
  try {
    return new Date(slotStart(booking)).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch {
    return `${booking.date} ${booking.start_time}`;
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const origin = appOrigin(req);
    const now = Date.now();
    const result = { reminders24: 0, reminders1: 0, nudges: 0, hrAlerts: 0 };

    // 1) Nhắc lịch trước 24 giờ và trước 1 giờ
    const bookingRes = await base44.asServiceRole.entities.InterviewBooking.filter(
      { status: 'booked' },
      { sort: 'date', limit: 200 }
    );
    for (const b of bookingRes.items || []) {
      const start = slotStart(b);
      const until = start - now;
      if (until < -10 * 60 * 1000) continue;

      const needs24 = !b.reminder_24_sent && until <= 24 * HOUR && until > HOUR;
      const needs1 = !b.reminder_1_sent && until <= HOUR;

      if (needs24 || needs1) {
        const mail = buildEmail('interview_reminder', {
          candidateName: b.candidate_name,
          jobTitle: b.job_title,
          slotText: slotLabel(b),
          mode: b.mode,
          place: b.mode === 'onsite' ? b.location : b.meeting_link,
          interviewerName: b.interviewer_name,
          origin
        });
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: b.candidate_email, subject: mail.subject, html: mail.html });
          await base44.asServiceRole.entities.InterviewBooking.update(b.id, {
            reminder_24_sent: b.reminder_24_sent || needs24,
            reminder_1_sent: b.reminder_1_sent || needs1
          });
          if (needs24) result.reminders24 += 1;
          if (needs1) result.reminders1 += 1;
        } catch (e) {}
      }
    }

    // 2) Ứng viên đậu vòng 2 nhưng chưa chọn lịch
    const pendingRes = await base44.asServiceRole.entities.Application.filter(
      { status: 'test_passed' },
      { sort: '-round2_decided_at', limit: 200 }
    );
    let adminEmails: string[] = [];
    for (const app of pendingRes.items || []) {
      const decidedAt = app.round2_decided_at || app.updated_date || app.created_date;
      if (!decidedAt) continue;
      const days = (now - new Date(decidedAt).getTime()) / (24 * HOUR);

      if (days >= 3 && !app.schedule_nudge_sent_at) {
        const mail = buildEmail('schedule_nudge', {
          candidateName: app.full_name,
          jobTitle: app.job_title,
          company: app.company,
          scheduleUrl: `/lich-phong-van/${app.id}`,
          origin
        });
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: app.email, subject: mail.subject, html: mail.html });
          await base44.asServiceRole.entities.Application.update(app.id, { schedule_nudge_sent_at: new Date().toISOString() });
          result.nudges += 1;
        } catch (e) {}
      }

      if (days >= 7 && !app.schedule_hr_alerted_at) {
        if (!adminEmails.length) {
          try {
            const admins = await base44.asServiceRole.entities.User.list();
            const list = Array.isArray(admins) ? admins : admins?.items || [];
            adminEmails = list.filter((u: any) => u.role === 'admin' && u.email).map((u: any) => u.email).slice(0, 3);
          } catch (e) {}
        }
        const mail = buildEmail('schedule_hr_alert', {
          candidateName: app.full_name,
          jobTitle: app.job_title,
          company: app.company,
          note: app.email,
          origin
        });
        for (const to of adminEmails) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({ to, subject: mail.subject, html: mail.html });
          } catch (e) {}
        }
        await base44.asServiceRole.entities.Application.update(app.id, { schedule_hr_alerted_at: new Date().toISOString() });
        result.hrAlerts += 1;
      }
    }

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}