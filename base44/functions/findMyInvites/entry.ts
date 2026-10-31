import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/candidateAccount.ts';

// Trả về các lời mời Job Simulation (Vòng 2) còn hạn của ứng viên đang đăng nhập.
// Tìm theo HỒ SƠ của người đó (tạo bởi tài khoản này hoặc cùng email), nên vẫn thấy lời mời
// kể cả khi email ghi trên hồ sơ khác email đăng nhập.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = normalizeEmail(user.email);
    const appIds = new Set<string>();

    const byOwner = await base44.asServiceRole.entities.Application.filter(
      { created_by_id: user.id },
      { sort: '-created_date', limit: 50 }
    ).catch(() => ({ items: [] }));
    (byOwner.items || []).forEach((a: any) => a?.id && appIds.add(a.id));

    if (email) {
      const byEmail = await base44.asServiceRole.entities.Application.filter(
        { email },
        { sort: '-created_date', limit: 50 }
      ).catch(() => ({ items: [] }));
      (byEmail.items || []).forEach((a: any) => a?.id && appIds.add(a.id));
    }

    if (!appIds.size) return Response.json({ invites: [] });

    const res = await base44.asServiceRole.entities.SimulationInvite.filter(
      { application_id: { $in: Array.from(appIds) }, status: { $in: ['sent', 'started'] } },
      { sort: '-created_date', limit: 50 }
    ).catch(() => ({ items: [] }));

    const now = Date.now();
    const seen = new Set<string>();
    const invites = (res.items || [])
      .filter((i: any) => !i.expires_at || new Date(i.expires_at).getTime() > now)
      .filter((i: any) => (seen.has(i.application_id) ? false : (seen.add(i.application_id), true)))
      .map((i: any) => ({
        id: i.id,
        application_id: i.application_id,
        token: i.token,
        simulation_name: i.simulation_name,
        job_title: i.job_title,
        expires_at: i.expires_at,
        status: i.status,
      }));

    return Response.json({ invites });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Lỗi không xác định' }, { status: 500 });
  }
}
