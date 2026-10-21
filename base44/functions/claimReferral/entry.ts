import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function derivedCode(userId) {
  return `NX-${String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });

    const code = String(body.code || '').trim();
    if (!code) return Response.json({ credited: false, reason: 'missing' });

    const usersResult = await base44.asServiceRole.entities.User.list();
    const users = Array.isArray(usersResult) ? usersResult : usersResult?.items || [];
    const normalized = code.toUpperCase().replace(/\s+/g, '');
    const inviter = users.find((item) => {
      if (!item?.id) return false;
      return item.id === code || derivedCode(item.id) === normalized;
    });

    if (!inviter) return Response.json({ credited: false, reason: 'invalid' });
    if (inviter.id === user.id) return Response.json({ credited: false, reason: 'self' });

    const already = await base44.asServiceRole.entities.Referral.filter(
      { invitee_id: user.id },
      { limit: 1 }
    );
    if (already?.items?.length) {
      return Response.json({ credited: false, reason: 'already_invited' });
    }

    await base44.asServiceRole.entities.Referral.create({
      inviter_id: inviter.id,
      inviter_email: inviter.email,
      invitee_id: user.id,
      invitee_email: user.email,
      code: normalized,
      status: 'credited',
      credited_at: new Date().toISOString()
    });

    return Response.json({ credited: true, inviter_name: inviter.full_name || inviter.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}