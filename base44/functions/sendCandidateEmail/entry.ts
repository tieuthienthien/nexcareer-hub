import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureCandidateUser, normalizeEmail } from '../../shared/candidateAccount.ts';
import { applyMergeTags, renderEmailHtml, htmlToText } from '../../shared/emailBrand.ts';

function isUrl(value: any) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function isLink(value: any) {
  return typeof value === 'string' && /^(https?:\/\/|mailto:)/i.test(value.trim());
}

function emailList(value: any): string[] {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[,;\s]+/);
  return raw
    .map((item: any) => normalizeEmail(String(item || '')))
    .filter((item: string | null): item is string => !!item)
    .slice(0, 10);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Chỉ HR được gửi email cho ứng viên' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const applicationId = String(body?.application_id || '').trim();
    if (!applicationId) return Response.json({ error: 'Thiếu hồ sơ ứng viên' }, { status: 400 });

    const testOnly = body?.test_only === true;
    const app = await base44.asServiceRole.entities.Application.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Không tìm thấy hồ sơ ứng viên' }, { status: 404 });

    const vars: Record<string, any> = {};
    Object.entries(body?.variables || {}).forEach(([key, value]) => {
      vars[key] = value === undefined || value === null ? '' : String(value);
    });

    const subjectFilled = applyMergeTags(body?.subject || '', vars);
    const bodyFilled = applyMergeTags(body?.body_html || '', vars);
    const ctaLabel = applyMergeTags(body?.cta?.label || '', vars).text;
    const ctaUrl = applyMergeTags(body?.cta?.url || '', vars).text.trim();

    const subjectRaw = subjectFilled.text.trim();
    if (!subjectRaw) return Response.json({ error: 'Email chưa có tiêu đề' }, { status: 400 });
    if (!bodyFilled.text.trim()) return Response.json({ error: 'Email chưa có nội dung' }, { status: 400 });

    const recipient = testOnly ? normalizeEmail(user.email) : normalizeEmail(body?.to || app.email);
    if (!recipient) return Response.json({ error: 'Hồ sơ chưa có email hợp lệ để gửi' }, { status: 400 });

    const subject = testOnly ? `[Gửi thử] ${subjectRaw}` : subjectRaw;
    const banner = isUrl(body?.banner_url) ? { url: String(body.banner_url).trim(), alt: body?.banner_alt || '' } : null;
    const signature = isUrl(body?.signature_url) ? { url: String(body.signature_url).trim(), alt: body?.signature_alt || '' } : null;

    const inlineImages = (Array.isArray(body?.inline_images) ? body.inline_images : [])
      .filter((image: any) => isUrl(image?.url))
      .slice(0, 6)
      .map((image: any) => ({
        url: String(image.url).trim(),
        alt: String(image.alt || ''),
        align: String(image.align || 'center'),
        width: Number(image.width) || 100,
      }));

    const html = renderEmailHtml({
      bodyHtml: bodyFilled.text,
      banner,
      signature,
      inlineImages,
      cta: ctaLabel && isLink(ctaUrl) ? { label: ctaLabel, url: ctaUrl } : null,
      signatureLines: [
        vars.ten_hr || user.full_name || 'Bộ phận Tuyển dụng',
        vars.chuc_danh_hr || '',
        vars.email_hr || user.email || '',
        vars.sdt_hr ? `Điện thoại: ${vars.sdt_hr}` : '',
        vars.ten_cong_ty || app.company || 'Nexora Technology',
      ].filter(Boolean),
      footerNote: vars.email_hr ? `Liên hệ tuyển dụng: ${vars.email_hr}${vars.sdt_hr ? ` · ${vars.sdt_hr}` : ''}` : '',
    });
    const text = htmlToText(html);

    const warnings: string[] = [];
    if (subjectFilled.missing.length || bodyFilled.missing.length) {
      const missing = Array.from(new Set([...subjectFilled.missing, ...bodyFilled.missing]));
      warnings.push(`Đã bỏ các biến chưa có dữ liệu: ${missing.join(', ')}`);
    }

    let emailSent = false;
    let emailError = '';
    let status = 'sent';

    if (testOnly) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: recipient, subject, html, text });
        emailSent = true;
      } catch (e: any) {
        emailError = e?.message || 'Không gửi được email thử';
        status = 'failed';
      }
    } else {
      const ensured = await ensureCandidateUser(base44, recipient);
      if (!ensured.registered) {
        emailError = ensured.error || 'Ứng viên chưa có tài khoản trong app nên chưa gửi được email';
        status = 'failed';
      } else {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: recipient, subject, html, text });
          emailSent = true;
        } catch (e: any) {
          const raw = e?.message || '';
          emailError = /custom domain/i.test(raw)
            ? 'Ứng viên chưa từng đăng nhập app nên hệ thống chỉ gửi được khi app có tên miền email đã xác thực (mục Tên miền).'
            : raw || 'Không gửi được email cho ứng viên';
          status = 'failed';
        }
      }
    }

    const ccList = emailList(body?.cc);
    const bccList = emailList(body?.bcc);
    if (emailSent && !testOnly) {
      for (const extra of [...ccList, ...bccList]) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: extra,
            subject: `[Bản sao] ${subject}`,
            html,
            text,
          });
        } catch (e) {
          warnings.push(`Chưa gửi được bản sao tới ${extra}`);
        }
      }
    }

    const now = new Date().toISOString();
    const log = await base44.asServiceRole.entities.EmailLog.create({
      application_id: applicationId,
      job_id: app.job_id || '',
      step: body?.step || '',
      template_key: body?.template_key || '',
      to_email: recipient,
      cc: ccList,
      bcc: bccList,
      subject,
      body_html: bodyFilled.text,
      banner_url: banner?.url || '',
      banner_alt: banner?.alt || '',
      signature_url: signature?.url || '',
      signature_alt: signature?.alt || '',
      status,
      error: emailError || '',
      is_test: testOnly,
      sent_by_email: user.email || '',
      sent_at: now,
    });

    return Response.json({
      ok: emailSent,
      status,
      log_id: log?.id,
      to: recipient,
      warnings,
      email_error: emailError || undefined,
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Lỗi không xác định' }, { status: 500 });
  }
}