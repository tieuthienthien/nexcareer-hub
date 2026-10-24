import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/candidateAccount.ts';
import { sendStageMail } from '../../shared/mailer.ts';
import { appOrigin } from '../../shared/stageEmails.ts';
import { publicTasks, mcqQuestions, SAMPLE_SIMULATION } from '../../shared/jobSimulation.ts';
import { gradeSimulation } from '../../shared/simulationGrade.ts';

const CHEAT_LABEL: Record<string, string> = {
  copy: 'Cố sao chép nội dung',
  paste: 'Cố dán nội dung',
  cut: 'Cố cắt nội dung',
  drag: 'Kéo thả văn bản',
  context_menu: 'Mở menu chuột phải',
  tab_switch: 'Chuyển tab / rời cửa sổ làm bài',
  window_blur: 'Rời khỏi cửa sổ làm bài',
  devtools: 'Mở DevTools',
  fullscreen_exit: 'Thoát chế độ toàn màn hình',
  fast_submit: 'Nộp bài nhanh bất thường',
  bulk_paste: 'Dán nội dung hàng loạt'
};

/** Ghi nhận một sự kiện nghi vấn; vượt ngưỡng thì báo ngay cho HR (chỉ cảnh báo, không tự loại). */
async function logCheat(base44: any, params: { invite: any; attempt: any; type: string; detail?: string; threshold?: number }) {
  const { invite, attempt, type, detail = '', threshold = 3 } = params;
  const now = new Date().toISOString();
  try {
    const found = await base44.asServiceRole.entities.CheatEvent.filter({ attempt_id: attempt.id, type }, { limit: 1 });
    const existing = (found.items || [])[0];
    if (existing) {
      await base44.asServiceRole.entities.CheatEvent.update(existing.id, {
        count: Number(existing.count || 1) + 1,
        last_at: now,
        detail: String(detail || existing.detail || '').slice(0, 280)
      });
    } else {
      await base44.asServiceRole.entities.CheatEvent.create({
        application_id: invite.application_id,
        invite_id: invite.id,
        attempt_id: attempt.id,
        simulation_id: invite.simulation_id,
        candidate_email: invite.candidate_email,
        candidate_name: invite.candidate_name || '',
        type,
        count: 1,
        first_at: now,
        last_at: now,
        detail: String(detail || '').slice(0, 280)
      });
    }

    const all = await base44.asServiceRole.entities.CheatEvent.filter({ attempt_id: attempt.id }, { limit: 50 });
    const items = all.items || [];
    const total = items.reduce((s: number, e: any) => s + (Number(e.count) || 1), 0);

    if (total >= threshold) {
      const prior = await base44.asServiceRole.entities.Notification.filter(
        { application_id: invite.application_id, type: 'system' },
        { sort: '-created_date', limit: 20 }
      );
      const already = (prior.items || []).some((n: any) => String(n.message || '').includes('dấu hiệu gian lận'));
      if (!already) {
        const lines = items.map((e: any) => `• ${CHEAT_LABEL[e.type] || e.type}: ${Number(e.count) || 1} lần`).join('\n');
        await base44.asServiceRole.entities.Notification.create({
          message: `Ứng viên ${invite.candidate_name || invite.candidate_email} có dấu hiệu gian lận ở Vòng 2\n${lines}`,
          type: 'system',
          application_id: invite.application_id,
          candidate_id: '',
          candidate_name: invite.candidate_name || '',
          job_title: invite.job_title || '',
          is_read: false,
          created_at: now
        });
      }
    }
    return total;
  } catch (e) {
    return 0;
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '').trim();
    const action = String(body?.action || 'load');
    if (!token) return Response.json({ error: 'Thiếu mã bài làm' }, { status: 400 });

    const inviteRes = await base44.asServiceRole.entities.SimulationInvite.filter({ token }, { limit: 1 });
    const invite = (inviteRes.items || [])[0];
    if (!invite) return Response.json({ error: 'Link làm bài không hợp lệ' }, { status: 404 });

    const isOwner = normalizeEmail(user.email) === normalizeEmail(invite.candidate_email);
    if (!isOwner && user.role !== 'admin') {
      return Response.json({ error: 'Link làm bài này không thuộc tài khoản của bạn' }, { status: 403 });
    }

    const sim = await base44.asServiceRole.entities.JobSimulation.get(invite.simulation_id).catch(() => null);
    const simulation = sim || SAMPLE_SIMULATION;
    const durationMin = Number(simulation.duration_min) || 60;
    const passScore = Number(simulation.pass_score) || 80;

    const attemptRes = await base44.asServiceRole.entities.SimulationAttempt.filter(
      { invite_id: invite.id },
      { sort: '-created_date', limit: 1 }
    );
    let attempt = (attemptRes.items || [])[0] || null;

    const expired = !!invite.expires_at && new Date(invite.expires_at).getTime() < Date.now();
    const submitted = invite.status === 'submitted' || attempt?.status === 'submitted';

    const lockedResponse = (reason: string) =>
      Response.json({
        locked: true,
        reason,
        simulation: { name: simulation.name, role_title: simulation.role_title, duration_min: durationMin, pass_score: passScore },
        invite: { status: invite.status, expires_at: invite.expires_at },
        attempt: submitted && attempt
          ? { score: attempt.score, passed: attempt.passed, task_scores: attempt.task_scores || [], ai_report: attempt.ai_report || {}, submitted_at: attempt.submitted_at }
          : null
      });

    if (action === 'load') {
      if (submitted) return lockedResponse('submitted');
      if (expired) {
        if (invite.status !== 'expired') await base44.asServiceRole.entities.SimulationInvite.update(invite.id, { status: 'expired' });
        return lockedResponse('expired');
      }

      if (!attempt) {
        attempt = await base44.asServiceRole.entities.SimulationAttempt.create({
          invite_id: invite.id,
          simulation_id: invite.simulation_id,
          application_id: invite.application_id,
          job_id: invite.job_id || '',
          candidate_email: invite.candidate_email,
          candidate_name: invite.candidate_name || '',
          status: 'in_progress',
          answers: {},
          flags: {},
          started_at: new Date().toISOString()
        });
        await base44.asServiceRole.entities.SimulationInvite.update(invite.id, {
          status: 'started',
          started_at: attempt.started_at
        });
        await base44.asServiceRole.entities.Application.update(invite.application_id, { test_started_at: attempt.started_at }).catch(() => null);
      }

      const elapsed = Math.floor((Date.now() - new Date(attempt.started_at || Date.now()).getTime()) / 1000);
      return Response.json({
        locked: false,
        simulation: {
          name: simulation.name,
          role_title: simulation.role_title,
          description: simulation.description,
          duration_min: durationMin,
          pass_score: passScore,
          tasks: publicTasks(simulation)
        },
        mcq: mcqQuestions(),
        attempt: { answers: attempt.answers || {}, started_at: attempt.started_at, flags: attempt.flags || {} },
        remaining_sec: Math.max(0, durationMin * 60 - elapsed)
      });
    }

    if (action === 'save') {
      if (submitted) return lockedResponse('submitted');
      if (expired) return lockedResponse('expired');
      if (!attempt) return Response.json({ error: 'Bài làm chưa được bắt đầu' }, { status: 400 });
      await base44.asServiceRole.entities.SimulationAttempt.update(attempt.id, {
        answers: body?.answers || {},
        flags: body?.flags || {}
      });
      return Response.json({ ok: true, saved_at: new Date().toISOString() });
    }

    if (action === 'submit') {
      if (submitted) return lockedResponse('submitted');
      if (!attempt) return Response.json({ error: 'Bài làm chưa được bắt đầu' }, { status: 400 });

      const answers = body?.answers || {};
      const flags = body?.flags || {};

      const graded = await gradeSimulation(base44, { simulation, attempt, answers });
      const totalScore = graded.score;
      const passed = graded.passed;
      const taskScores = graded.task_scores;
      const aiReport = graded.ai_report;
      const now = new Date().toISOString();
      const spent = Math.floor((Date.now() - new Date(attempt.started_at || now).getTime()) / 1000);

      // Nộp bài nhanh bất thường: dưới 25% thời lượng quy định.
      if (spent < durationMin * 60 * 0.25) {
        await logCheat(base44, {
          invite,
          attempt,
          type: 'fast_submit',
          detail: `Nộp sau ${Math.round(spent / 60)} phút / ${durationMin} phút`,
          threshold: Math.max(1, Number(simulation.cheat_threshold) || 3)
        });
      }

      const updated = await base44.asServiceRole.entities.SimulationAttempt.update(attempt.id, {
        status: 'submitted',
        answers,
        flags,
        task_scores: taskScores,
        score: totalScore,
        passed,
        ai_report: aiReport,
        submitted_at: now,
        time_spent_sec: spent
      });

      await base44.asServiceRole.entities.SimulationInvite.update(invite.id, {
        status: 'submitted',
        submitted_at: now,
        score: totalScore,
        passed
      });

      // Điểm AI chỉ mang tính tham khảo → hồ sơ dừng ở "đã nộp bài", HR chấm Điểm HR chính thức rồi quyết định.
      await base44.asServiceRole.entities.Application.update(invite.application_id, {
        status: 'test_submitted',
        rms_status: 'cv_approved',
        test_submitted_at: now,
        test_score: totalScore,
        test_ai_analysis: [aiReport.strengths, aiReport.improvements].filter(Boolean).join('\n\n'),
        step2_done: true,
        step2_at: now
      }).catch(() => null);

      let emailSent = false;
      let emailError = '';
      const appRow = await base44.asServiceRole.entities.Application.get(invite.application_id).catch(() => null);
      if (appRow) {
        const mail = await sendStageMail(base44, appRow, 'test_submitted_ack', { origin: appOrigin(req) });
        emailSent = mail.sent;
        emailError = mail.error;
      }

      return Response.json({
        ok: true,
        email_sent: emailSent,
        email_error: emailError || undefined,
        result: {
          score: updated.score,
          passed: updated.passed,
          pass_score: passScore,
          task_scores: taskScores,
          ai_report: aiReport,
          submitted_at: now,
          time_spent_sec: spent,
          certificate: passed
        }
      });
    }

    if (action === 'cheat') {
      if (submitted || expired || !attempt) return Response.json({ ok: true, ignored: true });
      const type = String(body?.type || '').trim().slice(0, 40);
      if (!type) return Response.json({ error: 'Thiếu loại sự kiện' }, { status: 400 });
      const threshold = Math.max(1, Number(simulation.cheat_threshold) || 3);
      const total = await logCheat(base44, { invite, attempt, type, detail: String(body?.detail || ''), threshold });
      return Response.json({ ok: true, total, threshold });
    }

    return Response.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}