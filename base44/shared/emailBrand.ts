// Bố cục email thương hiệu NexCareer Hub — dùng chung cho mọi email tuyển dụng.
// Email HTML dạng bảng 600px, tương thích Gmail/Outlook, kèm bản chữ thuần.

export const BRAND = {
  name: 'NexCareer Hub',
  company: 'Nexora Technology',
  logo: 'https://media.base44.com/images/public/6acd03fc9e292b4e6a9a3492/0ca8c156e_logo.png',
  primary: '#564be7',
  background: '#fbf7fd',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#26163c',
  muted: '#8b51d6',
  footerBg: '#f5f2ff',
  website: 'https://nexcareerhubbyxme.base44.app',
  address: 'Nexora Technology · Tầng 5, Nexora Tower, Hà Nội',
};

export function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Điền các biến {{ten_bien}}. Biến không có dữ liệu bị xoá và trả về trong missing.
export function applyMergeTags(
  text: string,
  vars: Record<string, any>,
  options: { escape?: boolean } = {}
): { text: string; missing: string[] } {
  const missing: string[] = [];
  const out = String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const raw = vars?.[key];
    const value = raw === undefined || raw === null ? '' : String(raw).trim();
    if (!value) {
      if (!missing.includes(key)) missing.push(key);
      return '';
    }
    return options.escape ? escapeHtml(value) : value;
  });
  return { text: out, missing };
}

// Quill xuất ra class (ql-align-…) và bỏ qua style inline — email cần style inline.
export function normalizeBody(html: string): string {
  let out = String(html || '');

  out = out.replace(/<([a-z0-9]+)([^>]*?)\sclass="([^"]*)"([^>]*)>/gi, (_m, tag, pre, cls, post) => {
    const align = /ql-align-center/.test(cls)
      ? 'center'
      : /ql-align-right/.test(cls)
        ? 'right'
        : /ql-align-justify/.test(cls)
          ? 'justify'
          : '';
    const rest = `${pre || ''} ${post || ''}`.replace(/\s{2,}/g, ' ').trim();
    const attrs = rest ? ` ${rest}` : '';
    return align ? `<${tag}${attrs} style="text-align:${align}">` : `<${tag}${attrs}>`;
  });

  out = out.replace(/<p(\s[^>]*)?>/gi, (m, attrs = '') =>
    /\bstyle=/.test(attrs) ? m : `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:${BRAND.text}"${attrs}>`
  );
  out = out.replace(/<li(\s[^>]*)?>/gi, (m, attrs = '') =>
    /\bstyle=/.test(attrs) ? m : `<li style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:${BRAND.text}"${attrs}>`
  );
  out = out.replace(/<h([234])(\s[^>]*)?>/gi, (m, level, attrs = '') =>
    /\bstyle=/.test(attrs)
      ? m
      : `<h${level} style="margin:22px 0 10px 0;font-size:${level === '2' ? '20' : level === '3' ? '17' : '15'}px;line-height:1.4;color:${BRAND.text}"${attrs}>`
  );
  out = out.replace(/<img((?:(?!style=)[^>])*)>/gi, (m, attrs) =>
    /\bstyle=/.test(attrs)
      ? m
      : `<img${attrs} style="max-width:100%;height:auto;display:block;border:0;outline:none;text-decoration:none">`
  );

  return out;
}

export function htmlToText(html: string): string {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type EmailImage = { url?: string; alt?: string };

export type InlineImage = EmailImage & { align?: string; width?: number };

export type RenderOptions = {
  bodyHtml: string;
  banner?: EmailImage | null;
  signature?: EmailImage | null;
  inlineImages?: InlineImage[];
  cta?: { label?: string; url?: string } | null;
  signatureLines?: string[];
  footerNote?: string;
};

export function renderEmailHtml(options: RenderOptions): string {
  const { bodyHtml, banner, signature, inlineImages = [], cta, signatureLines = [], footerNote = '' } = options;
  const body = normalizeBody(bodyHtml);

  const inlineHtml = (inlineImages || [])
    .filter((image) => image?.url && /^https?:\/\//i.test(String(image.url)))
    .slice(0, 6)
    .map((image) => {
      const align = image.align === 'left' ? 'left' : image.align === 'right' ? 'right' : 'center';
      const width = Math.min(100, Math.max(20, Number(image.width) || 100));
      return `<tr><td align="${align}" style="padding:0 28px 18px 28px"><img src="${escapeHtml(
        String(image.url)
      )}" alt="${escapeHtml(image.alt || '')}" width="${Math.round((600 * width) / 100)}" style="display:inline-block;width:${width}%;max-width:100%;height:auto;border:0"></td></tr>`;
    })
    .join('');

  const bannerHtml = banner?.url
    ? `<tr><td style="padding:0"><img src="${escapeHtml(banner.url)}" alt="${escapeHtml(banner.alt || '')}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>`
    : '';

  const ctaHtml =
    cta?.url && cta?.label
      ? `<tr><td style="padding:4px 28px 26px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:${BRAND.primary};border-radius:12px">
              <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(cta.label)}</a>
            </td>
          </tr></table>
          <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8b51d6">Nếu nút trên không mở được, dán liên kết này vào trình duyệt:<br><a href="${escapeHtml(cta.url)}" style="color:${BRAND.primary};word-break:break-all">${escapeHtml(cta.url)}</a></p>
        </td></tr>`
      : '';

  const signatureHtml = `<tr><td style="padding:22px 28px 26px 28px;border-top:1px solid ${BRAND.border}">
      ${signature?.url ? `<img src="${escapeHtml(signature.url)}" alt="${escapeHtml(signature.alt || 'Chữ ký')}" width="120" style="display:block;width:120px;max-width:120px;height:auto;border:0;margin-bottom:12px">` : ''}
      ${signatureLines
        .filter(Boolean)
        .map((line, i) =>
          i === 0
            ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${BRAND.text}">${escapeHtml(line)}</p>`
            : `<p style="margin:2px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b7280">${escapeHtml(line)}</p>`
        )
        .join('')}
    </td></tr>`;

  const footerHtml = `<tr><td style="background:${BRAND.footerBg};padding:20px 28px;text-align:center">
      <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280">${escapeHtml(BRAND.company)} · ${escapeHtml(BRAND.address)}</p>
      <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280"><a href="${BRAND.website}" style="color:${BRAND.primary};text-decoration:none">${escapeHtml(BRAND.website.replace(/^https?:\/\//, ''))}</a></p>
      ${footerNote ? `<p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280">${escapeHtml(footerNote)}</p>` : ''}
      <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#9ca3af">Email được gửi từ NexCareer Hub.</p>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NexCareer Hub</title></head>
<body style="margin:0;padding:0;background:${BRAND.background}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.background};padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden">
        <tr><td style="background:${BRAND.primary};padding:18px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="padding-right:12px"><img src="${BRAND.logo}" alt="NexCareer Hub" width="38" height="38" style="display:block;width:38px;height:38px;border-radius:19px;border:0"></td>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:#ffffff">NexCareer Hub</td>
          </tr></table>
        </td></tr>
        ${bannerHtml}
        <tr><td style="padding:28px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.text}">${body}</td></tr>
        ${inlineHtml}
        ${ctaHtml}
        ${signatureHtml}
        ${footerHtml}
      </table>
    </td></tr>
  </table>
</body></html>`;
}