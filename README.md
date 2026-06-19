# คาร์สต๊อก — ระบบดูสต๊อกรถยนต์มือสอง (หน้าบ้าน)

ระบบสำหรับให้ seller เข้ามาดูรถยนต์ในสต๊อกและรายละเอียดรถ ออกแบบเป็น **mobile-first**
ใช้งานง่าย รวดเร็ว รองรับการกรอง/ค้นหารถได้ครบถ้วน

Stack: **React (Vite) + Node.js (Express) + MySQL 8 + Docker**

## ฟีเจอร์หน้าบ้าน

- หน้ารวมรถแบบการ์ด: รูปรถ, ยี่ห้อ/รุ่น, ราคา, สถานะ, เลขไมล์, เกียร์, สาขา, ทะเบียน
- ค้นหาด้วย ยี่ห้อ / รุ่น / ป้ายทะเบียน (debounce)
- ตัวกรอง (bottom sheet): สถานะรถ, ประเภทรถ, ยี่ห้อ, ช่วงราคา, ระบบเกียร์, สาขา, ดีลเลอร์
- ชิปกรองสถานะแบบเร็ว + เรียงลำดับ (ราคา / ปี / ไมล์ / เข้าใหม่)
- หน้ารายละเอียดรถ: แกลเลอรีรูปเลื่อนได้, สเปก, ข้อมูลรถครบ, ปุ่มโทรหาดีลเลอร์
- ไอคอนทั้งหมดใช้ `lucide-react` (ไม่มี emoji)

## สถานะรถ

| สถานะ | ความหมาย |
|--------|-----------|
| `available` | พร้อมจำหน่าย |
| `incoming` | กำลังเข้า |
| `reserved` | ติดจอง |
| `sold` | ขายแล้ว |

## เริ่มใช้งานด้วย Docker (แนะนำ)

```bash
cp .env.example .env   # ปรับค่าได้ตามต้องการ
docker compose up --build
```

- หน้าเว็บ: http://localhost:8080
- API: http://localhost:4000/api/cars
- MySQL: localhost:3307 (ภายใน container ใช้พอร์ต 3306)

ข้อมูลตัวอย่าง (รถ 20 คัน, 5 สาขา, 4 ดีลเลอร์) จะถูก seed อัตโนมัติจาก `db/init.sql`

## รันแบบ dev (ไม่ใช้ Docker)

ต้องมี MySQL รันอยู่ และ import `db/init.sql`

```bash
# backend
cd backend && npm install
DB_HOST=localhost DB_PORT=3306 npm run dev

# frontend (อีก terminal)
cd frontend && npm install && npm run dev
# เปิด http://localhost:5173 (proxy /api ไป backend อัตโนมัติ)
```

## โครงสร้างโปรเจกต์

```
car/
├── docker-compose.yml
├── db/init.sql              # schema + seed
├── backend/                 # Express API
│   └── src/
│       ├── index.js
│       ├── db.js
│       └── routes/{cars,meta}.js
└── frontend/                # React (Vite)
    └── src/
        ├── pages/{CarList,CarDetail}.jsx
        ├── components/{CarCard,FilterSheet}.jsx
        ├── api.js, constants.js
        └── styles/index.css
```

## API หลัก

| Method | Endpoint | คำอธิบาย |
|--------|----------|-----------|
| GET | `/api/cars` | รายการรถ (รองรับ filter: `type,brand,status,transmission,branch,dealer,minPrice,maxPrice,q,sort,page,limit`) |
| GET | `/api/cars/:id` | รายละเอียดรถ 1 คัน |
| GET | `/api/meta/filters` | ตัวเลือกสำหรับสร้างฟิลเตอร์ |

## สิทธิ์การใช้งาน (Roles & PIN)

ระบบแบ่งผู้ใช้เป็น 2 กลุ่มหลัก + PIN สำหรับฝั่งขาย:

| สิทธิ์ | เข้าถึง |
|--------|---------|
| **ผู้ดูแลระบบ (admin)** | เห็นยอด/มูลค่าสต๊อกทั้งหมด, จัดการรถ, ข้อมูลตัวกรอง, ผู้ใช้/สิทธิ์ และเปลี่ยน PIN |
| **เจ้าหน้าที่ (staff)** | เพิ่ม/แก้ไข/ลบรถได้ แต่ **ไม่เห็นมูลค่าสต๊อก** และไม่เห็นเมนูระบบ/ตัวกรอง |
| **PIN ฝั่งขาย** | หน้าดูสต๊อกรถ (sale) ต้องกรอก PIN ก่อนเข้าใช้งาน |

**บัญชีเริ่มต้น (seed อัตโนมัติ):**
- `admin / admin123` — ผู้ดูแลระบบ
- `sale / sale123` — เจ้าหน้าที่
- **PIN ฝั่งขาย:** `1234` (เปลี่ยนได้ที่เมนู "PIN ฝั่งขาย" ในหลังบ้าน)

> หน้าฝั่งขาย (`/`) จะถูกล็อกด้วย PIN — ทั้ง UI และ API (`/api/cars`, `/api/meta`) ต้องมี token จากการกรอก PIN

**การจำ PIN และการบังคับออกจากระบบ:**
- เมื่อกรอก PIN ถูก เครื่องจะ**จำไว้ (อายุ token 365 วัน)** ไม่ต้องกรอกซ้ำทุกครั้ง และไม่ถูก logout เอง
- token ฝั่งขายฝัง "เวอร์ชัน PIN" ไว้ เมื่อ admin เปลี่ยน PIN เวอร์ชันจะถูกเลื่อน → **token เก่าทุกเครื่องใช้ไม่ได้ทันที** ผู้ใช้จะถูกบังคับให้กรอก PIN ใหม่ในการเรียกข้อมูลครั้งถัดไป

## ระบบหลังบ้าน (Admin)

เข้าที่ **http://localhost:8080/admin** (หรือ `http://localhost:5173/admin` ตอน dev)

ฟีเจอร์:
- **ภาพรวม (Dashboard)**: จำนวนรถ, มูลค่าสต๊อกรวม, รถแนะนำ, แยกตามสถานะ, รถเพิ่มล่าสุด
- **จัดการรถยนต์**: ค้นหา/กรอง, เพิ่ม, แก้ไข, ลบ, ตั้งรถแนะนำ, จัดการรูป + อุปกรณ์/ออปชั่น (ครอบคลุมทุกฟิลด์ของหน้าบ้าน)
- **จัดการข้อมูลตัวกรอง (master data)**: ยี่ห้อรถ, ประเภทรถ, สาขา, ดีลเลอร์ — เพิ่ม/แก้ไข/ลบได้ (กันลบรายการที่มีรถใช้งานอยู่)

ความปลอดภัย: ใช้ JWT (เก็บใน localStorage), ทุก endpoint `/api/admin/*` ต้องมี token
กำหนดค่า `JWT_SECRET` ใน `.env` สำหรับ production

> หมายเหตุ: การเขียนข้อมูล (admin) ต้องเชื่อมต่อ MySQL จริง — โหมด mock ใช้สำหรับดูหน้าบ้านเท่านั้น

### API หลังบ้าน

| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|--------|----------|--------|-----------|
| POST | `/api/auth/login` | - | เข้าสู่ระบบหลังบ้าน → คืน token |
| POST | `/api/auth/pin` | - | ตรวจ PIN ฝั่งขาย → คืน sale token |
| GET | `/api/admin/stats` | staff+ | สถิติ (มูลค่าสต๊อกเฉพาะ admin) |
| CRUD | `/api/admin/cars` | staff+ | จัดการรถ |
| CRUD | `/api/admin/brands` | admin | จัดการยี่ห้อ |
| CRUD | `/api/admin/car-types` | admin | จัดการประเภทรถ |
| CRUD | `/api/admin/branches` | admin | จัดการสาขา |
| CRUD | `/api/admin/dealers` | admin | จัดการดีลเลอร์ |
| CRUD | `/api/admin/users` | admin | จัดการผู้ใช้และสิทธิ์ |
| PUT | `/api/admin/settings/pin` | admin | เปลี่ยน PIN ฝั่งขาย |
| GET | `/api/cars`, `/api/meta/filters` | sale+ | ข้อมูลฝั่งขาย (ต้องมี token) |

## อัปโหลดรูปภาพ

ในฟอร์มเพิ่ม/แก้ไขรถ มีตัวอัปโหลดรูปแบบ **แตะเพื่อเลือก / ถ่ายรูป / ลากมาวาง** (เลือกหลายรูปพร้อมกันได้)
- ไฟล์ถูกเก็บที่เซิร์ฟเวอร์ (`backend/uploads/cars`, ใน Docker เป็น volume `uploads_data`) และเสิร์ฟผ่าน `/uploads/...`
- รูปแรก = รูปปก กดดาวเพื่อย้ายรูปอื่นมาเป็นปก, กด X เพื่อลบ
- รองรับ jpg/png/gif/webp ขนาดไม่เกิน 8MB ต่อรูป

## นำเข้ารถจาก Excel

หน้า **จัดการรถยนต์ → นำเข้า Excel** (`/admin/cars/import`)
1. ดาวน์โหลดเทมเพลต `.xlsx` (มีหัวคอลัมน์ภาษาไทย + แถวตัวอย่าง)
2. กรอกข้อมูล แล้วอัปโหลด — ระบบจะ**ตรวจสอบทุกแถว**เทียบกับข้อมูลในระบบ (ประเภทรถ/สาขา/ดีลเลอร์ต้องตรง, ยี่ห้อใหม่เพิ่มให้อัตโนมัติ)
3. ดูตัวอย่างผลตรวจ (ผ่าน/มีปัญหาพร้อมเหตุผลรายแถว) แล้วกดยืนยันนำเข้าเฉพาะแถวที่ผ่าน

API: `GET /api/admin/import/template`, `POST /api/admin/import/cars/preview`, `POST /api/admin/import/cars`, `POST /api/admin/uploads`

## ถัดไป

เพิ่มได้อีก: รายงานยอดขาย, ประวัติการแก้ไข (audit log), แจ้งเตือนรถค้างสต๊อก
```
