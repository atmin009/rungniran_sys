import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Download, FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Loader2, Tag,
} from 'lucide-react';
import { downloadTemplate, importPreview, importCommit } from './api.js';
import { CAR_TYPE_LABEL, STATUS_META, formatPrice } from '../constants.js';

export default function ImportCars() {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const choose = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setError('');
    setResult(null);
    setPreview(null);
    setLoading(true);
    try {
      setPreview(await importPreview(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    const rows = preview.rows.filter((r) => r.valid);
    if (!rows.length) return;
    setCommitting(true);
    setError('');
    try {
      setResult(await importCommit(rows));
      setPreview(null);
      setFileName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  const dl = async () => { try { await downloadTemplate(); } catch (e) { setError(e.message); } };

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div className="ad-head__back">
          <Link to="/admin/cars" className="ad-iconbtn"><ArrowLeft size={18} /></Link>
          <div>
            <h1>นำเข้ารถจาก Excel</h1>
            <p className="ad-sub">อัปโหลดไฟล์ .xlsx เพื่อเพิ่มรถหลายคันพร้อมกัน</p>
          </div>
        </div>
        <button className="ad-btn" onClick={dl}><Download size={18} /> ดาวน์โหลดเทมเพลต</button>
      </div>

      {error && <div className="ad-empty ad-empty--error">{error}</div>}

      {result ? (
        <div className="ad-card">
          <div className="ad-result">
            <CheckCircle2 size={40} className="ad-result__ok" />
            <h3>นำเข้าสำเร็จ {result.imported} คัน</h3>
            {result.failed.length > 0 && (
              <p className="ad-sub">ไม่สำเร็จ {result.failed.length} แถว: {result.failed.map((f) => `แถว ${f.index}`).join(', ')}</p>
            )}
            <div className="ad-result__actions">
              <Link to="/admin/cars" className="ad-btn ad-btn--primary">ไปที่รายการรถ</Link>
              <button className="ad-btn" onClick={() => setResult(null)}>นำเข้าอีกครั้ง</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="ad-card">
            <ol className="ad-steps">
              <li><b>1.</b> ดาวน์โหลดเทมเพลตแล้วกรอกข้อมูลรถ (คอลัมน์ที่มี * ต้องกรอก)</li>
              <li><b>2.</b> ยี่ห้อ/ประเภท/สาขา/ดีลเลอร์ ต้องตรงกับที่มีในระบบ (ยี่ห้อใหม่จะถูกเพิ่มให้อัตโนมัติ)</li>
              <li><b>3.</b> อัปโหลดไฟล์ ตรวจสอบตัวอย่าง แล้วกดยืนยัน</li>
            </ol>

            <div
              className="uploader"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files[0]); }}
            >
              <input
                ref={fileRef} type="file" hidden
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => choose(e.target.files[0])}
              />
              {loading ? (
                <><Loader2 size={26} className="spin" /><span>กำลังอ่านไฟล์...</span></>
              ) : (
                <>
                  <span className="uploader__icon"><UploadCloud size={24} /></span>
                  <span className="uploader__title">{fileName || 'แตะเพื่อเลือกไฟล์ Excel'}</span>
                  <span className="uploader__hint">รองรับ .xlsx</span>
                </>
              )}
            </div>
          </div>

          {preview && (
            <div className="ad-card ad-card--flush">
              <div className="ad-importbar">
                <div className="ad-importsum">
                  <span className="ad-badge ad-badge--staff"><FileSpreadsheet size={12} /> ทั้งหมด {preview.summary.total}</span>
                  <span className="ad-badge ad-badge--admin"><CheckCircle2 size={12} /> พร้อมนำเข้า {preview.summary.valid}</span>
                  {preview.summary.invalid > 0 && (
                    <span className="ad-badge ad-badge--err"><AlertTriangle size={12} /> มีปัญหา {preview.summary.invalid}</span>
                  )}
                  {preview.summary.newBrands?.length > 0 && (
                    <span className="ad-newbrand"><Tag size={12} /> ยี่ห้อใหม่: {preview.summary.newBrands.join(', ')}</span>
                  )}
                </div>
                <button className="ad-btn ad-btn--primary" disabled={committing || preview.summary.valid === 0} onClick={commit}>
                  {committing ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />}
                  ยืนยันนำเข้า {preview.summary.valid} คัน
                </button>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>แถว</th><th>รถ</th><th>ประเภท</th><th>ราคา</th><th>สถานะ</th><th>ผลตรวจสอบ</th></tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.index} className={r.valid ? '' : 'ad-row--bad'}>
                        <td>{r.index}</td>
                        <td>
                          <div className="ad-carcell__name">{r.data.brand} {r.data.model}</div>
                          <div className="ad-muted">{r.data.licensePlate}</div>
                        </td>
                        <td>{CAR_TYPE_LABEL[r.data.carType] || r.data.carType || '-'}</td>
                        <td>{r.data.price ? `฿${formatPrice(r.data.price)}` : '-'}</td>
                        <td>{STATUS_META[r.data.status]?.label || r.data.status}</td>
                        <td>
                          {r.valid
                            ? <span className="ad-okmark"><CheckCircle2 size={14} /> ผ่าน{r.newBrand ? ' (เพิ่มยี่ห้อใหม่)' : ''}</span>
                            : <span className="ad-errmark"><AlertTriangle size={14} /> {r.errors.join(', ')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
