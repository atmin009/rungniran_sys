import XLSX from 'xlsx';

// header (Thai) -> internal field key
export const COLUMNS = [
  { key: 'brand', header: 'ยี่ห้อ*', required: true },
  { key: 'model', header: 'รุ่น*', required: true },
  { key: 'carType', header: 'ประเภทรถ*', required: true },
  { key: 'modelYear', header: 'ปี' },
  { key: 'price', header: 'ราคา*', required: true },
  { key: 'mileage', header: 'เลขไมล์' },
  { key: 'licensePlate', header: 'ทะเบียน*', required: true },
  { key: 'status', header: 'สถานะ' },
  { key: 'transmission', header: 'เกียร์' },
  { key: 'drivetrain', header: 'ขับเคลื่อน' },
  { key: 'fuelType', header: 'เชื้อเพลิง' },
  { key: 'engine', header: 'เครื่องยนต์' },
  { key: 'seats', header: 'ที่นั่ง' },
  { key: 'doors', header: 'ประตู' },
  { key: 'color', header: 'สี' },
  { key: 'colorCode', header: 'รหัสสี' },
  { key: 'branch', header: 'สาขา*', required: true },
  { key: 'dealer', header: 'ดีลเลอร์*', required: true },
  { key: 'purchaseDate', header: 'วันที่รับเข้า (ปปปป-ดด-วว)' },
  { key: 'registrationDate', header: 'วันจดทะเบียน (ปปปป-ดด-วว)' },
  { key: 'featured', header: 'รถแนะนำ (ใช่/ไม่)' },
  { key: 'description', header: 'รายละเอียด' },
  { key: 'images', header: 'รูปภาพ (URL คั่นด้วย ,)' },
];

const norm = (v) => String(v ?? '').trim();
const lower = (v) => norm(v).toLowerCase();

function fmtDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, '0');
    const d = String(v.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = norm(v);
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return fmtDate(new Date(t));
  return undefined; // signal "unparseable"
}

function buildRefs(filters) {
  const optionMap = (arr) => {
    const m = new Map();
    arr.forEach((o) => { m.set(lower(o.value), o.value); m.set(lower(o.label), o.value); });
    return m;
  };
  return {
    brands: new Set(filters.brands.map((b) => lower(b.name))),
    brandName: new Map(filters.brands.map((b) => [lower(b.name), b.name])),
    carTypes: optionMap(filters.carTypes),
    statuses: optionMap(filters.statuses),
    transmissions: optionMap(filters.transmissions),
    drivetrains: optionMap(filters.drivetrains),
    fuels: optionMap(filters.fuels),
    branches: new Map(filters.branches.map((b) => [lower(b.name), b.id])),
    dealers: new Map(filters.dealers.map((d) => [lower(d.name), d.id])),
  };
}

export function buildTemplate() {
  const headers = COLUMNS.map((c) => c.header);
  const example = [
    'Toyota', 'Yaris Ativ 1.2 Sport', 'sedan', 2021, 559000, 35000, '1กก 1234',
    'available', 'auto', '2wd', 'gasoline', '1.2L เบนซิน', 5, 4, 'ขาว', '058',
    'สำนักงานใหญ่', 'รุ่งนิรันดร์', '2024-05-01', '2021-03-15', 'ไม่', 'รถบ้านมือเดียว',
    'https://example.com/1.jpg, https://example.com/2.jpg',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'cars');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const TRUE_WORDS = new Set(['ใช่', 'yes', 'y', 'true', '1', 'จริง', '✓']);

export function parseAndValidate(buffer, filters) {
  const refs = buildRefs(filters);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { rows: [], summary: { total: 0, valid: 0, invalid: 0 } };
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const rows = raw.map((r, i) => {
    const get = (key) => {
      const col = COLUMNS.find((c) => c.key === key);
      return r[col.header];
    };
    // ignore Excel rows that have no header match at all
    const errors = [];
    const data = {};

    data.brand = norm(get('brand'));
    data.model = norm(get('model'));
    data.licensePlate = norm(get('licensePlate'));
    if (!data.brand) errors.push('ไม่มียี่ห้อ');
    if (!data.model) errors.push('ไม่มีรุ่น');
    if (!data.licensePlate) errors.push('ไม่มีทะเบียน');

    const priceRaw = norm(get('price')).replace(/,/g, '');
    data.price = Number(priceRaw);
    if (!priceRaw || Number.isNaN(data.price) || data.price <= 0) errors.push('ราคาไม่ถูกต้อง');

    // car type
    const ct = lower(get('carType'));
    if (!ct) errors.push('ไม่มีประเภทรถ');
    else if (refs.carTypes.has(ct)) data.carType = refs.carTypes.get(ct);
    else errors.push(`ไม่รู้จักประเภทรถ "${norm(get('carType'))}"`);

    // branch / dealer
    const br = lower(get('branch'));
    if (!br) errors.push('ไม่มีสาขา');
    else if (refs.branches.has(br)) data.branchId = refs.branches.get(br);
    else errors.push(`ไม่พบสาขา "${norm(get('branch'))}"`);

    const dl = lower(get('dealer'));
    if (!dl) errors.push('ไม่มีดีลเลอร์');
    else if (refs.dealers.has(dl)) data.dealerId = refs.dealers.get(dl);
    else errors.push(`ไม่พบดีลเลอร์ "${norm(get('dealer'))}"`);

    // optional enums with defaults
    const resolve = (key, map, def, label) => {
      const v = lower(get(key));
      if (!v) return def;
      if (map.has(v)) return map.get(v);
      errors.push(`ไม่รู้จัก${label} "${norm(get(key))}"`);
      return def;
    };
    data.status = resolve('status', refs.statuses, 'available', 'สถานะ');
    data.transmission = resolve('transmission', refs.transmissions, 'auto', 'เกียร์');
    data.drivetrain = resolve('drivetrain', refs.drivetrains, '2wd', 'ระบบขับเคลื่อน');
    data.fuelType = resolve('fuelType', refs.fuels, 'gasoline', 'เชื้อเพลิง');

    const yr = Number(norm(get('modelYear')));
    data.modelYear = yr >= 1950 && yr <= 2100 ? yr : new Date().getFullYear();
    data.mileage = Number(norm(get('mileage')).replace(/,/g, '')) || 0;
    data.seats = Number(norm(get('seats'))) || null;
    data.doors = Number(norm(get('doors'))) || null;
    data.engine = norm(get('engine')) || null;
    data.color = norm(get('color')) || null;
    data.colorCode = norm(get('colorCode')) || null;
    data.description = norm(get('description')) || null;
    data.featured = TRUE_WORDS.has(lower(get('featured')));

    const pd = fmtDate(get('purchaseDate'));
    if (pd === undefined) errors.push('วันที่รับเข้าไม่ถูกต้อง');
    data.purchaseDate = pd || new Date().toISOString().slice(0, 10);
    const rd = fmtDate(get('registrationDate'));
    if (rd === undefined) errors.push('วันจดทะเบียนไม่ถูกต้อง');
    data.registrationDate = rd || null;

    const imgs = norm(get('images'));
    data.images = imgs ? imgs.split(',').map((s) => s.trim()).filter(Boolean) : [];
    data.equipment = [];

    const newBrand = data.brand && !refs.brands.has(lower(data.brand));
    return {
      index: i + 2, // +2 = header row + 1-based
      data,
      errors,
      newBrand,
      valid: errors.length === 0,
    };
  });

  // drop fully-empty rows
  const filled = rows.filter((r) => r.data.brand || r.data.model || r.data.licensePlate);
  return {
    rows: filled,
    summary: {
      total: filled.length,
      valid: filled.filter((r) => r.valid).length,
      invalid: filled.filter((r) => !r.valid).length,
      newBrands: [...new Set(filled.filter((r) => r.newBrand && r.valid).map((r) => r.data.brand))],
    },
  };
}
