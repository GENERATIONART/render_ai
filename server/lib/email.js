const RESEND_API_URL = 'https://api.resend.com/emails';

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const sendOwnerEmail = async ({ subject, html, text, tags }) => {
  const ownerEmail = process.env.OWNER_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!ownerEmail || !resendKey || !from) {
    return { skipped: true, reason: 'Email not configured (missing OWNER_EMAIL, RESEND_API_KEY, or RESEND_FROM)' };
  }

  const payload = {
    from,
    to: [ownerEmail],
    subject,
    html,
    text,
    tags: Array.isArray(tags) ? tags : undefined
  };

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch (error) {
      // ignore
    }
    throw new Error(`Resend send failed (${res.status})${detail ? `: ${detail.slice(0, 500)}` : ''}`);
  }

  const data = await res.json().catch(() => ({}));
  return { ok: true, id: data?.id };
};

export const renderOwnerEmailHtml = ({ title, rows, footer }) => {
  const body = rows
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e6e6e6;background:#fafafa;font-weight:600;vertical-align:top;width:180px;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 12px;border:1px solid #e6e6e6;vertical-align:top;">
            ${escapeHtml(value)}
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px 0;">${escapeHtml(title)}</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px;">
        <tbody>
          ${body}
        </tbody>
      </table>
      ${footer ? `<p style="margin-top:16px;color:#666;font-size:13px;">${escapeHtml(footer)}</p>` : ''}
    </div>
  `;
};

export const renderOwnerEmailText = ({ title, rows, footer }) => {
  const lines = [
    title,
    '',
    ...rows.map(({ label, value }) => `${label}: ${value ?? ''}`),
    footer ? `\n${footer}` : ''
  ];
  return lines.join('\n');
};

