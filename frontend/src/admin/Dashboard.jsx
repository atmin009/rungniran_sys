import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Wallet, Star, Tag, Shapes, MapPin, Users, Plus, CircleDot,
} from 'lucide-react';
import { adminStats } from './api.js';
import { useAuth } from './auth.jsx';
import { STATUS_META, formatPrice, CAR_TYPE_LABEL } from '../constants.js';

const STATUS_ORDER = ['available', 'incoming', 'reserved', 'sold'];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { adminStats().then(setStats).catch((e) => setError(e.message)); }, []);

  if (error) return <div className="ad-empty">{error}</div>;
  if (!stats) return <div className="ad-loading">กำลังโหลด...</div>;

  return (
    <div className="ad-page">
      <div className="ad-head">
        <div>
          <h1>ภาพรวม</h1>
          <p className="ad-sub">สรุปสต๊อกรถและข้อมูลระบบ</p>
        </div>
        <Link className="ad-btn ad-btn--primary" to="/admin/cars/new"><Plus size={18} /> เพิ่มรถ</Link>
      </div>

      <div className="ad-stats">
        <Stat icon={<Car size={22} />} label="รถทั้งหมด" value={`${stats.total} คัน`} tone="blue" />
        {isAdmin && (
          <Stat icon={<Wallet size={22} />} label="มูลค่าสต๊อกรวม" value={`฿${formatPrice(stats.totalValue)}`} tone="green" />
        )}
        <Stat icon={<Star size={22} />} label="รถแนะนำ" value={`${stats.featured} คัน`} tone="amber" />
        <Stat icon={<CircleDot size={22} />} label="พร้อมจำหน่าย" value={`${stats.byStatus.available || 0} คัน`} tone="teal" />
      </div>

      <div className="ad-grid2">
        <div className="ad-card">
          <h3>สถานะรถ</h3>
          <div className="ad-statuslist">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="ad-statusrow">
                <span className={`ad-badge ${STATUS_META[s].className}`}>
                  <CircleDot size={11} strokeWidth={2.5} /> {STATUS_META[s].label}
                </span>
                <span className="ad-statusrow__n">{stats.byStatus[s] || 0} คัน</span>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="ad-card">
            <h3>ข้อมูลตัวกรอง</h3>
            <div className="ad-quicklinks">
              <QuickLink to="/admin/brands" icon={<Tag size={18} />} label="ยี่ห้อรถ" n={stats.counts.brands} />
              <QuickLink to="/admin/car-types" icon={<Shapes size={18} />} label="ประเภทรถ" n={stats.counts.carTypes} />
              <QuickLink to="/admin/branches" icon={<MapPin size={18} />} label="สาขา" n={stats.counts.branches} />
              <QuickLink to="/admin/dealers" icon={<Users size={18} />} label="ดีลเลอร์" n={stats.counts.dealers} />
            </div>
          </div>
        )}
      </div>

      <div className="ad-card">
        <div className="ad-card__head">
          <h3>รถที่เพิ่มล่าสุด</h3>
          <Link to="/admin/cars" className="ad-link">ดูทั้งหมด</Link>
        </div>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr><th>รถ</th><th>ประเภท</th><th>ราคา</th><th>สถานะ</th></tr>
            </thead>
            <tbody>
              {stats.recent.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/admin/cars/${c.id}/edit`} className="ad-link">{c.brand} {c.model}</Link><div className="ad-muted">{c.licensePlate}</div></td>
                  <td>{CAR_TYPE_LABEL[c.carType] || c.carType}</td>
                  <td>฿{formatPrice(c.price)}</td>
                  <td><span className={`ad-badge ${STATUS_META[c.status].className}`}>{STATUS_META[c.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }) {
  return (
    <div className={`ad-stat ad-stat--${tone}`}>
      <span className="ad-stat__icon">{icon}</span>
      <div>
        <div className="ad-stat__value">{value}</div>
        <div className="ad-stat__label">{label}</div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label, n }) {
  return (
    <Link to={to} className="ad-quicklink">
      <span className="ad-quicklink__icon">{icon}</span>
      <span className="ad-quicklink__label">{label}</span>
      <span className="ad-quicklink__n">{n}</span>
    </Link>
  );
}
