import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { adminList, adminCreate, adminUpdate, adminRemove } from './api.js';

function MasterData({ config }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | row (edit)

  const load = () => {
    setLoading(true);
    adminList(config.resource)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [config.resource]);

  const remove = async (row) => {
    if (!window.confirm(`ลบ "${row[config.fields[0].key] ?? row.label}" ?`)) return;
    try { await adminRemove(config.resource, row.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div>
          <h1>{config.title}</h1>
          <p className="ad-sub">{rows.length} รายการ</p>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => setEditing({})}>
          <Plus size={18} /> {config.addLabel}
        </button>
      </div>

      {error && <div className="ad-empty ad-empty--error">{error}</div>}

      <div className="ad-card ad-card--flush">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                {config.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                <th>จำนวนรถ</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={config.columns.length + 2} className="ad-cell-center">กำลังโหลด...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={config.columns.length + 2} className="ad-cell-center">ยังไม่มีข้อมูล</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((c) => <td key={c.key}>{row[c.key]}</td>)}
                  <td><span className="ad-count">{row.count ?? 0}</span></td>
                  <td>
                    <div className="ad-actions">
                      <button className="ad-iconbtn" onClick={() => setEditing(row)}><Pencil size={16} /></button>
                      <button className="ad-iconbtn ad-iconbtn--danger" onClick={() => remove(row)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal
          config={config}
          row={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function EditModal({ config, row, onClose, onSaved }) {
  const isEdit = Boolean(row);
  const [form, setForm] = useState(() => {
    const base = {};
    config.fields.forEach((f) => {
      base[f.key] = row ? (config.fromRow ? config.fromRow(row)[f.key] : row[f.key]) ?? '' : (f.default ?? '');
    });
    return base;
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = config.toBody(form, isEdit);
      if (isEdit) await adminUpdate(config.resource, row.id, body);
      else await adminCreate(config.resource, body);
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
          <h3>{isEdit ? `แก้ไข${config.singular}` : `เพิ่ม${config.singular}`}</h3>
          <button type="button" className="ad-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ad-modal__body">
          {error && <div className="ad-empty ad-empty--error">{error}</div>}
          {config.fields.map((f) => (
            <label key={f.key} className="ad-field">
              <span>{f.label}</span>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder || ''}
                disabled={isEdit && f.createOnly}
              />
              {isEdit && f.createOnly && <small className="ad-hint">แก้ไขค่านี้ไม่ได้</small>}
            </label>
          ))}
        </div>
        <div className="ad-modal__foot">
          <button type="button" className="ad-btn" onClick={onClose}>ยกเลิก</button>
          <button className="ad-btn ad-btn--primary" disabled={saving}>
            <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------- resource configs ----------------
const brandsConfig = {
  resource: 'brands', title: 'ยี่ห้อรถ', singular: 'ยี่ห้อ', addLabel: 'เพิ่มยี่ห้อ',
  columns: [{ key: 'name', label: 'ชื่อยี่ห้อ' }],
  fields: [{ key: 'name', label: 'ชื่อยี่ห้อ', placeholder: 'เช่น Toyota' }],
  toBody: (f) => ({ name: f.name.trim() }),
};
const carTypesConfig = {
  resource: 'car-types', title: 'ประเภทรถ', singular: 'ประเภทรถ', addLabel: 'เพิ่มประเภท',
  columns: [{ key: 'value', label: 'ค่า (code)' }, { key: 'label', label: 'ชื่อแสดง' }, { key: 'sort_order', label: 'ลำดับ' }],
  fields: [
    { key: 'value', label: 'ค่า (ภาษาอังกฤษ)', placeholder: 'pickup4', createOnly: true },
    { key: 'label', label: 'ชื่อแสดง', placeholder: 'กระบะ 4 ประตู' },
    { key: 'sortOrder', label: 'ลำดับการแสดง', type: 'number', default: 0 },
  ],
  fromRow: (r) => ({ value: r.value, label: r.label, sortOrder: r.sort_order }),
  toBody: (f, isEdit) => isEdit
    ? { label: f.label.trim(), sortOrder: Number(f.sortOrder) || 0 }
    : { value: f.value.trim(), label: f.label.trim(), sortOrder: Number(f.sortOrder) || 0 },
};
const branchesConfig = {
  resource: 'branches', title: 'สาขา', singular: 'สาขา', addLabel: 'เพิ่มสาขา',
  columns: [{ key: 'name', label: 'ชื่อสาขา' }, { key: 'province', label: 'จังหวัด' }],
  fields: [
    { key: 'name', label: 'ชื่อสาขา', placeholder: 'สำนักงานใหญ่' },
    { key: 'province', label: 'จังหวัด', placeholder: 'กรุงเทพมหานคร' },
  ],
  toBody: (f) => ({ name: f.name.trim(), province: f.province.trim() }),
};
const dealersConfig = {
  resource: 'dealers', title: 'ดีลเลอร์', singular: 'ดีลเลอร์', addLabel: 'เพิ่มดีลเลอร์',
  columns: [{ key: 'name', label: 'ชื่อดีลเลอร์' }, { key: 'phone', label: 'เบอร์โทร' }],
  fields: [
    { key: 'name', label: 'ชื่อดีลเลอร์', placeholder: 'รุ่งนิรันดร์' },
    { key: 'phone', label: 'เบอร์โทร', placeholder: '081-111-1111' },
  ],
  toBody: (f) => ({ name: f.name.trim(), phone: f.phone.trim() }),
};

export const BrandsPage = () => <MasterData config={brandsConfig} />;
export const CarTypesPage = () => <MasterData config={carTypesConfig} />;
export const BranchesPage = () => <MasterData config={branchesConfig} />;
export const DealersPage = () => <MasterData config={dealersConfig} />;
