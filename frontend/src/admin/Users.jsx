import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, ShieldCheck, User } from 'lucide-react';
import { adminList, adminCreate, adminUpdate, adminRemove } from './api.js';
import { useAuth } from './auth.jsx';

const ROLE_LABEL = { admin: 'ผู้ดูแลระบบ', staff: 'เจ้าหน้าที่' };

export default function Users() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    adminList('users').then(setRows).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (row) => {
    if (!window.confirm(`ลบผู้ใช้ "${row.username}" ?`)) return;
    try { await adminRemove('users', row.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div>
          <h1>ผู้ใช้และสิทธิ์</h1>
          <p className="ad-sub">{rows.length} บัญชี</p>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => setEditing({})}><Plus size={18} /> เพิ่มผู้ใช้</button>
      </div>

      <div className="ad-roleinfo">
        <div><span className="ad-badge ad-badge--admin"><ShieldCheck size={12} /> ผู้ดูแลระบบ</span> เห็นยอด/มูลค่าทั้งหมด จัดการรถ ตัวกรอง ผู้ใช้ และ PIN</div>
        <div><span className="ad-badge ad-badge--staff"><User size={12} /> เจ้าหน้าที่</span> เพิ่ม/แก้ไข/ลบรถได้ แต่ไม่เห็นมูลค่าสต๊อกและเมนูระบบ</div>
      </div>

      {error && <div className="ad-empty ad-empty--error">{error}</div>}

      <div className="ad-card ad-card--flush">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr><th>ชื่อผู้ใช้</th><th>ชื่อ</th><th>สิทธิ์</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="ad-cell-center">กำลังโหลด...</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="ad-carcell__name">{r.username}</span>
                    {r.id === user.id && <span className="ad-you">คุณ</span>}
                  </td>
                  <td>{r.name}</td>
                  <td><span className={`ad-badge ad-badge--${r.role}`}>{ROLE_LABEL[r.role] || r.role}</span></td>
                  <td>
                    <div className="ad-actions">
                      <button className="ad-iconbtn" onClick={() => setEditing(r)}><Pencil size={16} /></button>
                      <button className="ad-iconbtn ad-iconbtn--danger" onClick={() => remove(r)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <UserModal
          row={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function UserModal({ row, onClose, onSaved }) {
  const isEdit = Boolean(row);
  const [form, setForm] = useState({
    username: row?.username || '', name: row?.name || '', role: row?.role || 'staff', password: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await adminUpdate('users', row.id, {
          name: form.name, role: form.role, password: form.password || undefined,
        });
      } else {
        await adminCreate('users', form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="ad-modal" onClick={onClose}>
      <form className="ad-modal__card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="ad-modal__head">
          <h3>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}</h3>
          <button type="button" className="ad-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ad-modal__body">
          {error && <div className="ad-empty ad-empty--error">{error}</div>}
          <label className="ad-field">
            <span>ชื่อผู้ใช้ (สำหรับล็อกอิน)</span>
            <input value={form.username} onChange={(e) => set('username', e.target.value)} disabled={isEdit} placeholder="เช่น sale2" />
            {isEdit && <small className="ad-hint">แก้ไขชื่อผู้ใช้ไม่ได้</small>}
          </label>
          <label className="ad-field">
            <span>ชื่อ-นามสกุล</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="ชื่อที่แสดง" />
          </label>
          <label className="ad-field">
            <span>สิทธิ์การใช้งาน</span>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="staff">เจ้าหน้าที่ (เพิ่ม/แก้ไขรถ)</option>
              <option value="admin">ผู้ดูแลระบบ (เห็นทุกอย่าง)</option>
            </select>
          </label>
          <label className="ad-field">
            <span>{isEdit ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)' : 'รหัสผ่าน'}</span>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
          </label>
        </div>
        <div className="ad-modal__foot">
          <button type="button" className="ad-btn" onClick={onClose}>ยกเลิก</button>
          <button className="ad-btn ad-btn--primary" disabled={saving}><Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  );
}
