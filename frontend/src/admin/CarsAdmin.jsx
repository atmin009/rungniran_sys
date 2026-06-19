import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Star, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { adminList, adminRemove } from './api.js';
import { STATUS_META, CAR_TYPE_LABEL, formatPrice } from '../constants.js';

export default function CarsAdmin() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminList('cars', { q, status, page, limit: 12, sort: 'newest' })
      .then((res) => { setRows(res.data); setPagination(res.pagination); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, status]);

  const remove = async (car) => {
    if (!window.confirm(`ลบ "${car.brand} ${car.model}" (${car.licensePlate}) ?`)) return;
    try { await adminRemove('cars', car.id); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div>
          <h1>จัดการรถยนต์</h1>
          <p className="ad-sub">ทั้งหมด {pagination.total} คัน</p>
        </div>
        <div className="ad-headbtns">
          <Link className="ad-btn" to="/admin/cars/import"><FileSpreadsheet size={18} /> นำเข้า Excel</Link>
          <Link className="ad-btn ad-btn--primary" to="/admin/cars/new"><Plus size={18} /> เพิ่มรถ</Link>
        </div>
      </div>

      <div className="ad-toolbar">
        <div className="ad-search">
          <Search size={18} />
          <input placeholder="ค้นหายี่ห้อ รุ่น หรือทะเบียน" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="ad-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="available">พร้อมจำหน่าย</option>
          <option value="incoming">กำลังเข้า</option>
          <option value="reserved">ติดจอง</option>
          <option value="sold">ขายแล้ว</option>
        </select>
      </div>

      {error && <div className="ad-empty">{error}</div>}

      <div className="ad-card ad-card--flush">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>รถ</th><th>ประเภท</th><th>ปี</th><th>ราคา</th><th>สาขา</th><th>สถานะ</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="ad-cell-center">กำลังโหลด...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="ad-cell-center">ไม่พบรถยนต์</td></tr>
              ) : rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="ad-carcell">
                      <img className="ad-thumb" src={c.images?.[0]} alt="" />
                      <div>
                        <div className="ad-carcell__name">
                          {c.featured && <Star size={13} className="ad-star" fill="currentColor" />}
                          {c.brand} {c.model}
                        </div>
                        <div className="ad-muted">{c.licensePlate}</div>
                      </div>
                    </div>
                  </td>
                  <td>{CAR_TYPE_LABEL[c.carType] || c.carType}</td>
                  <td>{c.modelYear}</td>
                  <td>฿{formatPrice(c.price)}</td>
                  <td>{c.branch?.name}</td>
                  <td><span className={`ad-badge ${STATUS_META[c.status].className}`}>{STATUS_META[c.status].label}</span></td>
                  <td>
                    <div className="ad-actions">
                      <Link to={`/admin/cars/${c.id}/edit`} className="ad-iconbtn" title="แก้ไข"><Pencil size={16} /></Link>
                      <button className="ad-iconbtn ad-iconbtn--danger" onClick={() => remove(c)} title="ลบ"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="ad-pager">
          <button className="ad-iconbtn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={18} /></button>
          <span>หน้า {pagination.page} / {pagination.totalPages}</span>
          <button className="ad-iconbtn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  );
}
