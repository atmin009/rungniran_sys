import { pool } from './db.js';
import { isMockMode } from './repo.js';

let ready = false;

// Create the table on existing databases too (so we don't need a full re-seed).
export async function ensureAuditTable() {
  if (isMockMode()) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          BIGINT AUTO_INCREMENT PRIMARY KEY,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actor_role  VARCHAR(20),
        actor_id    INT,
        actor_name  VARCHAR(100),
        action      VARCHAR(60) NOT NULL,
        entity      VARCHAR(40),
        entity_id   VARCHAR(40),
        method      VARCHAR(8),
        path        VARCHAR(255),
        status      INT,
        ip          VARCHAR(64),
        user_agent  VARCHAR(255),
        detail      JSON,
        INDEX idx_log_created (created_at),
        INDEX idx_log_actor (actor_name),
        INDEX idx_log_action (action),
        INDEX idx_log_role (actor_role),
        INDEX idx_log_ip (ip)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    ready = true;
  } catch (err) {
    console.warn('ensureAuditTable skipped:', err.code || err.message);
  }
}

// Real client IP (behind nginx -> X-Real-IP / X-Forwarded-For).
export function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  let ip = req.headers['x-real-ip'] || xff || req.ip || req.socket?.remoteAddress || '';
  ip = String(ip).replace(/^::ffff:/, ''); // unwrap IPv4-mapped IPv6
  return ip || null;
}

const SENSITIVE = new Set(['password', 'pin', 'newPin', 'newpin', 'password_hash', 'token']);

// Shrink request bodies: mask secrets, collapse big arrays, truncate long strings.
function summarize(v, depth = 0) {
  if (v == null) return v;
  if (Array.isArray(v)) {
    if (v.length > 6 || depth >= 2) return `[${v.length} รายการ]`;
    return v.map((x) => summarize(x, depth + 1));
  }
  if (typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = SENSITIVE.has(k) ? '***' : summarize(val, depth + 1);
    }
    return out;
  }
  if (typeof v === 'string' && v.length > 300) return `${v.slice(0, 300)}…`;
  return v;
}

// Fire-and-forget: never block or fail the request because of logging.
export function recordAudit(entry = {}) {
  if (isMockMode() || !ready) return;
  const e = entry;
  pool.query(
    `INSERT INTO audit_logs
       (actor_role, actor_id, actor_name, action, entity, entity_id, method, path, status, ip, user_agent, detail)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      e.actorRole || null,
      e.actorId || null,
      e.actorName || null,
      e.action || 'unknown',
      e.entity || null,
      e.entityId != null ? String(e.entityId).slice(0, 40) : null,
      e.method || null,
      e.path ? String(e.path).slice(0, 255) : null,
      e.status || null,
      e.ip || null,
      e.userAgent ? String(e.userAgent).slice(0, 255) : null,
      e.detail != null ? JSON.stringify(summarize(e.detail)) : null,
    ],
  ).catch((err) => console.warn('audit insert failed:', err.code || err.message));
}

const VERB = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };

// Middleware for the admin router: log every write (POST/PUT/PATCH/DELETE) after it finishes.
export function auditAdmin(req, res, next) {
  const verb = VERB[req.method];
  if (!verb) return next(); // skip reads
  const body = req.body && Object.keys(req.body).length ? req.body : undefined;
  res.on('finish', () => {
    const seg = req.path.replace(/^\//, '').split('/');
    const entity = seg[0] || 'admin';
    const idSeg = seg[1] || null;
    const entityId = /^\d+$/.test(idSeg || '') ? idSeg : null;
    let action = `${entity}.${verb}`;
    if (entity === 'settings' && idSeg === 'pin') action = 'pin.change';
    else if (entity === 'uploads') action = 'upload';
    else if (entity === 'import') action = 'import';
    recordAudit({
      actorRole: req.user?.role,
      actorId: req.user?.id,
      actorName: req.user?.name || req.user?.username,
      action,
      entity,
      entityId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      detail: body,
    });
  });
  next();
}
