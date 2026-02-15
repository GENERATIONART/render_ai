import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const dataDir = path.join(process.cwd(), 'server', 'data');
const dbPath = path.join(dataDir, 'projects.json');

const ensureDataDir = async () => {
  await fs.mkdir(dataDir, { recursive: true });
};

const readDb = async () => {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(dbPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
      return parsed;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
  return { projects: [] };
};

const writeDb = async (db) => {
  await ensureDataDir();
  const tmpPath = `${dbPath}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmpPath, dbPath);
};

export const createProject = async ({ email, serviceName, projectInfo }) => {
  const db = await readDb();
  const now = new Date().toISOString();
  const project = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'created',
    email,
    serviceName,
    projectInfo: projectInfo || '',
    files: [],
    payment: { provider: 'stripe', status: 'unpaid' }
  };
  db.projects.unshift(project);
  await writeDb(db);
  return project;
};

export const getProjectById = async (projectId) => {
  const db = await readDb();
  return db.projects.find((p) => p.id === projectId) || null;
};

export const addFilesToProject = async (projectId, files) => {
  const db = await readDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    return null;
  }
  const now = new Date().toISOString();
  project.updatedAt = now;
  project.files.push(...files);
  await writeDb(db);
  return project;
};

export const setStripeSession = async (projectId, { sessionId, sessionUrl }) => {
  const db = await readDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    return null;
  }
  const now = new Date().toISOString();
  project.updatedAt = now;
  project.payment = {
    provider: 'stripe',
    status: project.payment?.status || 'unpaid',
    stripe: { sessionId, sessionUrl }
  };
  await writeDb(db);
  return project;
};

export const markPaid = async (projectId, { sessionId } = {}) => {
  const db = await readDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    return null;
  }
  const now = new Date().toISOString();
  project.updatedAt = now;
  project.payment = {
    provider: 'stripe',
    status: 'paid',
    stripe: { ...(project.payment?.stripe || {}), sessionId: sessionId || project.payment?.stripe?.sessionId }
  };
  project.status = 'paid';
  await writeDb(db);
  return project;
};

