import { useEffect, useState, Fragment } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, RotateCcw, ShieldAlert } from 'lucide-react';
import { adminLogs, adminLogActions } from './api.js';

const ROLE_LABEL = { admin: 'ผู้ดูแล', staff: 'เจ้าหน้าที่', sale: 'ฝั่งขาย', guest: 'ไม่ระบุ' };

const ACTION_LABEL = {
  'login.success': 'เข้าสู่ระบบสำเร็จ',
  'login.fail': 'เข้าสู่ระบบล้มเหลว',
  'pin.success': 'กรอก PIN สำเร็จ',
  'pin.fail': 'กรอก PIN ผิด',
  'pin.change': 'เปลี่ยน PIN ฝั่งขาย',
  'car.view': 'ดูรายละเอียดรถ',
  'cars.create': 'เพิ่มรถ',
  'cars.update': 'แก้ไขรถ',
  'cars.delete': 'ลบรถ',
  'brands.create': 'เพิ่มยี่ห้อ',
  'brands.update': 'แก้ไขยี่ห้อ',
  'brands.delete': 'ลบยี่ห้อ',
  'car-types.create': 'เพิ่มประเภทรถ',
  'car-types.update': 'แก้ไขประเภทรถ',
  'car-types.delete': 'ลบประเภทรถ',
  'branches.create': 'เพิ่มสาขา',
  'branches.update': 'แก้ไขสาขา',
  'branches.delete': 'ลบสาขา',
  'dealers.create': 'เพิ่มดีลเลอร์',
  'dealers.update': 'แก้ไขดีลเลอร์',
  'dealers.delete': 'ลบดีลเลอร์',
  'users.create': 'เพิ่มผู้ใช้',
  'users.update': 'แก้ไขผู้ใช้',
  'users.delete': 'ลบผู้ใช้',
  'upload': 'อัปโหลดรูป',
  'import': 'นำเข้ารถ (Excel)',
};
const actionLabel = (a) => ACTION_LABEL[a] || a;
const isDanger = (a) => a.endsWith('.delete') || a === 'login.fail' || a === 'pin.fail';

function fmt(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const EMPTY = { q: '', role: '', action: '', from: '', to: '' };

export default function Logs() {
  const [filters, setFilters] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ data: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => { adminLogActions().then(setActions).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    adminLogs({ ...filters, page, limit: 30 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const apply = () => { setPage(1); setFilters(draft); };
  const reset = () => { setDraft(EMPTY); setFilters(EMPTY); setPage(1); };
  const onKey = (e) => { if (e.key === 'Enter') apply(); };

  const { pagination } = data;

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div>
          <h1>บันทึกการใช้งาน (Audit Log)</h1>
          <p className="ad-sub">ทั้งหมด {pagination.total.toLocaleString()} รายการ · ใคร ทำอะไร เมื่อไหร่ จาก IP ใด</p>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-toolbar">
          <div className="ad-search">
            <Search size={18} />
            <input
              placeholder="ค้นหา ผู้ใช้ / IP / path / การกระทำ"
              value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              onKeyDown={onKey}
            />
          </div>
          <select className="ad-select" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
            <option value="">ทุกบทบาท</option>
            <option value="admin">ผู้ดูแล</option>
            <option value="staff">เจ้าหน้าที่</option>
            <option value="sale">ฝั่งขาย</option>
            <option value="guest">ไม่ระบุ</option>
          </select>
          <select className="ad-select" value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })}>
            <option value="">ทุกการกระทำ</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>{actionLabel(a.action)} ({a.count})</option>
            ))}
          </select>
          <input type="date" className="ad-select" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} title="ตั้งแต่วันที่" />
          <input type="date" className="ad-select" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} title="ถึงวันที่" />
          <button className="ad-btn ad-btn--primary" onClick={apply}>ค้นหา</button>
          <button className="ad-btn" onClick={reset}><RotateCcw size={16} /> ล้าง</button>
        </div>
      </div>

      {error && <div className="ad-empty ad-empty--error">{error}</div>}

      <div className="ad-card ad-card--flush">
        <div className="ad-table-wrap">
          <table className="ad-table ad-table--log">
            <thead>
              <tr>
                <th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายการ</th><th>IP</th><th>สถานะ</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="ad-cell-center">กำลังโหลด...</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={7} className="ad-cell-center">ไม่พบบันทึกตามเงื่อนไข</td></tr>
              ) : data.data.map((r) => (
                <Fragment key={r.id}>
                  <tr className="ad-logrow" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                    <td className="ad-log-time">{fmt(r.createdAt)}</td>
                    <td>
                      <div className="ad-log-user">{r.actorName || '—'}</div>
                      <span className={`ad-role ad-role--${r.actorRole || 'guest'}`}>{ROLE_LABEL[r.actorRole] || r.actorRole || '-'}</span>
                    </td>
                    <td>
                      <span className={`ad-act ${isDanger(r.action) ? 'ad-act--danger' : ''}`}>
                        {isDanger(r.action) && <ShieldAlert size={13} />} {actionLabel(r.action)}
                      </span>
                    </td>
                    <td className="ad-log-entity">{r.entity || '-'}{r.entityId ? ` #${r.entityId}` : ''}</td>
                    <td className="ad-log-ip">{r.ip || '-'}</td>
                    <td>
                      <span className={`ad-status ${r.status >= 400 ? 'ad-status--bad' : 'ad-status--ok'}`}>{r.status || '-'}</span>
                    </td>
                    <td><ChevronDown size={16} className={`ad-chev ${openId === r.id ? 'is-open' : ''}`} /></td>
                  </tr>
                  {openId === r.id && (
                    <tr className="ad-logdetail">
                      <td colSpan={7}>
                        <div className="ad-logdetail__grid">
                          <div><b>Path</b><span>{r.method} {r.path}</span></div>
                          <div><b>User-Agent</b><span>{r.userAgent || '-'}</span></div>
                          {r.detail != null && (
                            <div className="ad-logdetail__json">
                              <b>รายละเอียด</b>
                              <pre>{JSON.stringify(r.detail, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="ad-pager">
          <button className="ad-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} /> ก่อนหน้า
          </button>
          <span className="ad-pager__info">หน้า {pagination.page} / {pagination.totalPages}</span>
          <button className="ad-btn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            ถัดไป <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
