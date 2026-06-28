import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { fetchFilters } from '../api.js';
import logo from '../logo_rungniran.png';

// shared cache so the header doesn't refetch meta on every navigation
let metaCache = null;

export default function SaleHeader({ meta: metaProp, count, onBack, onShare, children }) {
  const [meta, setMeta] = useState(metaProp || metaCache);
  const location = useLocation();
  const [params] = useSearchParams();
  const activeType = location.pathname === '/' ? (params.get('type') || '') : null;

  useEffect(() => {
    if (metaProp) { metaCache = metaProp; setMeta(metaProp); return; }
    if (metaCache) return;
    fetchFilters().then((m) => { metaCache = m; setMeta(m); }).catch(() => {});
  }, [metaProp]);

  const types = (meta?.carTypes || []).filter((t) => Number(t.count ?? 1) > 0);
  const total = types.reduce((s, t) => s + Number(t.count || 0), 0);

  return (
    <header className="appbar">
      <div className="appbar__row">
        {onBack && (
          <button className="appbar__back" onClick={onBack} aria-label="ย้อนกลับ">
            <ChevronLeft size={22} />
          </button>
        )}
        <Link to="/" className="appbar__brand">
          <img className="logo" src={logo} alt="รุ่งนิรันดร์กลการ" />
          <span>รุ่งนิรันดร์กลการ</span>
          <span className="appbar__tag">ฝั่งเซล</span>
        </Link>
        {onShare ? (
          <button className="appbar__back" onClick={onShare} aria-label="แชร์" style={{ marginLeft: 'auto' }}>
            <Share2 size={18} />
          </button>
        ) : count != null ? (
          <span className="appbar__count">{count} คัน</span>
        ) : null}
      </div>

      {children}

      <nav className="navmenu" aria-label="ประเภทรถ">
        <Link to="/" className={`navmenu__item ${activeType === '' ? 'is-active' : ''}`}>
          ทั้งหมด{total > 0 && <span className="navmenu__n">{total}</span>}
        </Link>
        {types.map((t) => (
          <Link
            key={t.value}
            to={`/?type=${encodeURIComponent(t.value)}`}
            className={`navmenu__item ${activeType === t.value ? 'is-active' : ''}`}
          >
            {t.label}<span className="navmenu__n">{t.count}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
