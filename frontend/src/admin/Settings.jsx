import { useState } from 'react';
import { KeyRound, Save, CheckCircle2 } from 'lucide-react';
import { adminUpdatePin } from './api.js';

export default function Settings() {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (!/^\d{4,8}$/.test(pin)) { setError('PIN ต้องเป็นตัวเลข 4-8 หลัก'); return; }
    if (pin !== confirm) { setError('ยืนยัน PIN ไม่ตรงกัน'); return; }
    setSaving(true);
    try {
      await adminUpdatePin(pin);
      setDone(true);
      setPin('');
      setConfirm('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div>
          <h1>PIN ฝั่งขาย</h1>
          <p className="ad-sub">ตั้งรหัส PIN ที่พนักงานต้องกรอกเพื่อเข้าหน้าดูสต๊อกรถ</p>
        </div>
      </div>

      <form className="ad-card ad-card--narrow" onSubmit={submit}>
        <div className="ad-pinhead">
          <span className="ad-pinhead__icon"><KeyRound size={22} /></span>
          <div>
            <h3>เปลี่ยน PIN เข้าใช้งาน</h3>
            <p className="ad-sub">เมื่อเปลี่ยน PIN ทุกเครื่องที่เข้าใช้งานอยู่จะถูกบังคับให้กรอก PIN ใหม่ทันที</p>
          </div>
        </div>

        {error && <div className="ad-empty ad-empty--error">{error}</div>}
        {done && <div className="ad-ok"><CheckCircle2 size={16} /> เปลี่ยน PIN เรียบร้อยแล้ว — ทุกเครื่องต้องกรอก PIN ใหม่</div>}

        <label className="ad-field">
          <span>PIN ใหม่ (4-8 หลัก)</span>
          <input type="password" inputMode="numeric" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="••••" />
        </label>
        <label className="ad-field">
          <span>ยืนยัน PIN ใหม่</span>
          <input type="password" inputMode="numeric" value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="••••" />
        </label>

        <div className="ad-formbar ad-formbar--static">
          <button className="ad-btn ad-btn--primary" disabled={saving}>
            <Save size={18} /> {saving ? 'กำลังบันทึก...' : 'บันทึก PIN'}
          </button>
        </div>
      </form>
    </div>
  );
}
