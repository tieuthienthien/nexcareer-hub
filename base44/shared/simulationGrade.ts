import { AI_MODEL } from './aiModel.ts';
import { MCQ_TASK3 } from './jobSimulation.ts';

const round1 = (n: number) => Math.round(Number(n || 0) * 10) / 10;
const clamp = (n: any, min: number, max: number) => Math.max(min, Math.min(max, Number(n) || 0));

export function gradeMcq(answers: any) {
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

/**
 * Chấm bài Job Simulation (Vòng 2): điểm test tự động + AI chấm chất lượng code và phần giao tiếp.
 * Dùng chung cho lần nộp bài đầu tiên và khi HR cho AI chấm lại.
 */
export async function gradeSimulation(base44: any, params: { simulation: any; attempt: any; answers: any }) {
  const { simulation, attempt, answers } = params;
  const passScore = Number(simulation?.pass_score) || 80;

  const r1 = answers?.task1?.results || { passed: 0, total: 0 };
  const r2 = answers?.task2?.results || { passed: 0, total: 0 };
  const task1Score = r1.total ? round1((30 * Number(r1.passed)) / Number(r1.total)) : 0;
  const task2TestScore = r2.total ? round1((24 * Number(r2.passed)) / Number(r2.total)) : 0;
  const mcq = gradeMcq(answers?.task3 || {});

  let ai: any = null;
  try {
    ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: AI_MODEL,
      prompt: `Bạn là kỹ sư phần mềm cấp cao của Nexora Technology, đang chấm bài Job Simulation (Vòng 2) của ứng viên vị trí ${simulation?.role_title || 'Software Engineer'}.

ỨNG VIÊN: ${attempt?.candidate_name || ''}

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
  const score = round1(Math.min(100, task1Score + task2Score + mcq.score + commScore));
  const passed = score >= passScore;

  const task_scores = [
    { task_id: 'task1', title: 'Sửa lỗi sản xuất', score: task1Score, max: 30, comment: `${r1.passed}/${r1.total} test đạt` },
    { task_id: 'task2', title: 'Viết tính năng mới', score: task2Score, max: 30, comment: `${r2.passed}/${r2.total} test đạt · AI ${codeScore}/6 — ${ai?.code_quality?.comment || 'AI chưa nhận xét được'}` },
    { task_id: 'task3', title: 'Xử lý sự cố tình huống', score: mcq.score, max: 20, comment: 'Chấm tự động theo mức độ hợp lý của từng phương án' },
    { task_id: 'task4', title: 'Giao tiếp công việc', score: commScore, max: 20, comment: ai?.communication?.comment || 'AI chưa nhận xét được' }
  ];

  const ai_report = {
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

  return { score, passed, task_scores, ai_report };
}