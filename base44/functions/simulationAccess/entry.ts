import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { AI_MODEL } from '../../shared/aiModel.ts';
import { normalizeEmail } from '../../shared/candidateAccount.ts';
import { sendStageMail } from '../../shared/mailer.ts';
import { appOrigin } from '../../shared/stageEmails.ts';
import { MCQ_TASK3, publicTasks, mcqQuestions, SAMPLE_SIMULATION } from '../../shared/jobSimulation.ts';

const round1 = (n: number) => Math.round(Number(n || 0) * 10) / 10;
const clamp = (n: any, min: number, max: number) => Math.max(min, Math.min(max, Number(n) || 0));

function gradeMcq(answers: any) {
  let score = 0;
  const detail = MCQ_TASK3.map((q) => {
    const chosenIndex = Number(answers?.[q.id]);
    const chosen = q.options[chosenIndex] || null;
    const best = q.options.reduce((a, b) => (b.points > a.points ? b : a), q.options[0]);
    score += chosen ? chosen.points : 0;
    return {
      id: q.id,
      prompt: q.prompt,
      chosen: chosen ? chosen.text : 'Chưa trả lời',
      best: best.text,
      points: chosen ? chosen.points : 0,
      max: best.points
    };
  });
  return { score, detail };
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

      const r1 = answers?.task1?.results || { passed: 0, total: 0 };
      const r2 = answers?.task2?.results || { passed: 0, total: 0 };
      const task1Score = r1.total ? round1((30 * Number(r1.passed)) / Number(r1.total)) : 0;
      const task2TestScore = r2.total ? round1((24 * Number(r2.passed)) / Number(r2.total)) : 0;
      const mcq = gradeMcq(answers?.task3 || {});

      let ai: any = null;
      try {
        ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
          model: AI_MODEL,
          prompt: `Bạn là kỹ sư phần mềm cấp cao của Nexora Technology, đang chấm bài Job Simulation (Vòng 2) của ứng viên vị trí ${simulation.role_title || 'Software Engineer'}.

ỨNG VIÊN: ${attempt.candidate_name || ''}

--- TASK 1: Sửa lỗi tính giảm giá (tối đa 30 điểm, đã có ${task1Score} điểm từ test tự động) ---
Code nộp:
${String(answers?.task1?.code || '(trống)').slice(0, 3000)}
Kết quả test: ${r1.passed}/${r1.total}

--- TASK 2: Viết rate limiter (test tự động: ${r2.passed}/${r2.total}, ${task2TestScore}/24 điểm) ---
Code nộp:
${String(answers?.task2?.code || '(trống)').slice(0, 3000)}

--- TASK 3: Trắc nghiệm xử lý sự cố: ${mcq.score}/20 điểm ---

--- TASK 4: Tin nhắn báo cáo cho trưởng nhóm & PM (tối đa 20 điểm) ---
${String(answers?.task4 || '(trống)').slice(0, 3000)}

Hãy chấm:
1. code_quality: chất lượng code Task 2 trên thang 0–6 (đặt tên, độ phức tạp, dễ đọc, xử lý ca biên). Nhận xét ngắn gọn bằng tiếng Việt.
2. communication: chất lượng tin nhắn Task 4 trên thang 0–20, theo rubric: rõ ràng (5), trung thực không đổ lỗi (5), có hành động tiếp theo cụ thể (5), giọng chuyên nghiệp (5). Nêu lý do chấm.
3. strengths: 2–3 câu điểm mạnh dựa trên bằng chứng trong bài làm.
4. improvements: 2–3 câu điểm cần cải thiện.
5. radar: điểm 0–100 cho 4 kỹ năng debug, coding, judgment (xử lý tình huống), communication.
Không thêm điểm vượt mức tối đa. Chỉ trả JSON hợp lệ.`,
          response_json_schema: {
            type: 'object',
            properties: {
              code_quality: {
                type: 'object',
                properties: { score: { type: 'number' }, comment: { type: 'string' } }
              },
              communication: {
                type: 'object',
                properties: { score: { type: 'number' }, comment: { type: 'string' } }
              },
              strengths: { type: 'string' },
              improvements: { type: 'string' },
              radar: {
                type: 'object',
                properties: {
                  debug: { type: 'number' },
                  coding: { type: 'number' },
                  judgment: { type: 'number' },
                  communication: { type: 'number' }
                }
              }
            }
          }
        });
      } catch (e: any) {
        ai = null;
      }

      const codeScore = clamp(ai?.code_quality?.score, 0, 6);
      const commScore = clamp(ai?.communication?.score, 0, 20);
      const task2Score = round1(task2TestScore + codeScore);
      const totalScore = round1(Math.min(100, task1Score + task2Score + mcq.score + commScore));
      const passed = totalScore >= passScore;
      const now = new Date().toISOString();
      const spent = Math.floor((Date.now() - new Date(attempt.started_at || now).getTime()) / 1000);

      const taskScores = [
        { task_id: 'task1', title: 'Sửa lỗi sản xuất', score: task1Score, max: 30, comment: `${r1.passed}/${r1.total} test đạt` },
        { task_id: 'task2', title: 'Viết tính năng mới', score: task2Score, max: 30, comment: `${r2.passed}/${r2.total} test đạt · AI ${codeScore}/6 — ${ai?.code_quality?.comment || 'AI chưa nhận xét được'}` },
        { task_id: 'task3', title: 'Xử lý sự cố tình huống', score: mcq.score, max: 20, comment: 'Chấm tự động theo mức độ hợp lý của từng phương án' },
        { task_id: 'task4', title: 'Giao tiếp công việc', score: commScore, max: 20, comment: ai?.communication?.comment || 'AI chưa nhận xét được' }
      ];

      const aiReport = {
        strengths: ai?.strengths || '',
        improvements: ai?.improvements || '',
        radar: {
          debug: clamp(ai?.radar?.debug, 0, 100),
          coding: clamp(ai?.radar?.coding, 0, 100),
          judgment: clamp(ai?.radar?.judgment, 0, 100),
          communication: clamp(ai?.radar?.communication, 0, 100)
        },
        mcq: mcq.detail,
        ai_available: !!ai
      };

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
        test_ai_analysis: [ai?.strengths, ai?.improvements].filter(Boolean).join('\n\n'),
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

    return Response.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}