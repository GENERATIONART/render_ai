const RESEND_API_URL = 'https://api.resend.com/emails';

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
};

const SUPPORT_EMAIL = 'hello@renderai.lol';
const BRAND_NAME = 'Render AI';
const ACCENT = '#FF4500';

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
      ({ label, value, href }) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e6e6e6;background:#fafafa;font-weight:600;vertical-align:top;width:180px;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 12px;border:1px solid #e6e6e6;vertical-align:top;">
            ${href ? `<a href="${escapeHtml(href)}" style="color:#0066cc;word-break:break-all;">${escapeHtml(value)}</a>` : escapeHtml(value)}
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
    ...rows.map(({ label, value, href }) => href ? `${label}: ${value ?? ''}\n  ${href}` : `${label}: ${value ?? ''}`),
    footer ? `\n${footer}` : ''
  ];
  return lines.join('\n');
};

// Generic send — can send to any address
export const sendEmail = async ({ to, subject, html, text, tags }) => {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!resendKey || !from) {
    return { skipped: true, reason: 'Email not configured (missing RESEND_API_KEY or RESEND_FROM)' };
  }
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    tags: Array.isArray(tags) ? tags : undefined
  };
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`Resend send failed (${res.status})${detail ? `: ${detail.slice(0, 500)}` : ''}`);
  }
  const data = await res.json().catch(() => ({}));
  return { ok: true, id: data?.id };
};

const step = (num, title, body) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="width:40px;vertical-align:top;padding-top:2px;">
        <span style="font-family:monospace;color:${ACCENT};font-weight:700;font-size:13px;">${num}</span>
      </td>
      <td>
        <div style="font-size:15px;font-weight:700;color:#111111;margin-bottom:4px;">${escapeHtml(title)}</div>
        <div style="font-size:14px;color:#666666;line-height:1.6;">${escapeHtml(body)}</div>
      </td>
    </tr>
  </table>`;

const emailShell = (content) => `
  <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f2f2f2;margin:0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">
            <tr>
              <td style="background:#000000;padding:24px 40px;">
                <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">${BRAND_NAME}</span>
              </td>
            </tr>
            ${content}
            <tr>
              <td style="padding:24px 40px;background:#111111;">
                <p style="margin:0 0 6px 0;font-size:13px;color:#888888;">Questions? Email us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${ACCENT};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
                <p style="margin:0;font-size:12px;color:#555555;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

export const renderBookingConfirmationHtml = ({ customerName, serviceName, projectId }) => {
  const firstName = escapeHtml((customerName || '').split(' ')[0] || 'there');
  const content = `
    <tr>
      <td style="padding:48px 40px 32px 40px;border-bottom:1px solid #eeeeee;">
        <div style="color:${ACCENT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:14px;">Order Confirmed</div>
        <h1 style="margin:0 0 16px 0;font-size:30px;font-weight:400;color:#111111;line-height:1.25;">Your project is in<br>good hands, ${firstName}.</h1>
        <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;">We've received your <strong>${escapeHtml(serviceName)}</strong> order and our team will get to work immediately. Here's what to expect next.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 28px 40px;background:#fafafa;border-bottom:1px solid #eeeeee;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#aaaaaa;margin-bottom:14px;">Order Details</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#888888;padding:5px 0;width:110px;">Service</td>
            <td style="font-size:13px;color:#111111;font-weight:600;padding:5px 0;">${escapeHtml(serviceName)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#888888;padding:5px 0;">Reference ID</td>
            <td style="font-size:13px;color:#111111;font-family:monospace;padding:5px 0;">${escapeHtml(projectId)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 40px 36px 40px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#aaaaaa;margin-bottom:24px;">What Happens Next</div>
        ${step('01', 'Confirmation Email', 'You\'ll receive an order confirmation with project details within 5 minutes. (That\'s this email!)')}
        ${step('02', 'Project Kickoff', 'Our team will review your files and reach out if we need any clarifications.')}
        ${step('03', 'Progress Updates', 'We\'ll email you with progress updates and draft previews throughout the process.')}
        ${step('04', 'Final Delivery', 'High-resolution files will be delivered via email within the agreed turnaround time.')}
      </td>
    </tr>`;
  return emailShell(content);
};

export const renderBookingConfirmationText = ({ customerName, serviceName, projectId }) => {
  const firstName = (customerName || '').split(' ')[0] || 'there';
  return [
    `${BRAND_NAME} — Order Confirmed`,
    '',
    `Hi ${firstName},`,
    '',
    `We've received your ${serviceName} order and our team will get to work immediately.`,
    '',
    `Reference ID: ${projectId}`,
    `Service: ${serviceName}`,
    '',
    'WHAT HAPPENS NEXT',
    '',
    '01  Confirmation Email',
    '    You\'ll receive an order confirmation with project details within 5 minutes. (That\'s this email!)',
    '',
    '02  Project Kickoff',
    '    Our team will review your files and reach out if we need any clarifications.',
    '',
    '03  Progress Updates',
    '    We\'ll email you with progress updates and draft previews throughout the process.',
    '',
    '04  Final Delivery',
    '    High-resolution files will be delivered via email within the agreed turnaround time.',
    '',
    `Questions? Email us at ${SUPPORT_EMAIL}`,
    `© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`
  ].join('\n');
};

export const renderInquiryConfirmationHtml = ({ customerName }) => {
  const firstName = escapeHtml((customerName || '').split(' ')[0] || 'there');
  const content = `
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200&h=400"
          alt="Render AI — Architectural Visualization"
          width="600"
          style="width:100%;max-width:600px;height:260px;object-fit:cover;display:block;"
        />
      </td>
    </tr>
    <tr>
      <td style="padding:48px 40px 32px 40px;border-bottom:1px solid #eeeeee;">
        <div style="color:${ACCENT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:14px;">Inquiry Received</div>
        <h1 style="margin:0 0 16px 0;font-size:30px;font-weight:400;color:#111111;line-height:1.25;">Thanks for reaching out, ${firstName}.</h1>
        <p style="margin:0;font-size:15px;color:#555555;line-height:1.7;">We've received your inquiry and will review your project details carefully. We typically respond within one business day.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 40px 36px 40px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#aaaaaa;margin-bottom:24px;">What Happens Next</div>
        ${step('01', 'We Review Your Inquiry', 'Our team will review your project details and determine the best package for your needs.')}
        ${step('02', 'We Follow Up', 'We\'ll reach out with a timeline, cost estimate, and any clarifying questions.')}
        ${step('03', 'Kickoff', 'Once approved, we\'ll start production and share the first draft with you.')}
      </td>
    </tr>`;
  return emailShell(content);
};

export const renderInquiryConfirmationText = ({ customerName }) => {
  const firstName = (customerName || '').split(' ')[0] || 'there';
  return [
    `${BRAND_NAME} — Inquiry Received`,
    '',
    `Hi ${firstName},`,
    '',
    'We\'ve received your inquiry and will review your project details carefully. We typically respond within one business day.',
    '',
    'WHAT HAPPENS NEXT',
    '',
    '01  We Review Your Inquiry',
    '    Our team will review your project details and determine the best package for your needs.',
    '',
    '02  We Follow Up',
    '    We\'ll reach out with a timeline, cost estimate, and any clarifying questions.',
    '',
    '03  Kickoff',
    '    Once approved, we\'ll start production and share the first draft with you.',
    '',
    `Questions? Email us at ${SUPPORT_EMAIL}`,
    `© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`
  ].join('\n');
};

