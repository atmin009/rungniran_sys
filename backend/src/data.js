// In-memory dataset used as a dev fallback when MySQL is not reachable.
// Mirrors db/init.sql so the app works out-of-the-box for `npm run dev`.

export const mockBranches = [
  { id: 1, name: 'สำนักงานใหญ่', province: 'กรุงเทพมหานคร' },
  { id: 2, name: 'สาขาบางนา', province: 'กรุงเทพมหานคร' },
  { id: 3, name: 'สาขาเชียงใหม่', province: 'เชียงใหม่' },
  { id: 4, name: 'สาขาขอนแก่น', province: 'ขอนแก่น' },
  { id: 5, name: 'สาขาหาดใหญ่', province: 'สงขลา' },
];

export const mockDealers = [
  { id: 1, name: 'รุ่งนิรันดร์', phone: '081-111-1111' },
  { id: 2, name: 'สมชาย ทรัพย์เจริญ', phone: '082-222-2222' },
  { id: 3, name: 'วราภรณ์ ศรีสุข', phone: '083-333-3333' },
  { id: 4, name: 'ธนกร มั่งมี', phone: '084-444-4444' },
];

const branch = (id) => mockBranches.find((b) => b.id === id);
const dealer = (id) => mockDealers.find((d) => d.id === id);
const img = (seed, n) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}${'abcd'[i]}/900/675`);

const EQ_COMMON = ['แอร์อัตโนมัติ', 'กล้องถอยหลัง', 'เซ็นเซอร์กะระยะ', 'ระบบเบรก ABS', 'ถุงลมนิรภัยคู่หน้า', 'ครูสคอนโทรล', 'เครื่องเสียงจอสัมผัส', 'Apple CarPlay / Android Auto', 'พวงมาลัยมัลติฟังก์ชัน', 'กุญแจอัจฉริยะ Push Start', 'ล้อแม็ก', 'ไฟหน้า LED'];
const EQ_TRUCK = ['ยกสูงจากโรงงาน', 'โรลบาร์', 'พื้นปูกระบะ', 'กล้องถอยหลัง', 'เซ็นเซอร์กะระยะ', 'ระบบเบรก ABS', 'ถุงลมนิรภัยคู่หน้า', 'ครูสคอนโทรล', 'เครื่องเสียงจอสัมผัส', 'พวงมาลัยมัลติฟังก์ชัน', 'ล้อแม็ก', 'ไฟหน้า LED'];
const EQ_EV = ['ระบบช่วยขับ Autopilot', 'จอกลางขนาดใหญ่', 'รองรับชาร์จเร็ว DC', 'กล้องรอบคัน 360°', 'ระบบเบรก ABS', 'ถุงลมนิรภัยรอบคัน', 'ครูสคอนโทรลอัจฉริยะ', 'อัปเดตซอฟต์แวร์ OTA', 'กุญแจการ์ด', 'ล้อแม็ก', 'หลังคาพาโนรามา', 'ไฟหน้า LED Matrix'];
const equipmentFor = (carType, fuel) => {
  if (fuel === 'ev') return EQ_EV;
  if (['pickup4', 'pickupcab', 'pickup'].includes(carType)) return EQ_TRUCK;
  return EQ_COMMON;
};

// [brand, model, carType, year, price, transmission, drivetrain, fuel, mileage, color,
//  colorCode, plate, status, featured, purchaseDate, regDate, branchId, dealerId, desc,
//  imgSeed, imgCount, engine, seats, doors]
const RAW = [
  ['Mitsubishi','Triton 2.4 Plus 4DR','pickup4',2020,619000,'auto','2wd','diesel',62000,'เทา','09/68','1ขจ 5285','reserved',1,'2024-12-10','2020-08-03',1,1,'กระบะ 4 ประตู ยกสูง ตัวพลัส สภาพสวยพร้อมใช้ เครื่องดีช่วงล่างแน่น','car1',4,'2.4L ดีเซลเทอร์โบ',5,4],
  ['Toyota','Yaris Ativ 1.2 Sport','eco',2021,449000,'auto','2wd','gasoline',45000,'ขาว','070','1กก 1234','available',1,'2024-11-05','2021-03-15',1,2,'รถบ้านมือเดียว ไมล์น้อย เข้าศูนย์ตลอด สภาพสวยพร้อมใช้','car2',3,'1.2L เบนซิน',5,4],
  ['Honda','City 1.0 Turbo RS','sedan',2022,579000,'auto','2wd','gasoline',32000,'ดำ','NH-731P','2ขข 4567','available',1,'2025-01-12','2022-02-20',1,1,'ตัวท็อป RS ออปชั่นเต็ม ไมล์แท้ เช็คประวัติได้','car3',2,'1.0L เบนซินเทอร์โบ',5,4],
  ['Isuzu','D-Max 1.9 Hi-Lander Cab','pickupcab',2020,659000,'manual','2wd','diesel',88000,'เทา','693','3คค 8910','available',0,'2024-09-20','2020-05-11',2,3,'กระบะแค็บยกสูง เครื่องดี ช่วงล่างแน่น เหมาะใช้งานหนัก','car4',3,'1.9L ดีเซลเทอร์โบ',5,4],
  ['Mazda','CX-30 2.0 SP','suv',2021,789000,'auto','2wd','gasoline',41000,'แดง','46V','4งง 1122','reserved',0,'2024-12-01','2021-07-08',2,1,'เอสยูวีหรู ดีไซน์สวย ภายในพรีเมียม ติดจองแล้ว','car5',2,'2.0L เบนซิน',5,4],
  ['Toyota','Fortuner 2.4 V','ppv',2019,999000,'auto','4wd','diesel',102000,'ขาวมุก','070','5จจ 3344','available',1,'2024-08-15','2019-11-22',3,2,'พีพีวียอดนิยม 7 ที่นั่ง ขับเคลื่อน 4 ล้อ เครื่องดีเซลประหยัด','car6',3,'2.4L ดีเซลเทอร์โบ',7,4],
  ['Honda','Civic 1.5 Turbo EL','sedan',2020,749000,'auto','2wd','gasoline',56000,'น้ำเงิน','B-637M','6ฉฉ 5566','sold',0,'2024-07-10','2020-01-30',1,4,'ซีดานสปอร์ต เครื่องเทอร์โบแรง ขายแล้ว','car7',1,'1.5L เบนซินเทอร์โบ',5,4],
  ['Mitsubishi','Triton 2.4 GT Premium 4DR','pickup4',2022,729000,'auto','4wd','diesel',38000,'เงิน','U17','7ชช 7788','available',1,'2025-02-03','2022-06-18',4,3,'กระบะ 4 ประตู ตัวท็อป ขับเคลื่อน 4 ล้อ ไมล์น้อยมาก สวยกริ๊บ','car8',2,'2.4L ดีเซลเทอร์โบ',5,4],
  ['Toyota','Camry 2.5 HV Premium','sedan',2021,1290000,'auto','2wd','hybrid',47000,'ดำ','218','8ซซ 9900','available',0,'2024-10-22','2021-09-05',1,1,'ซีดานหรูไฮบริด ประหยัดน้ำมัน ออปชั่นจัดเต็ม','car9',3,'2.5L ไฮบริด',5,4],
  ['Suzuki','Swift 1.2 GLX','hatchback',2020,389000,'auto','2wd','gasoline',61000,'ส้ม','ZWG','9ฌฌ 1212','available',0,'2024-11-28','2020-08-14',5,4,'รถเก๋ง 5 ประตู คล่องตัว ประหยัดน้ำมันสุดๆ','car10',1,'1.2L เบนซิน',5,4],
  ['Ford','Ranger 2.0 Bi-Turbo Wildtrak','pickup4',2022,1090000,'auto','4wd','diesel',29000,'ส้ม','EA','1กก 1357','incoming',0,'2025-03-08','2022-10-01',2,2,'ตัวท็อป Wildtrak 4WD กำลังเข้า รอตรวจสภาพ','car11',2,'2.0L ดีเซลไบเทอร์โบ',5,4],
  ['BMW','320d Sport','sedan',2019,1150000,'auto','2wd','diesel',73000,'ขาว','300','2ขข 2468','available',0,'2024-09-05','2019-04-19',1,1,'รถยุโรปสภาพดี ออฟชั่นครบ เซอร์วิสครบตามระยะ','car12',2,'2.0L ดีเซลเทอร์โบ',5,4],
  ['Toyota','Hilux Revo 2.8 Rocco 4DR','pickup4',2021,989000,'auto','4wd','diesel',54000,'ดำ','218','3คค 3690','reserved',1,'2024-12-19','2021-12-03',3,3,'รีโว่ร็อคโค่ตัวท็อป 4WD แต่งสวย ติดจองแล้ว','car13',3,'2.8L ดีเซลเทอร์โบ',5,4],
  ['Honda','HR-V e:HEV RS','suv',2022,1059000,'auto','2wd','hybrid',22000,'เทา','NH-883P','4งง 4812','available',1,'2025-01-30','2022-11-25',2,4,'เอสยูวีไฮบริดรุ่นใหม่ ไมล์น้อยมาก สภาพป้ายแดง','car14',2,'1.5L ไฮบริด',5,4],
  ['Nissan','Almera 1.0 Turbo VL','eco',2021,479000,'auto','2wd','gasoline',49000,'แดง','NAH','5จจ 5934','available',0,'2024-10-11','2021-06-12',4,2,'อีโคคาร์เทอร์โบ ออปชั่นเยอะ จอใหญ่ คุ้มค่า','car15',1,'1.0L เบนซินเทอร์โบ',5,4],
  ['Toyota','Alphard 2.5 HV','van',2018,2390000,'auto','2wd','hybrid',96000,'ดำ','202','6ฉฉ 7158','available',1,'2024-08-28','2018-03-09',1,1,'รถตู้ครอบครัวหรู เบาะ Captain Seat ภายในกว้างขวาง','car16',3,'2.5L ไฮบริด',7,4],
  ['Mazda','2 1.3 S Leather','eco',2020,419000,'auto','2wd','gasoline',58000,'น้ำเงิน','44J','7ชช 8260','available',0,'2024-11-14','2020-10-20',5,4,'อีโคคาร์เบาะหนัง ดีไซน์สวย ขับสนุก','car17',1,'1.3L เบนซิน',5,4],
  ['Tesla','Model 3 RWD','sedan',2023,1390000,'auto','2wd','ev',18000,'ขาว','PPSW','8ซซ 9001','available',1,'2025-02-20','2023-01-15',1,1,'รถไฟฟ้า 100% ไมล์น้อย ประหยัดค่าพลังงาน','car18',2,'มอเตอร์ไฟฟ้า RWD',5,4],
  ['Honda','Jazz 1.5 RS','hatchback',2018,429000,'auto','2wd','gasoline',91000,'แดง','R-81','9ฌฌ 2581','available',0,'2024-09-12','2018-07-07',2,2,'รถเก๋ง 5 ประตู ยอดฮิต พื้นที่อเนกประสงค์ ULTRA Seat','car19',2,'1.5L เบนซิน',5,4],
  ['Isuzu','MU-X 3.0 Ultimate','ppv',2021,1190000,'auto','4wd','diesel',64000,'ขาวมุก','527','1กก 3692','available',1,'2024-10-02','2021-05-28',4,3,'พีพีวี 7 ที่นั่ง ตัวท็อป 4WD ลากจูงดี เครื่องอึด','car20',3,'3.0L ดีเซลเทอร์โบ',7,4],
];

export const mockCars = RAW.map((r, i) => ({
  id: i + 1,
  brand: r[0],
  model: r[1],
  carType: r[2],
  modelYear: r[3],
  price: r[4],
  transmission: r[5],
  drivetrain: r[6],
  fuelType: r[7],
  mileage: r[8],
  color: r[9],
  colorCode: r[10],
  licensePlate: r[11],
  status: r[12],
  featured: r[13] === 1,
  purchaseDate: r[14],
  registrationDate: r[15],
  engine: r[21],
  seats: r[22],
  doors: r[23],
  description: r[18],
  equipment: equipmentFor(r[2], r[7]),
  images: img(r[19], r[20]),
  branch: branch(r[16]),
  dealer: dealer(r[17]),
  _branchId: r[16],
  _dealerId: r[17],
  _order: i,
}));
