import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { SERVICE_CATALOG } from './lib/catalog.js';
import { createProject, createSignedUpload, getProjectById, isStripeEventProcessed, listProjectFiles, markPaid, markStripeEventProcessed, recordProjectFiles, setStripeSession } from './lib/supabaseStore.js';
import { renderOwnerEmailHtml, renderOwnerEmailText, sendOwnerEmail } from './lib/email.js';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from './lib/supabaseAdmin.js';

const PORT = Number(process.env.PORT || 5174);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const STRIPE_TAX_CODE = process.env.STRIPE_TAX_CODE || '';

const app = express();
app.use(cors());
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const parseCookies = (cookieHeader) => {
  const out = {};
  if (!cookieHeader) return out;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
};

const base64url = (input) => Buffer.from(input).toString('base64url');
const unbase64url = (input) => Buffer.from(input, 'base64url').toString('utf8');

const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

const makeSessionToken = (payload, secret) => {
  const body = base64url(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
};

const verifySessionToken = (token, secret) => {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body, secret);
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    if (!ok) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(unbase64url(body));
    if (!payload?.email || !payload?.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
};

const adminConfig = () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'brendan@brendantadler.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';
  return { adminEmail, adminPassword, sessionSecret };
};

const setAdminCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `admin_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 7}`
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
};

const clearAdminCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production';
  const parts = ['admin_session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
};

const requireAdmin = (req, res, next) => {
  const { sessionSecret, adminEmail } = adminConfig();
  if (!sessionSecret) {
    return res.status(501).json({ error: 'Admin auth is not configured (missing ADMIN_SESSION_SECRET)' });
  }
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.admin_session;
  const payload = verifySessionToken(token, sessionSecret);
  if (!payload) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (String(payload.email).toLowerCase() !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  req.admin = { email: payload.email };
  next();
};

app.get('/api/admin/session', (req, res) => {
  const { sessionSecret, adminEmail } = adminConfig();
  if (!sessionSecret) {
    return res.json({ authenticated: false });
  }
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifySessionToken(cookies.admin_session, sessionSecret);
  if (!payload || String(payload.email).toLowerCase() !== adminEmail) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, email: payload.email });
});

app.post('/api/admin/login', async (req, res) => {
  const { adminEmail, adminPassword, sessionSecret } = adminConfig();
  if (!sessionSecret) {
    return res.status(501).json({ error: 'Admin auth is not configured (missing ADMIN_SESSION_SECRET)' });
  }
  if (!adminPassword) {
    return res.status(501).json({ error: 'Admin auth is not configured (missing ADMIN_PASSWORD)' });
  }
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (email.toLowerCase() !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = makeSessionToken({ email: adminEmail, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }, sessionSecret);
  setAdminCookie(res, token);
  return res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  clearAdminCookie(res);
  return res.json({ ok: true });
});

app.get('/api/admin/portfolio', requireAdmin, async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ items: data || [] });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to load portfolio' });
  }
});

app.post('/api/admin/portfolio', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const row = req.body || {};
    const payload = {
      published: !!row.published,
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
      slug: (row.slug || '').trim(),
      title: (row.title || '').trim(),
      tag: (row.tag || '').trim() || null,
      location: (row.location || '').trim() || null,
      render_time: (row.render_time || '').trim() || null,
      image_url: (row.image_url || '').trim() || null,
      brief: (row.brief || '').trim() || null,
      scope: (row.scope || '').trim() || null,
      deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
      tools: Array.isArray(row.tools) ? row.tools : [],
      timeline: Array.isArray(row.timeline) ? row.timeline : [],
      updated_at: new Date().toISOString()
    };
    if (!payload.slug || !payload.title) {
      return res.status(400).json({ error: 'slug and title are required' });
    }

    const id = row.id || null;
    let result;
    if (id) {
      result = await supabase.from('portfolio_items').update(payload).eq('id', id).select('*').single();
    } else {
      result = await supabase.from('portfolio_items').insert(payload).select('*').single();
    }
    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }
    return res.json({ item: result.data });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to save portfolio item' });
  }
});

app.delete('/api/admin/portfolio/:id', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('portfolio_items').delete().eq('id', req.params.id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to delete portfolio item' });
  }
});

app.get('/api/admin/site-copy', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const keys = String(req.query.keys || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const query = supabase.from('site_copy').select('key,value');
    const { data, error } = keys.length ? await query.in('key', keys) : await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ rows: data || [] });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to load site copy' });
  }
});

app.post('/api/admin/site-copy', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const payload = rows
      .map((r) => ({ key: String(r.key || '').trim(), value: String(r.value ?? ''), updated_at: new Date().toISOString() }))
      .filter((r) => r.key);
    if (payload.length === 0) {
      return res.status(400).json({ error: 'rows are required' });
    }
    const { error } = await supabase.from('site_copy').upsert(payload);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to save site copy' });
  }
});

app.post('/api/admin/site-media/sign', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { originalName } = req.body || {};
    if (!originalName || typeof originalName !== 'string') {
      return res.status(400).json({ error: 'originalName is required' });
    }
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const path = `site-media/${Date.now()}_${crypto.randomUUID()}_${safeName}`;
    const { data, error } = await supabase.storage.from('site-media').createSignedUploadUrl(path, { upsert: false });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (!data?.token) {
      return res.status(500).json({ error: 'Supabase did not return an upload token' });
    }
    return res.json({ upload: { bucket: 'site-media', path: data.path || path, token: data.token } });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to create upload URL' });
  }
});

app.post('/api/webhooks/stripe', async (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return res.status(501).json({ error: 'Webhooks are not configured on the server (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe-Signature header' });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

  let event;
  try {
    const rawBody = req.rawBody;
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${error?.message || 'invalid signature'}` });
  }

  try {
    if (await isStripeEventProcessed(event.id)) {
      return res.json({ received: true, duplicate: true });
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data?.object;
      const projectId = session?.client_reference_id || session?.metadata?.projectId;
      const paymentStatus = session?.payment_status;
      if (projectId && paymentStatus === 'paid') {
        await markPaid(projectId, { sessionId: session?.id });

        try {
          const project = await getProjectById(projectId);
          const files = await listProjectFiles(projectId);
          const serviceName = project?.service_name || project?.serviceName || session?.metadata?.serviceName || '';
          const amountCents = project?.amount_cents;
          const amountUsd = typeof amountCents === 'number' ? (amountCents / 100).toFixed(2) : '';

          const html = renderOwnerEmailHtml({
            title: 'Payment Received',
            rows: [
              { label: 'Project ID', value: projectId },
              { label: 'Service', value: serviceName },
              { label: 'Amount', value: amountUsd ? `$${amountUsd}` : '(unknown)' },
              { label: 'Customer', value: project?.customer_name || '(unknown)' },
              { label: 'Business', value: project?.business_name || '(none)' },
              { label: 'Email', value: project?.email || '(unknown)' },
              { label: 'Stripe Session', value: session?.id || '(unknown)' },
              { label: 'Files', value: files?.length ? `${files.length} file(s)` : '0 files' }
            ],
            footer: 'This email was sent from the Stripe webhook after successful payment.'
          });

          const text = renderOwnerEmailText({
            title: 'Payment Received',
            rows: [
              { label: 'Project ID', value: projectId },
              { label: 'Service', value: serviceName },
              { label: 'Amount', value: amountUsd ? `$${amountUsd}` : '(unknown)' },
              { label: 'Customer', value: project?.customer_name || '(unknown)' },
              { label: 'Business', value: project?.business_name || '(none)' },
              { label: 'Email', value: project?.email || '(unknown)' },
              { label: 'Stripe Session', value: session?.id || '(unknown)' },
              { label: 'Files', value: files?.length ? `${files.length} file(s)` : '0 files' }
            ],
            footer: 'This email was sent from the Stripe webhook after successful payment.'
          });

          await sendOwnerEmail({
            subject: `Payment received: ${serviceName || 'service'}`,
            html,
            text,
            tags: [{ name: 'type', value: 'payment_received' }]
          });
        } catch (error) {
          // Best-effort; returning 500 would cause Stripe retries.
          // eslint-disable-next-line no-console
          console.error('[email] payment_received failed', error);
        }
      }
    }

    await markStripeEventProcessed(event.id);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to process webhook' });
  }

  return res.json({ received: true });
});

app.post('/api/projects', async (req, res) => {
  try {
    const { email, fullName, businessName, serviceName, projectInfo } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!fullName || typeof fullName !== 'string') {
      return res.status(400).json({ error: 'fullName is required' });
    }
    if (!serviceName || typeof serviceName !== 'string') {
      return res.status(400).json({ error: 'serviceName is required' });
    }
    const project = await createProject({
      email,
      fullName: fullName.trim(),
      businessName: typeof businessName === 'string' ? businessName.trim() : '',
      serviceName,
      projectInfo
    });

    try {
      const html = renderOwnerEmailHtml({
        title: 'New Booking Created',
        rows: [
          { label: 'Project ID', value: project.id },
          { label: 'Service', value: serviceName },
          { label: 'Name', value: fullName.trim() },
          { label: 'Business', value: (typeof businessName === 'string' && businessName.trim()) || '(none)' },
          { label: 'Email', value: email },
          { label: 'Project Info', value: projectInfo || '(none)' }
        ],
        footer: 'This email was sent when the booking form was submitted.'
      });
      const text = renderOwnerEmailText({
        title: 'New Booking Created',
        rows: [
          { label: 'Project ID', value: project.id },
          { label: 'Service', value: serviceName },
          { label: 'Name', value: fullName.trim() },
          { label: 'Business', value: (typeof businessName === 'string' && businessName.trim()) || '(none)' },
          { label: 'Email', value: email },
          { label: 'Project Info', value: projectInfo || '(none)' }
        ],
        footer: 'This email was sent when the booking form was submitted.'
      });

      await sendOwnerEmail({
        subject: `New booking: ${serviceName}`,
        html,
        text,
        tags: [{ name: 'type', value: 'booking_created' }]
      });
    } catch (error) {
      // Best-effort: don't block checkout if email fails.
      // eslint-disable-next-line no-console
      console.error('[email] booking_created failed', error);
    }

    return res.json({ projectId: project.id });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to create project' });
  }
});

app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const project = await getProjectById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'project not found' });
    }
    return res.json({ project });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch project' });
  }
});

app.post('/api/uploads/sign', async (req, res) => {
  try {
    const { projectId, originalName, contentType } = req.body || {};
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }
    if (!originalName || typeof originalName !== 'string') {
      return res.status(400).json({ error: 'originalName is required' });
    }
    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'project not found' });
    }
    const upload = await createSignedUpload({ projectId, originalName, contentType });
    return res.json({ upload });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to create upload URL' });
  }
});

app.post('/api/projects/:projectId/files', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'project not found' });
    }
    const { files } = req.body || {};
    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'files must be an array' });
    }
    const recorded = await recordProjectFiles(projectId, files);

    try {
      const fileLines = recorded.map((f) => `${f.original_name || '(file)'} (${f.size_bytes ?? 0} bytes)`).join('\n');
      const html = renderOwnerEmailHtml({
        title: 'Project Files Uploaded',
        rows: [
          { label: 'Project ID', value: projectId },
          { label: 'Service', value: project.service_name || project.serviceName || '' },
          { label: 'Count', value: String(recorded.length) },
          { label: 'Files', value: recorded.map((f) => f.original_name).filter(Boolean).join(', ') || '(none)' }
        ],
        footer: fileLines ? `Files:\n${fileLines}` : undefined
      });
      const text = renderOwnerEmailText({
        title: 'Project Files Uploaded',
        rows: [
          { label: 'Project ID', value: projectId },
          { label: 'Service', value: project.service_name || project.serviceName || '' },
          { label: 'Count', value: String(recorded.length) },
          { label: 'Files', value: recorded.map((f) => f.original_name).filter(Boolean).join(', ') || '(none)' }
        ],
        footer: fileLines ? `Files:\n${fileLines}` : undefined
      });
      await sendOwnerEmail({
        subject: `Files uploaded: ${project.service_name || project.serviceName || 'project'}`,
        html,
        text,
        tags: [{ name: 'type', value: 'files_uploaded' }]
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[email] files_uploaded failed', error);
    }

    return res.json({ files: recorded });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to record files' });
  }
});

app.post('/api/checkout/session', async (req, res) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(501).json({ error: 'Checkout is not configured on the server (missing STRIPE_SECRET_KEY)' });
    }

    const { projectId } = req.body || {};
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'project not found' });
    }

    const catalogItem = SERVICE_CATALOG[project.service_name || project.serviceName];
    if (!catalogItem) {
      return res.status(400).json({ error: `Unknown serviceName: ${project.service_name || project.serviceName}` });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const unitAmount = Math.round(catalogItem.amountUsd * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: projectId,
      customer_email: project.email,
      billing_address_collection: 'required',
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      metadata: {
        projectId,
        serviceName: project.service_name || project.serviceName
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: `${catalogItem.title} (4K)`,
              description: project.projectInfo || undefined,
              ...(STRIPE_TAX_CODE ? { tax_code: STRIPE_TAX_CODE } : {})
            }
          }
        }
      ],
      success_url: `${APP_URL}/confirmation?projectId=${encodeURIComponent(projectId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/${encodeURIComponent(project.service_name || project.serviceName)}`
    });

    await setStripeSession(projectId, { sessionId: session.id, paymentStatus: session.payment_status });
    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to create checkout session' });
  }
});

app.get('/api/checkout/session-status', async (req, res) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(501).json({ error: 'Checkout is not configured on the server (missing STRIPE_SECRET_KEY)' });
    }
    const sessionId = req.query.session_id;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const projectId = session.client_reference_id;
    if (session.payment_status === 'paid' && projectId) {
      await markPaid(projectId, { sessionId: session.id });
    }

    return res.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        client_reference_id: session.client_reference_id
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch session status' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`);
});
