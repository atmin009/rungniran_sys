export const STATUS_META = {
  available: { label: 'พร้อมจำหน่าย', className: 'status--available' },
  incoming: { label: 'กำลังเข้า', className: 'status--incoming' },
  reserved: { label: 'ติดจอง', className: 'status--reserved' },
  sold: { label: 'ขายแล้ว', className: 'status--sold' },
};

export const CAR_TYPE_LABEL = {
  sedan: 'รถเก๋ง',
  eco: 'อีโคคาร์',
  hatchback: 'รถเก๋ง 5 ประตู',
  suv: 'รถ SUV',
  ppv: 'รถ PPV',
  pickup4: 'กระบะ 4 ประตู',
  pickupcab: 'กระบะแค็บ',
  pickup: 'กระบะตอนเดียว',
  van: 'รถตู้',
  mpv: 'รถ MPV',
  sport: 'รถสปอร์ต',
  motorcycle: 'บิ๊กไบค์',
};

export const TRANSMISSION_LABEL = {
  auto: 'เกียร์ออโต้',
  manual: 'เกียร์ธรรมดา',
};

export const DRIVETRAIN_LABEL = {
  '2wd': '2WD',
  '4wd': '4WD',
};

export const FUEL_LABEL = {
  gasoline: 'เบนซิน',
  diesel: 'ดีเซล',
  hybrid: 'ไฮบริด',
  ev: 'ไฟฟ้า',
};

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'รถแนะนำ' },
  { value: 'newest', label: 'เข้าใหม่ล่าสุด' },
  { value: 'price_asc', label: 'ราคาต่ำ-สูง' },
  { value: 'price_desc', label: 'ราคาสูง-ต่ำ' },
  { value: 'year_desc', label: 'ปีรถใหม่สุด' },
  { value: 'mileage_asc', label: 'เลขไมล์น้อยสุด' },
];

export const formatPrice = (n) =>
  new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n);

export const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatMonthYear = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
};

export const formatMileage = (n) => `${new Intl.NumberFormat('th-TH').format(n)} กม.`;

// transmission + drivetrain combined, e.g. "เกียร์ออโต้ 2WD"
export const gearLabel = (transmission, drivetrain) =>
  `${TRANSMISSION_LABEL[transmission] || ''}${drivetrain ? ` ${DRIVETRAIN_LABEL[drivetrain]}` : ''}`.trim();
