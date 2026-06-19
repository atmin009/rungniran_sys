import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { isMockMode } from './repo.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL = '7d';
const SALE_TTL = '365d'; // remembered on the device; invalidated only when the PIN changes
const DEFAULT_PIN = '1234';
const PIN_KEY = 'sale_pin_hash';
const PIN_VER_KEY = 'sale_pin_ver';

// In-memory copy of the current PIN version. Sale tokens carry the version they
// were issued with; changing the PIN bumps this value so every old token becomes
// invalid and all sale devices must re-enter the new PIN.
let salePinVersion = 0;
export const getSalePinVersion = () => salePinVersion;

async function loadPinVersion() {
  if (isMockMode()) { salePinVersion = 0; return; }
  const [r] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [PIN_VER_KEY]);
  salePinVersion = r.length ? Number(r[0].setting_value) : 0;
}

// Seed default accounts + sale PIN if missing.
export async function ensureSeed() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users');
    if (rows[0].n === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      const staffHash = await bcrypt.hash('sale123', 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?), (?,?,?,?)',
        ['admin', adminHash, 'ผู้ดูแลระบบ', 'admin',
          'sale', staffHash, 'พนักงานขาย', 'staff'],
      );
      console.log('Seeded users: admin/admin123 (admin), sale/sale123 (staff)');
    }
    const [pin] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [PIN_KEY]);
    if (!pin.length) {
      const hash = await bcrypt.hash(DEFAULT_PIN, 10);
      await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?,?)', [PIN_KEY, hash]);
      console.log(`Seeded sale PIN (default: ${DEFAULT_PIN})`);
    }
    const [ver] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [PIN_VER_KEY]);
    if (!ver.length) {
      await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?,?)', [PIN_VER_KEY, '1']);
    }
    await loadPinVersion();
  } catch (err) {
    console.warn('ensureSeed skipped:', err.code || err.message);
  }
}

// ---------------- staff/admin login ----------------
export async function login(username, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows.length) return null;
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const payload = { id: user.id, username: user.username, name: user.name, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
  return { token, user: payload };
}

// ---------------- sale PIN ----------------
export async function verifyPin(pin) {
  if (isMockMode()) return String(pin) === DEFAULT_PIN;
  const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [PIN_KEY]);
  const hash = rows.length ? rows[0].setting_value : null;
  if (!hash) return String(pin) === DEFAULT_PIN;
  return bcrypt.compare(String(pin), hash);
}

export function issueSaleToken() {
  return jwt.sign({ role: 'sale', pv: salePinVersion }, JWT_SECRET, { expiresIn: SALE_TTL });
}

export async function setPin(newPin) {
  if (isMockMode()) {
    const e = new Error('การเปลี่ยน PIN ต้องเชื่อมต่อฐานข้อมูล');
    e.status = 503; throw e;
  }
  if (!/^\d{4,8}$/.test(String(newPin))) {
    const e = new Error('PIN ต้องเป็นตัวเลข 4-8 หลัก');
    e.status = 400; throw e;
  }
  const hash = await bcrypt.hash(String(newPin), 10);
  await pool.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [PIN_KEY, hash, hash]);
  // bump the version so all currently-issued sale tokens are invalidated
  salePinVersion = Date.now();
  await pool.query(
    'INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [PIN_VER_KEY, String(salePinVersion), String(salePinVersion)]);
}

// ---------------- middleware ----------------
function readToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// any valid token (sale, staff, admin)
export function requireAuth(req, res, next) {
  const user = readToken(req);
  if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  if (user.role === 'sale' && Number(user.pv) !== salePinVersion) {
    return res.status(401).json({ error: 'PIN มีการเปลี่ยนแปลง กรุณากรอก PIN ใหม่' });
  }
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const user = readToken(req);
    if (!user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงส่วนนี้' });
    req.user = user;
    next();
  };
}

export const requireStaff = requireRole('admin', 'staff');
export const requireAdmin = requireRole('admin');
