import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Tag, Shapes, MapPin, Users, UserCog, KeyRound, LogOut, Menu, ExternalLink, ScrollText,
} from 'lucide-react';
import { useAuth } from './auth.jsx';
import logo from '../logo_rungniran.png';

const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'ภาพรวม' },
  { to: '/admin/cars', icon: Car, label: 'จัดการรถยนต์' },
  { type: 'group', label: 'ข้อมูลตัวกรอง', admin: true },
  { to: '/admin/brands', icon: Tag, label: 'ยี่ห้อรถ', admin: true },
  { to: '/admin/car-types', icon: Shapes, label: 'ประเภทรถ', admin: true },
  { to: '/admin/branches', icon: MapPin, label: 'สาขา', admin: true },
  { to: '/admin/dealers', icon: Users, label: 'ดีลเลอร์', admin: true },
  { type: 'group', label: 'ระบบ', admin: true },
  { to: '/admin/users', icon: UserCog, label: 'ผู้ใช้และสิทธิ์', admin: true },
  { to: '/admin/logs', icon: ScrollText, label: 'บันทึกการใช้งาน', admin: true },
  { to: '/admin/settings', icon: KeyRound, label: 'PIN ฝั่งขาย', admin: true },
];

const ROLE_LABEL = { admin: 'ผู้ดูแลระบบ', staff: 'เจ้าหน้าที่' };

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => { logout(); navigate('/admin/login'); };
  const isAdmin = user?.role === 'admin';
  const items = NAV.filter((item) => !item.admin || isAdmin);

  return (
    <div className="admin">
      {open && <div className="admin__scrim" onClick={() => setOpen(false)} />}
      <aside className={`admin__nav ${open ? 'is-open' : ''}`}>
        <div className="admin__brand">
          <img className="admin__logo" src={logo} alt="รุ่งนิรันดร์กลการ" />
          <div>
            <div className="admin__title">รุ่งนิรันดร์กลการ</div>
            <div className="admin__subtitle">ระบบจัดการหลังบ้าน</div>
          </div>
        </div>

        <nav className="admin__menu">
          {items.map((item, i) => item.type === 'group' ? (
            <div key={i} className="admin__group">{item.label}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin__link ${isActive ? 'is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <item.icon size={19} /> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin__navfoot">
          <a className="admin__link" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={19} /> ดูหน้าเว็บ
          </a>
          <button className="admin__link admin__link--danger" onClick={doLogout}>
            <LogOut size={19} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__topbar">
          <button className="admin__burger" onClick={() => setOpen(true)} aria-label="เมนู">
            <Menu size={22} />
          </button>
          <div className="admin__spacer" />
          <div className="admin__user">
            <div className="admin__avatar">{(user?.name || user?.username || 'A').charAt(0)}</div>
            <div className="admin__userinfo">
              <div className="admin__username">{user?.name || user?.username}</div>
              <div className="admin__role">{ROLE_LABEL[user?.role] || user?.role}</div>
            </div>
          </div>
        </header>
        <main className="admin__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
