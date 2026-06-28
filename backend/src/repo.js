import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { mockCars, mockBranches, mockDealers } from './data.js';

let mockMode = false;
export const setMockMode = (v) => { mockMode = v; };
export const isMockMode = () => mockMode;

export const CAR_TYPES = [
  { value: 'sedan', label: 'รถเก๋ง' },
  { value: 'eco', label: 'อีโคคาร์' },
  { value: 'hatchback', label: 'รถเก๋ง 5 ประตู' },
  { value: 'suv', label: 'รถ SUV' },
  { value: 'ppv', label: 'รถ PPV' },
  { value: 'pickup4', label: 'กระบะ 4 ประตู' },
  { value: 'pickupcab', label: 'กระบะแค็บ' },
  { value: 'pickup', label: 'กระบะตอนเดียว' },
  { value: 'van', label: 'รถตู้' },
  { value: 'mpv', label: 'รถ MPV' },
  { value: 'sport', label: 'รถสปอร์ต' },
];
export const STATUSES = [
  { value: 'available', label: 'พร้อมจำหน่าย' },
  { value: 'incoming', label: 'กำลังเข้า' },
  { value: 'reserved', label: 'ติดจอง' },
  { value: 'sold', label: 'ขายแล้ว' },
];
export const TRANSMISSIONS = [
  { value: 'auto', label: 'อัตโนมัติ' },
  { value: 'manual', label: 'ธรรมดา' },
];
export const DRIVETRAINS = [
  { value: '2wd', label: '2WD' },
  { value: '4wd', label: '4WD' },
];
export const FUELS = [
  { value: 'gasoline', label: 'เบนซิน' },
  { value: 'diesel', label: 'ดีเซล' },
  { value: 'hybrid', label: 'ไฮบริด' },
  { value: 'ev', label: 'ไฟฟ้า' },
];

const SORT_MAP = {
  recommended: 'c.featured DESC, c.created_at DESC',
  newest: 'c.created_at DESC',
  price_asc: 'c.price ASC',
  price_desc: 'c.price DESC',
  year_desc: 'c.model_year DESC',
  mileage_asc: 'c.mileage ASC',
};

const CAR_SELECT = `
  SELECT
    c.id, c.brand, c.model, c.car_type, c.model_year, c.price,
    c.transmission, c.drivetrain, c.fuel_type, c.mileage, c.color, c.color_code,
    c.license_plate, c.status, c.featured, c.engine, c.seats, c.doors,
    c.purchase_date, c.registration_date, c.description, c.equipment, c.images,
    b.id AS branch_id, b.name AS branch_name, b.province AS branch_province,
    d.id AS dealer_id, d.name AS dealer_name, d.phone AS dealer_phone
  FROM cars c
  JOIN branches b ON c.branch_id = b.id
  JOIN dealers  d ON c.dealer_id = d.id
`;

function shapeRow(row) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    carType: row.car_type,
    modelYear: row.model_year,
    price: Number(row.price),
    transmission: row.transmission,
    drivetrain: row.drivetrain,
    fuelType: row.fuel_type,
    mileage: row.mileage,
    color: row.color,
    colorCode: row.color_code,
    licensePlate: row.license_plate,
    status: row.status,
    featured: !!row.featured,
    engine: row.engine,
    seats: row.seats,
    doors: row.doors,
    purchaseDate: row.purchase_date,
    registrationDate: row.registration_date,
    description: row.description,
    equipment: Array.isArray(row.equipment) ? row.equipment : JSON.parse(row.equipment || '[]'),
    images: Array.isArray(row.images) ? row.images : JSON.parse(row.images || '[]'),
    branch: { id: row.branch_id, name: row.branch_name, province: row.branch_province },
    dealer: { id: row.dealer_id, name: row.dealer_name, phone: row.dealer_phone },
  };
}

// ---------------- list ----------------
export async function listCars(params) {
  const {
    type, brand, status, transmission, drivetrain, branch, dealer,
    minPrice, maxPrice, featured, q, sort = 'recommended', page = 1, limit = 12,
  } = params;
  const offset = (page - 1) * limit;

  if (mockMode) return listMock(params, offset);

  const where = [];
  const args = [];
  if (type)         { where.push('c.car_type = ?');     args.push(type); }
  if (brand)        { where.push('c.brand = ?');        args.push(brand); }
  if (status)       { where.push('c.status = ?');       args.push(status); }
  if (transmission) { where.push('c.transmission = ?'); args.push(transmission); }
  if (drivetrain)   { where.push('c.drivetrain = ?');   args.push(drivetrain); }
  if (branch)       { where.push('c.branch_id = ?');    args.push(branch); }
  if (dealer)       { where.push('c.dealer_id = ?');    args.push(dealer); }
  if (minPrice)     { where.push('c.price >= ?');       args.push(minPrice); }
  if (maxPrice)     { where.push('c.price <= ?');       args.push(maxPrice); }
  if (featured)     { where.push('c.featured = 1'); }
  if (q) {
    where.push('(c.brand LIKE ? OR c.model LIKE ? OR c.license_plate LIKE ?)');
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = SORT_MAP[sort] || SORT_MAP.recommended;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM cars c ${whereSql}`, args);
  const total = countRows[0].total;
  const [rows] = await pool.query(
    `${CAR_SELECT} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...args, limit, offset],
  );
  return {
    data: rows.map(shapeRow),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------------- faceted counts (contextual to current filters) ----------------
function facetWhere(f, exclude) {
  const where = [];
  const args = [];
  const eq = (key, sql, val) => {
    if (key !== exclude && val != null && val !== '') { where.push(sql); args.push(val); }
  };
  eq('type', 'c.car_type = ?', f.type);
  eq('brand', 'c.brand = ?', f.brand);
  eq('status', 'c.status = ?', f.status);
  eq('transmission', 'c.transmission = ?', f.transmission);
  eq('drivetrain', 'c.drivetrain = ?', f.drivetrain);
  eq('branch', 'c.branch_id = ?', f.branch);
  eq('dealer', 'c.dealer_id = ?', f.dealer);
  if (exclude !== 'price') {
    if (f.minPrice) { where.push('c.price >= ?'); args.push(f.minPrice); }
    if (f.maxPrice) { where.push('c.price <= ?'); args.push(f.maxPrice); }
  }
  if (exclude !== 'featured' && (f.featured === '1' || f.featured === 1 || f.featured === true)) {
    where.push('c.featured = 1');
  }
  if (f.q) {
    where.push('(c.brand LIKE ? OR c.model LIKE ? OR c.license_plate LIKE ?)');
    const l = `%${f.q}%`; args.push(l, l, l);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', args };
}

async function groupMap(col, w) {
  const [rows] = await pool.query(`SELECT ${col} AS k, COUNT(*) AS n FROM cars c ${w.sql} GROUP BY ${col}`, w.args);
  const m = {};
  rows.forEach((r) => { if (r.k != null) m[r.k] = Number(r.n); });
  return m;
}

export async function getFacets(filters = {}) {
  if (mockMode) return null;
  const [carTypes, brands, statuses, transmissions, drivetrains, branches, dealers] = await Promise.all([
    groupMap('c.car_type', facetWhere(filters, 'type')),
    groupMap('c.brand', facetWhere(filters, 'brand')),
    groupMap('c.status', facetWhere(filters, 'status')),
    groupMap('c.transmission', facetWhere(filters, 'transmission')),
    groupMap('c.drivetrain', facetWhere(filters, 'drivetrain')),
    groupMap('c.branch_id', facetWhere(filters, 'branch')),
    groupMap('c.dealer_id', facetWhere(filters, 'dealer')),
  ]);
  const fw = facetWhere(filters, 'featured');
  const [[fr]] = await pool.query(
    `SELECT COUNT(*) AS n FROM cars c ${fw.sql ? `${fw.sql} AND` : 'WHERE'} c.featured = 1`, fw.args);
  const tw = facetWhere(filters, null);
  const [[tr]] = await pool.query(`SELECT COUNT(*) AS n FROM cars c ${tw.sql}`, tw.args);
  return {
    carTypes, brands, statuses, transmissions, drivetrains, branches, dealers,
    featured: Number(fr.n), total: Number(tr.n),
  };
}

function listMock(params, offset) {
  const {
    type, brand, status, transmission, drivetrain, branch, dealer,
    minPrice, maxPrice, featured, q, sort = 'recommended', page = 1, limit = 12,
  } = params;
  let rows = [...mockCars];
  if (type)         rows = rows.filter((c) => c.carType === type);
  if (brand)        rows = rows.filter((c) => c.brand === brand);
  if (status)       rows = rows.filter((c) => c.status === status);
  if (transmission) rows = rows.filter((c) => c.transmission === transmission);
  if (drivetrain)   rows = rows.filter((c) => c.drivetrain === drivetrain);
  if (branch)       rows = rows.filter((c) => c._branchId === Number(branch));
  if (dealer)       rows = rows.filter((c) => c._dealerId === Number(dealer));
  if (minPrice)     rows = rows.filter((c) => c.price >= Number(minPrice));
  if (maxPrice)     rows = rows.filter((c) => c.price <= Number(maxPrice));
  if (featured)     rows = rows.filter((c) => c.featured);
  if (q) {
    const s = q.toLowerCase();
    rows = rows.filter((c) =>
      c.brand.toLowerCase().includes(s) ||
      c.model.toLowerCase().includes(s) ||
      c.licensePlate.toLowerCase().includes(s));
  }
  const sorters = {
    recommended: (a, b) => (b.featured - a.featured) || (b._order - a._order),
    newest: (a, b) => b._order - a._order,
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    year_desc: (a, b) => b.modelYear - a.modelYear,
    mileage_asc: (a, b) => a.mileage - b.mileage,
  };
  rows.sort(sorters[sort] || sorters.recommended);
  const total = rows.length;
  const paged = rows.slice(offset, offset + limit).map(stripMock);
  return { data: paged, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

const stripMock = ({ _branchId, _dealerId, _order, ...rest }) => rest;

// ---------------- detail ----------------
export async function getCar(id) {
  if (mockMode) {
    const c = mockCars.find((x) => x.id === Number(id));
    return c ? stripMock(c) : null;
  }
  const [rows] = await pool.query(`${CAR_SELECT} WHERE c.id = ?`, [id]);
  return rows.length ? shapeRow(rows[0]) : null;
}

// ---------------- filter meta ----------------
export async function getFilters() {
  const base = {
    statuses: STATUSES, transmissions: TRANSMISSIONS,
    drivetrains: DRIVETRAINS, fuels: FUELS,
  };
  if (mockMode) {
    const counts = {};
    mockCars.forEach((c) => { counts[c.brand] = (counts[c.brand] || 0) + 1; });
    const prices = mockCars.map((c) => c.price);
    return {
      ...base,
      carTypes: CAR_TYPES,
      brands: Object.keys(counts).sort().map((name) => ({ name, count: counts[name] })),
      branches: mockBranches,
      dealers: mockDealers,
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    };
  }
  const [brandRows] = await pool.query(`
    SELECT b.name, (SELECT COUNT(*) FROM cars c WHERE c.brand = b.name) AS count
    FROM brands b ORDER BY b.name`);
  const [typeRows] = await pool.query(`
    SELECT value, label, (SELECT COUNT(*) FROM cars c WHERE c.car_type = ct.value) AS count
    FROM car_types ct ORDER BY sort_order, id`);
  const [branches] = await pool.query('SELECT id, name, province FROM branches ORDER BY id');
  const [dealers] = await pool.query('SELECT id, name, phone FROM dealers ORDER BY id');
  const [priceRow] = await pool.query('SELECT MIN(price) AS minPrice, MAX(price) AS maxPrice FROM cars');
  return {
    ...base,
    carTypes: typeRows.length ? typeRows : CAR_TYPES,
    brands: brandRows.map((b) => ({ name: b.name, count: b.count })),
    branches,
    dealers,
    priceRange: {
      min: Number(priceRow[0].minPrice) || 0,
      max: Number(priceRow[0].maxPrice) || 0,
    },
  };
}

// ============================================================
//  ADMIN  (DB-only write operations)
// ============================================================
function assertDb() {
  if (mockMode) {
    const e = new Error('ระบบจัดการต้องเชื่อมต่อฐานข้อมูล (MySQL) — ขณะนี้ทำงานในโหมดข้อมูลตัวอย่าง');
    e.status = 503;
    throw e;
  }
}

const CAR_FIELDS = [
  'brand', 'model', 'car_type', 'model_year', 'price', 'transmission', 'drivetrain',
  'fuel_type', 'mileage', 'color', 'color_code', 'license_plate', 'status', 'featured',
  'engine', 'seats', 'doors', 'purchase_date', 'registration_date', 'branch_id', 'dealer_id',
  'description',
];

function carParams(b) {
  return {
    brand: b.brand, model: b.model, car_type: b.carType, model_year: b.modelYear,
    price: b.price, transmission: b.transmission, drivetrain: b.drivetrain,
    fuel_type: b.fuelType, mileage: b.mileage || 0, color: b.color || null,
    color_code: b.colorCode || null, license_plate: b.licensePlate, status: b.status || 'available',
    featured: b.featured ? 1 : 0, engine: b.engine || null, seats: b.seats || null,
    doors: b.doors || null, purchase_date: b.purchaseDate, registration_date: b.registrationDate || null,
    branch_id: b.branchId, dealer_id: b.dealerId, description: b.description || null,
  };
}

export async function createCar(body) {
  assertDb();
  const p = carParams(body);
  const cols = [...CAR_FIELDS, 'equipment', 'images'];
  const placeholders = cols.map(() => '?').join(',');
  const values = [
    ...CAR_FIELDS.map((f) => p[f]),
    JSON.stringify(body.equipment || []),
    JSON.stringify(body.images || []),
  ];
  const [res] = await pool.query(`INSERT INTO cars (${cols.join(',')}) VALUES (${placeholders})`, values);
  return getCar(res.insertId);
}

export async function updateCar(id, body) {
  assertDb();
  const p = carParams(body);
  const sets = [...CAR_FIELDS.map((f) => `${f} = ?`), 'equipment = ?', 'images = ?'];
  const values = [
    ...CAR_FIELDS.map((f) => p[f]),
    JSON.stringify(body.equipment || []),
    JSON.stringify(body.images || []),
    id,
  ];
  await pool.query(`UPDATE cars SET ${sets.join(', ')} WHERE id = ?`, values);
  return getCar(id);
}

export async function deleteCar(id) {
  assertDb();
  await pool.query('DELETE FROM cars WHERE id = ?', [id]);
}

// ---- generic master-data helpers ----
async function usageCount(field, value) {
  const [r] = await pool.query(`SELECT COUNT(*) AS n FROM cars WHERE ${field} = ?`, [value]);
  return r[0].n;
}

// Brands
export async function listBrands() {
  assertDb();
  const [rows] = await pool.query(`
    SELECT b.id, b.name, (SELECT COUNT(*) FROM cars c WHERE c.brand = b.name) AS count
    FROM brands b ORDER BY b.name`);
  return rows;
}
export async function createBrand(name) {
  assertDb();
  const [r] = await pool.query('INSERT INTO brands (name) VALUES (?)', [name]);
  return { id: r.insertId, name, count: 0 };
}
export async function ensureBrand(name) {
  assertDb();
  await pool.query('INSERT IGNORE INTO brands (name) VALUES (?)', [name]);
}
export async function updateBrand(id, name) {
  assertDb();
  const [old] = await pool.query('SELECT name FROM brands WHERE id = ?', [id]);
  if (!old.length) return null;
  await pool.query('UPDATE brands SET name = ? WHERE id = ?', [name, id]);
  await pool.query('UPDATE cars SET brand = ? WHERE brand = ?', [name, old[0].name]);
  return { id: Number(id), name };
}
export async function deleteBrand(id) {
  assertDb();
  const [row] = await pool.query('SELECT name FROM brands WHERE id = ?', [id]);
  if (!row.length) return;
  const n = await usageCount('brand', row[0].name);
  if (n > 0) { const e = new Error(`ลบไม่ได้ มีรถ ${n} คันใช้ยี่ห้อนี้อยู่`); e.status = 409; throw e; }
  await pool.query('DELETE FROM brands WHERE id = ?', [id]);
}

// Car types
export async function listCarTypes() {
  assertDb();
  const [rows] = await pool.query(`
    SELECT t.id, t.value, t.label, t.sort_order,
      (SELECT COUNT(*) FROM cars c WHERE c.car_type = t.value) AS count
    FROM car_types t ORDER BY t.sort_order, t.id`);
  return rows;
}
export async function createCarType({ value, label, sortOrder }) {
  assertDb();
  const [r] = await pool.query(
    'INSERT INTO car_types (value, label, sort_order) VALUES (?,?,?)',
    [value, label, sortOrder || 0]);
  return { id: r.insertId, value, label, sort_order: sortOrder || 0, count: 0 };
}
export async function updateCarType(id, { label, sortOrder }) {
  assertDb();
  await pool.query('UPDATE car_types SET label = ?, sort_order = ? WHERE id = ?',
    [label, sortOrder || 0, id]);
  return { id: Number(id), label };
}
export async function deleteCarType(id) {
  assertDb();
  const [row] = await pool.query('SELECT value FROM car_types WHERE id = ?', [id]);
  if (!row.length) return;
  const n = await usageCount('car_type', row[0].value);
  if (n > 0) { const e = new Error(`ลบไม่ได้ มีรถ ${n} คันใช้ประเภทนี้อยู่`); e.status = 409; throw e; }
  await pool.query('DELETE FROM car_types WHERE id = ?', [id]);
}

// Branches
export async function listBranchesAdmin() {
  assertDb();
  const [rows] = await pool.query(`
    SELECT b.id, b.name, b.province,
      (SELECT COUNT(*) FROM cars c WHERE c.branch_id = b.id) AS count
    FROM branches b ORDER BY b.id`);
  return rows;
}
export async function createBranch({ name, province }) {
  assertDb();
  const [r] = await pool.query('INSERT INTO branches (name, province) VALUES (?,?)', [name, province]);
  return { id: r.insertId, name, province, count: 0 };
}
export async function updateBranch(id, { name, province }) {
  assertDb();
  await pool.query('UPDATE branches SET name = ?, province = ? WHERE id = ?', [name, province, id]);
  return { id: Number(id), name, province };
}
export async function deleteBranch(id) {
  assertDb();
  const n = await usageCount('branch_id', id);
  if (n > 0) { const e = new Error(`ลบไม่ได้ มีรถ ${n} คันอยู่ในสาขานี้`); e.status = 409; throw e; }
  await pool.query('DELETE FROM branches WHERE id = ?', [id]);
}

// Dealers
export async function listDealersAdmin() {
  assertDb();
  const [rows] = await pool.query(`
    SELECT d.id, d.name, d.phone,
      (SELECT COUNT(*) FROM cars c WHERE c.dealer_id = d.id) AS count
    FROM dealers d ORDER BY d.id`);
  return rows;
}
export async function createDealer({ name, phone }) {
  assertDb();
  const [r] = await pool.query('INSERT INTO dealers (name, phone) VALUES (?,?)', [name, phone]);
  return { id: r.insertId, name, phone, count: 0 };
}
export async function updateDealer(id, { name, phone }) {
  assertDb();
  await pool.query('UPDATE dealers SET name = ?, phone = ? WHERE id = ?', [name, phone, id]);
  return { id: Number(id), name, phone };
}
export async function deleteDealer(id) {
  assertDb();
  const n = await usageCount('dealer_id', id);
  if (n > 0) { const e = new Error(`ลบไม่ได้ มีรถ ${n} คันผูกกับดีลเลอร์นี้`); e.status = 409; throw e; }
  await pool.query('DELETE FROM dealers WHERE id = ?', [id]);
}

// Stats
export async function getStats() {
  assertDb();
  const [[totals]] = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(price),0) AS value FROM cars');
  const [statusRows] = await pool.query('SELECT status, COUNT(*) AS n FROM cars GROUP BY status');
  const [featured] = await pool.query('SELECT COUNT(*) AS n FROM cars WHERE featured = 1');
  const [[counts]] = await pool.query(`
    SELECT (SELECT COUNT(*) FROM brands) AS brands,
           (SELECT COUNT(*) FROM car_types) AS carTypes,
           (SELECT COUNT(*) FROM branches) AS branches,
           (SELECT COUNT(*) FROM dealers) AS dealers`);
  const byStatus = {};
  statusRows.forEach((r) => { byStatus[r.status] = r.n; });
  const [recent] = await pool.query(`${CAR_SELECT} ORDER BY c.created_at DESC LIMIT 5`);
  return {
    total: totals.total,
    totalValue: Number(totals.value),
    featured: featured[0].n,
    byStatus,
    counts,
    recent: recent.map(shapeRow),
  };
}

// Users
export async function listUsers() {
  assertDb();
  const [rows] = await pool.query(
    'SELECT id, username, name, role, created_at FROM users ORDER BY id');
  return rows;
}
async function userExists(username, exceptId) {
  const [r] = await pool.query(
    'SELECT id FROM users WHERE username = ? AND id <> ?', [username, exceptId || 0]);
  return r.length > 0;
}
export async function createUser({ username, password, name, role }) {
  assertDb();
  if (!username || !password) { const e = new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'); e.status = 400; throw e; }
  if (!['admin', 'staff'].includes(role)) { const e = new Error('สิทธิ์ไม่ถูกต้อง'); e.status = 400; throw e; }
  if (await userExists(username)) { const e = new Error('ชื่อผู้ใช้นี้ถูกใช้แล้ว'); e.status = 409; throw e; }
  const hash = await bcrypt.hash(password, 10);
  const [res] = await pool.query(
    'INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)',
    [username, hash, name || username, role]);
  return { id: res.insertId, username, name: name || username, role };
}
export async function updateUser(id, { name, role, password }) {
  assertDb();
  if (role && !['admin', 'staff'].includes(role)) { const e = new Error('สิทธิ์ไม่ถูกต้อง'); e.status = 400; throw e; }
  // prevent removing the last admin
  if (role === 'staff') {
    const [[cur]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
    if (cur && cur.role === 'admin') {
      const [[c]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
      if (c.n <= 1) { const e = new Error('ต้องมีผู้ดูแล (admin) อย่างน้อย 1 คน'); e.status = 409; throw e; }
    }
  }
  const sets = ['name = ?', 'role = ?'];
  const vals = [name, role];
  if (password) { sets.push('password_hash = ?'); vals.push(await bcrypt.hash(password, 10)); }
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
  return { id: Number(id), name, role };
}
export async function deleteUser(id, currentUserId) {
  assertDb();
  if (Number(id) === Number(currentUserId)) { const e = new Error('ลบบัญชีตัวเองไม่ได้'); e.status = 409; throw e; }
  const [[cur]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
  if (cur && cur.role === 'admin') {
    const [[c]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
    if (c.n <= 1) { const e = new Error('ต้องมีผู้ดูแล (admin) อย่างน้อย 1 คน'); e.status = 409; throw e; }
  }
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

// ============================================================
//  AUDIT LOGS (read — admin only)
// ============================================================
function mapLog(r) {
  let detail = r.detail;
  if (typeof detail === 'string') { try { detail = JSON.parse(detail); } catch { /* keep raw */ } }
  return {
    id: r.id,
    createdAt: r.created_at,
    actorRole: r.actor_role,
    actorId: r.actor_id,
    actorName: r.actor_name,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    method: r.method,
    path: r.path,
    status: r.status,
    ip: r.ip,
    userAgent: r.user_agent,
    detail,
  };
}

export async function listAuditLogs({ page = 1, limit = 30, q, action, role, from, to } = {}) {
  if (mockMode) return { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
  const where = [];
  const args = [];
  if (q) { const s = `%${q}%`; where.push('(actor_name LIKE ? OR ip LIKE ? OR path LIKE ? OR action LIKE ? OR entity_id LIKE ?)'); args.push(s, s, s, s, s); }
  if (action) { where.push('action = ?'); args.push(action); }
  if (role) { where.push('actor_role = ?'); args.push(role); }
  if (from) { where.push('created_at >= ?'); args.push(`${from} 00:00:00`); }
  if (to) { where.push('created_at <= ?'); args.push(`${to} 23:59:59`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ n }]] = await pool.query(`SELECT COUNT(*) AS n FROM audit_logs ${w}`, args);
  const lim = Math.min(100, Math.max(1, Number(limit) || 30));
  const pg = Math.max(1, Number(page) || 1);
  const [rows] = await pool.query(
    `SELECT * FROM audit_logs ${w} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...args, lim, (pg - 1) * lim],
  );
  return {
    data: rows.map(mapLog),
    pagination: { page: pg, totalPages: Math.max(1, Math.ceil(n / lim)), total: n },
  };
}

export async function listAuditActions() {
  if (mockMode) return [];
  const [rows] = await pool.query('SELECT action, COUNT(*) AS count FROM audit_logs GROUP BY action ORDER BY count DESC');
  return rows;
}
