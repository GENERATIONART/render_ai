import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { SERVICE_CATALOG } from './lib/catalog.js';
import { createProject, createSignedUpload, getProjectById, isStripeEventProcessed, listProjectFiles, markPaid, markStripeEventProcessed, recordProjectFiles, setStripeSession } from './lib/supabaseStore.js';
import { renderOwnerEmailHtml, renderOwnerEmailText, sendOwnerEmail } from './lib/email.js';

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
