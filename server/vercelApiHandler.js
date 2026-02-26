import crypto from 'node:crypto';
import Stripe from 'stripe';
import { SERVICE_CATALOG } from './lib/catalog.js';
import {
  createProject,
  createSignedUpload,
  getProjectById,
  isStripeEventProcessed,
  listProjectFiles,
  markPaid,
  markStripeEventProcessed,
  recordProjectFiles,
  setStripeSession
} from './lib/supabaseStore.js';
import { getSupabaseAdmin } from './lib/supabaseAdmin.js';
import { renderOwnerEmailHtml, renderOwnerEmailText, sendOwnerEmail } from './lib/email.js';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

const readJsonBody = async (req) => {
  const raw = await readRawBody(req);
  if (!raw || raw.length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    return null;
  }
};

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

const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

const makeSessionToken = (payload, secret) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
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
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
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

const requireAdmin = (req) => {
  const { sessionSecret, adminEmail } = adminConfig();
  if (!sessionSecret) {
    return { ok: false, status: 501, error: 'Admin auth is not configured (missing ADMIN_SESSION_SECRET)' };
  }
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifySessionToken(cookies.admin_session, sessionSecret);
  if (!payload) {
    return { ok: false, status: 401, error: 'Not authenticated' };
  }
  if (String(payload.email).toLowerCase() !== adminEmail) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  return { ok: true, email: payload.email };
};

const APP_URL = process.env.APP_URL || '';
const STRIPE_TAX_CODE = process.env.STRIPE_TAX_CODE || '';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname?.startsWith('/api') ? url.pathname : `/api${url.pathname?.startsWith('/') ? '' : '/'}${url.pathname || ''}`;
  const parts = pathname.split('/').filter(Boolean); // e.g. ['api','projects',...]

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    json(res, 200, { ok: true });
    return;
  }

  // Admin auth/session
  if (pathname === '/api/admin/session' && req.method === 'GET') {
    const { sessionSecret, adminEmail } = adminConfig();
    if (!sessionSecret) {
      json(res, 200, { authenticated: false });
      return;
    }
    const cookies = parseCookies(req.headers.cookie);
    const payload = verifySessionToken(cookies.admin_session, sessionSecret);
    if (!payload || String(payload.email).toLowerCase() !== adminEmail) {
      json(res, 200, { authenticated: false });
      return;
    }
    json(res, 200, { authenticated: true, email: payload.email });
    return;
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const { adminEmail, adminPassword, sessionSecret } = adminConfig();
    if (!sessionSecret) {
      json(res, 501, { error: 'Admin auth is not configured (missing ADMIN_SESSION_SECRET)' });
      return;
    }
    if (!adminPassword) {
      json(res, 501, { error: 'Admin auth is not configured (missing ADMIN_PASSWORD)' });
      return;
    }
    const body = await readJsonBody(req);
    if (!body) {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }
    const { email, password } = body;
    if (!email || !password) {
      json(res, 400, { error: 'email and password are required' });
      return;
    }
    if (String(email).toLowerCase() !== adminEmail) {
      json(res, 403, { error: 'Forbidden' });
      return;
    }
    const pass = String(password);
    if (pass.length !== adminPassword.length || !crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(adminPassword))) {
      json(res, 401, { error: 'Invalid credentials' });
      return;
    }
    const token = makeSessionToken({ email: adminEmail, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }, sessionSecret);
    setAdminCookie(res, token);
    json(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    clearAdminCookie(res);
    json(res, 200, { ok: true });
    return;
  }

  // Admin content APIs (Supabase service role)
  if (pathname === '/api/admin/portfolio' && (req.method === 'GET' || req.method === 'POST')) {
    const auth = requireAdmin(req);
    if (!auth.ok) {
      json(res, auth.status, { error: auth.error });
      return;
    }
    try {
      const supabase = getSupabaseAdmin();
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) return json(res, 500, { error: error.message });
        return json(res, 200, { items: data || [] });
      }

      const body = await readJsonBody(req);
      if (!body) return json(res, 400, { error: 'Invalid JSON body' });
      const row = body;
      const payload = {
        published: !!row.published,
        sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
        slug: (row.slug || '').trim(),
        title: (row.title || '').trim(),
        tag: (row.tag || '').trim() || null,
        location: (row.location || '').trim() || null,
        render_time: (row.render_time || '').trim() || null,
        image_url: (row.image_url || '').trim() || null,
        images: Array.isArray(row.images) ? row.images : [],
        brief: (row.brief || '').trim() || null,
        scope: (row.scope || '').trim() || null,
        deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
        tools: Array.isArray(row.tools) ? row.tools : [],
        timeline: Array.isArray(row.timeline) ? row.timeline : [],
        updated_at: new Date().toISOString()
      };
      if (!payload.slug || !payload.title) {
        return json(res, 400, { error: 'slug and title are required' });
      }
      const id = row.id || null;
      const result = id
        ? await supabase.from('portfolio_items').update(payload).eq('id', id).select('*').single()
        : await supabase.from('portfolio_items').insert(payload).select('*').single();
      if (result.error) return json(res, 500, { error: result.error.message });
      return json(res, 200, { item: result.data });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Admin portfolio failed' });
    }
  }

  if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'portfolio' && parts[3] && req.method === 'DELETE') {
    const auth = requireAdmin(req);
    if (!auth.ok) {
      json(res, auth.status, { error: auth.error });
      return;
    }
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from('portfolio_items').delete().eq('id', parts[3]);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Delete failed' });
    }
  }

  if (pathname.startsWith('/api/admin/site-copy') && (req.method === 'GET' || req.method === 'POST')) {
    const auth = requireAdmin(req);
    if (!auth.ok) {
      json(res, auth.status, { error: auth.error });
      return;
    }
    try {
      const supabase = getSupabaseAdmin();
      if (req.method === 'GET') {
        const keys = String(url.searchParams.get('keys') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const query = supabase.from('site_copy').select('key,value');
        const { data, error } = keys.length ? await query.in('key', keys) : await query;
        if (error) return json(res, 500, { error: error.message });
        return json(res, 200, { rows: data || [] });
      }

      const body = await readJsonBody(req);
      if (!body) return json(res, 400, { error: 'Invalid JSON body' });
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const payload = rows
        .map((r) => ({ key: String(r.key || '').trim(), value: String(r.value ?? ''), updated_at: new Date().toISOString() }))
        .filter((r) => r.key);
      if (payload.length === 0) return json(res, 400, { error: 'rows are required' });
      const { error } = await supabase.from('site_copy').upsert(payload);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Site copy failed' });
    }
  }

  if (pathname === '/api/admin/site-media/sign' && req.method === 'POST') {
    const auth = requireAdmin(req);
    if (!auth.ok) {
      json(res, auth.status, { error: auth.error });
      return;
    }
    try {
      const body = await readJsonBody(req);
      if (!body) return json(res, 400, { error: 'Invalid JSON body' });
      const { originalName } = body;
      if (!originalName || typeof originalName !== 'string') {
        return json(res, 400, { error: 'originalName is required' });
      }
      const supabase = getSupabaseAdmin();
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const path = `site-media/${Date.now()}_${crypto.randomUUID()}_${safeName}`;
      const { data, error } = await supabase.storage.from('site-media').createSignedUploadUrl(path, { upsert: false });
      if (error) return json(res, 500, { error: error.message });
      if (!data?.token) return json(res, 500, { error: 'Supabase did not return an upload token' });
      return json(res, 200, { upload: { bucket: 'site-media', path: data.path || path, token: data.token } });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to sign media upload' });
    }
  }

  // Public APIs
  if (pathname === '/api/projects' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (!body) return json(res, 400, { error: 'Invalid JSON body' });
    const { email, fullName, businessName, serviceName, projectInfo } = body;
    if (!email || typeof email !== 'string') return json(res, 400, { error: 'email is required' });
    if (!fullName || typeof fullName !== 'string') return json(res, 400, { error: 'fullName is required' });
    if (!serviceName || typeof serviceName !== 'string') return json(res, 400, { error: 'serviceName is required' });

    try {
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
        await sendOwnerEmail({ subject: `New booking: ${serviceName}`, html, text, tags: [{ name: 'type', value: 'booking_created' }] });
      } catch {
        // best effort
      }

      return json(res, 200, { projectId: project.id, project });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to create project' });
    }
  }

  if (pathname === '/api/inquiry' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (!body) return json(res, 400, { error: 'Invalid JSON body' });
    const { email, fullName, businessName, projectType, estimatedBudget } = body;
    if (!email || typeof email !== 'string') return json(res, 400, { error: 'email is required' });
    if (!fullName || typeof fullName !== 'string') return json(res, 400, { error: 'fullName is required' });
    if (!projectType || typeof projectType !== 'string') return json(res, 400, { error: 'projectType is required' });
    if (!estimatedBudget || typeof estimatedBudget !== 'string') return json(res, 400, { error: 'estimatedBudget is required' });

    try {
      const html = renderOwnerEmailHtml({
        title: 'New Inquiry',
        rows: [
          { label: 'Name', value: fullName.trim() },
          { label: 'Business', value: (typeof businessName === 'string' && businessName.trim()) || '(none)' },
          { label: 'Email', value: email.trim() },
          { label: 'Project Type', value: projectType.trim() },
          { label: 'Estimated Budget', value: estimatedBudget.trim() }
        ],
        footer: 'This email was sent when the inquiry form was submitted.'
      });
      const text = renderOwnerEmailText({
        title: 'New Inquiry',
        rows: [
          { label: 'Name', value: fullName.trim() },
          { label: 'Business', value: (typeof businessName === 'string' && businessName.trim()) || '(none)' },
          { label: 'Email', value: email.trim() },
          { label: 'Project Type', value: projectType.trim() },
          { label: 'Estimated Budget', value: estimatedBudget.trim() }
        ],
        footer: 'This email was sent when the inquiry form was submitted.'
      });
      const result = await sendOwnerEmail({
        subject: 'New inquiry received',
        html,
        text,
        tags: [{ name: 'type', value: 'inquiry' }]
      });
      if (result?.skipped) {
        return json(res, 501, { error: result.reason || 'Email not configured' });
      }
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to send inquiry' });
    }
  }

  if (parts[0] === 'api' && parts[1] === 'projects' && parts[2] && !parts[3] && req.method === 'GET') {
    try {
      const project = await getProjectById(parts[2]);
      if (!project) return json(res, 404, { error: 'project not found' });
      return json(res, 200, { project });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to fetch project' });
    }
  }

  if (pathname === '/api/uploads/sign' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (!body) return json(res, 400, { error: 'Invalid JSON body' });
    const { projectId, originalName, contentType } = body;
    if (!projectId || typeof projectId !== 'string') return json(res, 400, { error: 'projectId is required' });
    if (!originalName || typeof originalName !== 'string') return json(res, 400, { error: 'originalName is required' });
    try {
      const project = await getProjectById(projectId);
      if (!project) return json(res, 404, { error: 'project not found' });
      const upload = await createSignedUpload({ projectId, originalName, contentType });
      return json(res, 200, { upload });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to create upload URL' });
    }
  }

  if (parts[0] === 'api' && parts[1] === 'projects' && parts[2] && parts[3] === 'files' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (!body) return json(res, 400, { error: 'Invalid JSON body' });
    const files = body.files;
    if (!Array.isArray(files)) return json(res, 400, { error: 'files must be an array' });
    try {
      const projectId = parts[2];
      const project = await getProjectById(projectId);
      if (!project) return json(res, 404, { error: 'project not found' });
      const recorded = await recordProjectFiles(projectId, files);

      try {
        const supabase = getSupabaseAdmin();
        const fileRows = await Promise.all(
          recorded.map(async (f) => {
            let href;
            try {
              const { data } = await supabase.storage.from(f.bucket).createSignedUrl(f.path, 60 * 60 * 24 * 7);
              href = data?.signedUrl;
            } catch { /* no link */ }
            return { label: f.original_name || 'File', value: f.original_name || 'Download', href };
          })
        );
        const baseRows = [
          { label: 'Project ID', value: projectId },
          { label: 'Service', value: project.service_name || project.serviceName || '' },
          { label: 'Count', value: String(recorded.length) }
        ];
        const html = renderOwnerEmailHtml({ title: 'Project Files Uploaded', rows: [...baseRows, ...fileRows] });
        const text = renderOwnerEmailText({ title: 'Project Files Uploaded', rows: [...baseRows, ...fileRows] });
        await sendOwnerEmail({ subject: `Files uploaded: ${project.service_name || project.serviceName || 'project'}`, html, text, tags: [{ name: 'type', value: 'files_uploaded' }] });
      } catch {
        // best effort
      }

      return json(res, 200, { files: recorded });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to record files' });
    }
  }

  if (pathname === '/api/checkout/session' && req.method === 'POST') {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return json(res, 501, { error: 'Checkout is not configured on the server (missing STRIPE_SECRET_KEY)' });
    if (!APP_URL) return json(res, 501, { error: 'Checkout is not configured on the server (missing APP_URL)' });

    const body = await readJsonBody(req);
    if (!body) return json(res, 400, { error: 'Invalid JSON body' });
    const { projectId } = body;
    if (!projectId || typeof projectId !== 'string') return json(res, 400, { error: 'projectId is required' });
    try {
      const project = await getProjectById(projectId);
      if (!project) return json(res, 404, { error: 'project not found' });
      const serviceName = project.service_name || project.serviceName;
      const catalogItem = SERVICE_CATALOG[serviceName];
      if (!catalogItem) return json(res, 400, { error: `Unknown serviceName: ${serviceName}` });

      let amountUsd = catalogItem.amountUsd;
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.from('site_copy').select('value').eq('key', `service.price.${serviceName}`).single();
        if (data?.value) {
          const parsed = parseFloat(data.value);
          if (!isNaN(parsed) && parsed > 0) amountUsd = parsed;
        }
      } catch { /* use catalog default */ }

      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
      const unitAmount = Math.round(amountUsd * 100);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: projectId,
        customer_email: project.email,
        metadata: { projectId, serviceName },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: unitAmount,
              product_data: {
                name: `${catalogItem.title} (4K)`,
                description: project.project_info || project.projectInfo || undefined,
                ...(STRIPE_TAX_CODE ? { tax_code: STRIPE_TAX_CODE } : {})
              }
            }
          }
        ],
        success_url: `${APP_URL}/confirmation?projectId=${encodeURIComponent(projectId)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/${encodeURIComponent(serviceName)}`
      });

      await setStripeSession(projectId, { sessionId: session.id, paymentStatus: session.payment_status });
      return json(res, 200, { url: session.url });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to create checkout session' });
    }
  }

  if (pathname === '/api/checkout/session-status' && req.method === 'GET') {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return json(res, 501, { error: 'Checkout is not configured on the server (missing STRIPE_SECRET_KEY)' });
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return json(res, 400, { error: 'session_id is required' });
    try {
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const projectId = session.client_reference_id;
      if (session.payment_status === 'paid' && projectId) {
        await markPaid(projectId, { sessionId: session.id });
      }
      return json(res, 200, {
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          client_reference_id: session.client_reference_id
        }
      });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to fetch session status' });
    }
  }

  if (pathname === '/api/webhooks/stripe' && req.method === 'POST') {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecretKey || !webhookSecret) {
      return json(res, 501, { error: 'Webhooks are not configured on the server (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)' });
    }
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return json(res, 400, { error: 'Missing Stripe-Signature header' });
    }
    const rawBody = await readRawBody(req);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (e) {
      return json(res, 400, { error: `Webhook signature verification failed: ${e?.message || 'invalid signature'}` });
    }

    try {
      if (await isStripeEventProcessed(event.id)) {
        return json(res, 200, { received: true, duplicate: true });
      }

      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded' || event.type === 'checkout.session.async_payment_failed') {
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
            await sendOwnerEmail({ subject: `Payment received: ${serviceName || 'service'}`, html, text, tags: [{ name: 'type', value: 'payment_received' }] });
          } catch {
            // best effort
          }
        }
      }

      await markStripeEventProcessed(event.id);
      return json(res, 200, { received: true });
    } catch (e) {
      return json(res, 500, { error: e?.message || 'Failed to process webhook' });
    }
  }

  json(res, 404, { error: 'Not found' });
}
