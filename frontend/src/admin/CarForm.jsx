import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Star } from 'lucide-react';
import { adminOptions, adminGet, adminCreate, adminUpdate } from './api.js';
import ImageUploader from './ImageUploader.jsx';

const BLANK = {
  brand: '', model: '', carType: '', modelYear: new Date().getFullYear(), price: '',
  transmission: 'auto', drivetrain: '2wd', fuelType: 'gasoline', mileage: '',
  color: '', colorCode: '', licensePlate: '', status: 'available', featured: false,
  engine: '', seats: '', doors: '', purchaseDate: '', registrationDate: '',
  branchId: '', dealerId: '', description: '',
};

const toLines = (arr) => (arr || []).join('\n');
const fromLines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const dateInput = (d) => (d ? String(d).slice(0, 10) : '');

export default function CarForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [opts, setOpts] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [equipment, setEquipment] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminOptions().then((o) => {
      setOpts(o);
      setForm((f) => ({
        ...f,
        brand: f.brand || o.brands[0]?.name || '',
        carType: f.carType || o.carTypes[0]?.value || '',
        branchId: f.branchId || o.branches[0]?.id || '',
        dealerId: f.dealerId || o.dealers[0]?.id || '',
      }));
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminGet('cars', id).then((c) => {
      setForm({
        brand: c.brand, model: c.model, carType: c.carType, modelYear: c.modelYear,
        price: c.price, transmission: c.transmission, drivetrain: c.drivetrain,
        fuelType: c.fuelType, mileage: c.mileage, color: c.color || '', colorCode: c.colorCode || '',
        licensePlate: c.licensePlate, status: c.status, featured: c.featured,
        engine: c.engine || '', seats: c.seats || '', doors: c.doors || '',
        purchaseDate: dateInput(c.purchaseDate), registrationDate: dateInput(c.registrationDate),
        branchId: c.branch.id, dealerId: c.dealer.id, description: c.description || '',
      });
      setEquipment(toLines(c.equipment));
      setImages(c.images || []);
    }).catch((e) => setError(e.message));
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.model || !form.licensePlate || !form.price) {
      setError('กรุณากรอก รุ่นรถ, ทะเบียน และราคา');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      modelYear: Number(form.modelYear),
      price: Number(form.price),
      mileage: Number(form.mileage) || 0,
      seats: form.seats ? Number(form.seats) : null,
      doors: form.doors ? Number(form.doors) : null,
      branchId: Number(form.branchId),
      dealerId: Number(form.dealerId),
      registrationDate: form.registrationDate || null,
      equipment: fromLines(equipment),
      images,
    };
    try {
      if (isEdit) await adminUpdate('cars', id, payload);
      else await adminCreate('cars', payload);
      navigate('/admin/cars');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (!opts) return <div className="ad-loading">กำลังโหลด...</div>;

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div className="ad-head__back">
          <Link to="/admin/cars" className="ad-iconbtn"><ArrowLeft size={18} /></Link>
          <div>
            <h1>{isEdit ? 'แก้ไขรถยนต์' : 'เพิ่มรถยนต์'}</h1>
            <p className="ad-sub">{isEdit ? `${form.brand} ${form.model}` : 'กรอกข้อมูลรถใหม่'}</p>
          </div>
        </div>
      </div>

      {error && <div className="ad-empty ad-empty--error">{error}</div>}

      <form onSubmit={submit} className="ad-form">
        <div className="ad-card">
          <h3>ข้อมูลหลัก</h3>
          <div className="ad-formgrid">
            <Field label="ยี่ห้อ">
              <select value={form.brand} onChange={(e) => set('brand', e.target.value)}>
                {opts.brands.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="รุ่น *">
              <input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="เช่น City 1.0 Turbo RS" />
            </Field>
            <Field label="ประเภทรถ">
              <select value={form.carType} onChange={(e) => set('carType', e.target.value)}>
                {opts.carTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="ปีรถ">
              <input type="number" value={form.modelYear} onChange={(e) => set('modelYear', e.target.value)} />
            </Field>
            <Field label="ราคา (บาท) *">
              <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="619000" />
            </Field>
            <Field label="เลขไมล์ (กม.)">
              <input type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} />
            </Field>
            <Field label="ทะเบียนรถ *">
              <input value={form.licensePlate} onChange={(e) => set('licensePlate', e.target.value)} placeholder="1ขจ 5285" />
            </Field>
            <Field label="สถานะ">
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {opts.statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <label className="ad-toggle">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            <span className="ad-toggle__box"><Star size={14} /></span>
            ตั้งเป็นรถแนะนำ
          </label>
        </div>

        <div className="ad-card">
          <h3>สเปกและรายละเอียด</h3>
          <div className="ad-formgrid">
            <Field label="ระบบเกียร์">
              <select value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                {opts.transmissions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="ระบบขับเคลื่อน">
              <select value={form.drivetrain} onChange={(e) => set('drivetrain', e.target.value)}>
                {opts.drivetrains.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="เชื้อเพลิง">
              <select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                {opts.fuels.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
            <Field label="เครื่องยนต์">
              <input value={form.engine} onChange={(e) => set('engine', e.target.value)} placeholder="2.4L ดีเซลเทอร์โบ" />
            </Field>
            <Field label="จำนวนที่นั่ง">
              <input type="number" value={form.seats} onChange={(e) => set('seats', e.target.value)} />
            </Field>
            <Field label="จำนวนประตู">
              <input type="number" value={form.doors} onChange={(e) => set('doors', e.target.value)} />
            </Field>
            <Field label="สีรถ">
              <input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="เทา" />
            </Field>
            <Field label="รหัสสี">
              <input value={form.colorCode} onChange={(e) => set('colorCode', e.target.value)} placeholder="09/68" />
            </Field>
          </div>
          <Field label="รายละเอียด">
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="รายละเอียดเพิ่มเติมของรถ" />
          </Field>
        </div>

        <div className="ad-card">
          <h3>ที่อยู่ / ผู้ดูแล / วันที่</h3>
          <div className="ad-formgrid">
            <Field label="สาขาที่รถอยู่">
              <select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
                {opts.branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.province})</option>)}
              </select>
            </Field>
            <Field label="ดีลเลอร์">
              <select value={form.dealerId} onChange={(e) => set('dealerId', e.target.value)}>
                {opts.dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="วันที่รับรถเข้า">
              <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
            </Field>
            <Field label="วันจดทะเบียน">
              <input type="date" value={form.registrationDate} onChange={(e) => set('registrationDate', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="ad-card">
          <h3>รูปภาพรถ</h3>
          <ImageUploader value={images} onChange={setImages} />
        </div>

        <div className="ad-card">
          <h3>อุปกรณ์และออปชั่น (บรรทัดละ 1 รายการ)</h3>
          <textarea rows={5} value={equipment} onChange={(e) => setEquipment(e.target.value)}
            placeholder={'แอร์อัตโนมัติ\nกล้องถอยหลัง\n...'} />
        </div>

        <div className="ad-formbar">
          <Link to="/admin/cars" className="ad-btn">ยกเลิก</Link>
          <button className="ad-btn ad-btn--primary" disabled={saving}>
            <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="ad-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
