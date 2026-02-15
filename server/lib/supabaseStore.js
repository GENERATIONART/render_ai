import crypto from 'node:crypto';
import { SERVICE_CATALOG } from './catalog.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

export const getStorageBucket = () => process.env.SUPABASE_STORAGE_BUCKET || 'project-files';

export const createProject = async ({ email, fullName, businessName, serviceName, projectInfo }) => {
  const supabase = getSupabaseAdmin();
  const catalogItem = SERVICE_CATALOG[serviceName];
  const amountCents = catalogItem ? Math.round(catalogItem.amountUsd * 100) : null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      email,
      customer_name: fullName || null,
      business_name: businessName || null,
      service_name: serviceName,
      project_info: projectInfo || null,
      status: 'created',
      updated_at: now,
      amount_cents: amountCents,
      currency: 'usd',
      payment_status: 'unpaid'
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return { id: data.id };
};

export const getProjectById = async (projectId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data || null;
};

export const recordProjectFiles = async (projectId, files) => {
  const supabase = getSupabaseAdmin();
  const rows = (files || []).map((file) => ({
    id: crypto.randomUUID(),
    project_id: projectId,
    bucket: file.bucket,
    path: file.path,
    original_name: file.originalName,
    content_type: file.contentType || null,
    size_bytes: typeof file.sizeBytes === 'number' ? file.sizeBytes : null
  }));
  if (rows.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from('project_files')
    .insert(rows)
    .select('id,bucket,path,original_name,content_type,size_bytes,created_at');
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const listProjectFiles = async (projectId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('project_files')
    .select('id,bucket,path,original_name,content_type,size_bytes,created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const createSignedUpload = async ({ projectId, originalName, contentType }) => {
  const supabase = getSupabaseAdmin();
  const bucket = getStorageBucket();

  const safeName = String(originalName || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const path = `${projectId}/${Date.now()}_${crypto.randomUUID()}_${safeName}`;

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.token) {
    throw new Error('Supabase did not return an upload token');
  }

  // Supabase SDK returns token + path; include signed URL when available.
  return {
    bucket,
    path: data?.path || path,
    token: data?.token,
    signedUrl: data?.signedUrl || data?.signedURL || data?.signed_url,
    contentType: contentType || null
  };
};

export const setStripeSession = async (projectId, { sessionId, paymentStatus }) => {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('projects')
    .update({
      updated_at: now,
      checkout_session_id: sessionId,
      payment_status: paymentStatus || 'unpaid'
    })
    .eq('id', projectId);
  if (error) {
    throw new Error(error.message);
  }
};

export const markPaid = async (projectId, { sessionId } = {}) => {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('projects')
    .update({
      updated_at: now,
      status: 'paid',
      payment_status: 'paid',
      ...(sessionId ? { checkout_session_id: sessionId } : {})
    })
    .eq('id', projectId);
  if (error) {
    throw new Error(error.message);
  }
};

export const isStripeEventProcessed = async (eventId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return !!data;
};

export const markStripeEventProcessed = async (eventId) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: eventId });
  if (error) {
    // If duplicate, treat as already processed.
    if (String(error.code || '').toLowerCase() === '23505') {
      return;
    }
    throw new Error(error.message);
  }
};
