import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CircleDot, Gauge, Settings2, Fuel, Calendar,
  Palette, Car, MapPin, User, FileText, Hash, BadgeInfo, Cog, Star,
  CalendarCheck, Cpu, Users, DoorOpen, ListChecks, Check, Copy,
} from 'lucide-react';
import { fetchCar } from '../api.js';
import SaleHeader from '../components/SaleHeader.jsx';
import {
  STATUS_META, CAR_TYPE_LABEL, TRANSMISSION_LABEL, DRIVETRAIN_LABEL, FUEL_LABEL,
  formatPrice, formatDate, formatMileage, gearLabel,
} from '../constants.js';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [error, setError] = useState(null);
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState('');
  const trackRef = useRef(null);

  const copyText = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? '' : c)), 1800);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCar(id).then(setCar).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="state" style={{ paddingTop: 120 }}>
        <BadgeInfo size={56} strokeWidth={1.4} />
        <h3>{error}</h3>
        <button className="loadmore" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  if (!car) {
    return (
      <div style={{ padding: 16, paddingTop: 64 }}>
        <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 28, width: '70%', marginTop: 20, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 20, width: '40%', marginTop: 12, borderRadius: 8 }} />
      </div>
    );
  }

  const status = STATUS_META[car.status] || STATUS_META.available;
  const images = car.images?.length ? car.images : [''];

  const descText = (car.description || '').trim();
  const infoText = [
    `${car.brand} ${car.model}`,
    `ราคา ฿${formatPrice(car.price)}`,
    `ประเภทรถ: ${CAR_TYPE_LABEL[car.carType] || '-'}`,
    `ทะเบียน: ${car.licensePlate}`,
    `ปี: ${car.modelYear}`,
    `วันจดทะเบียน: ${formatDate(car.registrationDate)}`,
    `เครื่องยนต์: ${car.engine || '-'}`,
    `ระบบเกียร์: ${gearLabel(car.transmission, car.drivetrain)}`,
    `เชื้อเพลิง: ${FUEL_LABEL[car.fuelType] || '-'}`,
    `ที่นั่ง: ${car.seats ? `${car.seats} ที่นั่ง` : '-'}${car.doors ? ` / ${car.doors} ประตู` : ''}`,
    `สีรถ: ${car.color || '-'}${car.colorCode ? ` (${car.colorCode})` : ''}`,
    `เลขไมล์: ${formatMileage(car.mileage)}`,
    `สถานะ: ${status.label}${car.featured ? ' (รถแนะนำ)' : ''}`,
    `สาขา: ${car.branch.name} (${car.branch.province})`,
    `ดีลเลอร์: ${car.dealer.name}`,
  ].join('\n');

  const onGalleryScroll = (e) => {
    const i = Math.round(e.target.scrollLeft / e.target.clientWidth);
    setSlide(i);
  };
  const goTo = (i) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setSlide(i);
  };

  const share = async () => {
    const data = { title: `${car.brand} ${car.model}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelled */ } }
    else { navigator.clipboard?.writeText(window.location.href); }
  };

  return (
    <div className="detail">
      <SaleHeader onBack={() => navigate(-1)} onShare={share} />

      <div className="detail__wrap">
        {/* ---------- Gallery panel ---------- */}
        <div className="gallery-col">
          <div className="gallery">
            <div className="gallery__track" ref={trackRef} onScroll={onGalleryScroll}>
              {images.map((src, i) => (
                <img key={i} src={src} alt={`${car.brand} ${car.model} ${i + 1}`} />
              ))}
            </div>
            {images.length > 1 && (
              <div className="gallery__dots">
                {images.map((_, i) => <i key={i} className={i === slide ? 'on' : ''} />)}
              </div>
            )}
            <span className="gallery__count">{slide + 1}/{images.length}</span>
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`thumb ${i === slide ? 'thumb--active' : ''}`}
                  onClick={() => goTo(i)}
                >
                  <img src={src} alt={`thumb ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Buy box ---------- */}
        <aside className="buybox">
          <div className="detail__head">
            <div style={{ flex: 1 }}>
              {car.featured && <span className="ribbon ribbon--inline"><Star size={12} fill="#fff" /> รถแนะนำ</span>}
              <h1>{car.brand} {car.model}</h1>
              <div className="sub">{car.modelYear} · {CAR_TYPE_LABEL[car.carType]} · {car.color}</div>
            </div>
            <span className={`status ${status.className}`} style={{ position: 'static' }}>
              <CircleDot size={12} strokeWidth={2.5} /> {status.label}
            </span>
          </div>

          <div className="detail__price">฿{formatPrice(car.price)}</div>
          <div className="plate-line"><Hash size={15} /> ทะเบียน {car.licensePlate}</div>

          <div className="specs">
            <Spec icon={<Gauge size={18} />} k="เลขไมล์" v={formatMileage(car.mileage)} />
            <Spec icon={<Settings2 size={18} />} k="เกียร์" v={TRANSMISSION_LABEL[car.transmission]} />
            <Spec icon={<Cog size={18} />} k="ขับเคลื่อน" v={DRIVETRAIN_LABEL[car.drivetrain]} />
            <Spec icon={<Fuel size={18} />} k="เชื้อเพลิง" v={FUEL_LABEL[car.fuelType]} />
            <Spec icon={<Cpu size={18} />} k="เครื่องยนต์" v={car.engine || '-'} />
            <Spec icon={<Users size={18} />} k="ที่นั่ง" v={car.seats ? `${car.seats} ที่นั่ง` : '-'} />
          </div>

          <div className="dealer-card">
            <div className="dealer-card__info">
              <div className="avatar"><User size={20} /></div>
              <div>
                <div className="dealer-card__name">{car.dealer.name}</div>
                <div className="dealer-card__role">ดีลเลอร์ · {car.branch.name}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ---------- Full-width content sections ---------- */}
      <div className="detail__sections">
        <div className="panel">
          <div className="panel__head">
            <h3><FileText size={17} /> รายละเอียดรถ</h3>
            <button
              type="button"
              className={`copybtn ${copied === 'desc' ? 'copybtn--done' : ''}`}
              onClick={() => copyText('desc', descText || `${car.brand} ${car.model}`)}
            >
              {copied === 'desc'
                ? <><Check size={15} strokeWidth={3} /> คัดลอกแล้ว</>
                : <><Copy size={15} /> คัดลอก</>}
            </button>
          </div>
          <p className="panel__desc">{car.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h3><BadgeInfo size={17} /> ข้อมูลรถ</h3>
            <button
              type="button"
              className={`copybtn ${copied === 'info' ? 'copybtn--done' : ''}`}
              onClick={() => copyText('info', infoText)}
            >
              {copied === 'info'
                ? <><Check size={15} strokeWidth={3} /> คัดลอกแล้ว</>
                : <><Copy size={15} /> คัดลอก</>}
            </button>
          </div>
          <div className="infolist">
            <Row icon={<Car size={16} />} label="ประเภทรถยนต์" value={CAR_TYPE_LABEL[car.carType]} />
            <Row icon={<Hash size={16} />} label="เลขทะเบียน" value={car.licensePlate} />
            <Row icon={<Calendar size={16} />} label="ปี" value={car.modelYear} />
            <Row icon={<CalendarCheck size={16} />} label="วันจดทะเบียน" value={formatDate(car.registrationDate)} />
            <Row icon={<Cpu size={16} />} label="เครื่องยนต์" value={car.engine || '-'} />
            <Row icon={<Settings2 size={16} />} label="ระบบเกียร์" value={gearLabel(car.transmission, car.drivetrain)} />
            <Row icon={<Users size={16} />} label="จำนวนที่นั่ง" value={car.seats ? `${car.seats} ที่นั่ง` : '-'} />
            <Row icon={<DoorOpen size={16} />} label="จำนวนประตู" value={car.doors ? `${car.doors} ประตู` : '-'} />
            <Row icon={<Palette size={16} />} label="สีรถ" value={`${car.color}${car.colorCode ? ` ${car.colorCode}` : ''}`} />
            <Row icon={<CircleDot size={16} />} label="สถานะรถ" value={`${status.label}${car.featured ? ' (รถแนะนำ)' : ''}`} />
            <Row icon={<Calendar size={16} />} label="วันที่รับรถเข้า" value={formatDate(car.purchaseDate)} />
            <Row icon={<MapPin size={16} />} label="สาขา" value={`${car.branch.name} (${car.branch.province})`} />
            <Row icon={<User size={16} />} label="ดีลเลอร์" value={car.dealer.name} />
          </div>
        </div>

        {car.equipment?.length > 0 && (
          <div className="panel panel--span">
            <h3><ListChecks size={17} /> อุปกรณ์และออปชั่น</h3>
            <div className="equip">
              {car.equipment.map((item) => (
                <div key={item} className="equip__item">
                  <span className="equip__chk"><Check size={13} strokeWidth={3} /></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ icon, k, v }) {
  return (
    <div className="spec">
      <span className="ic">{icon}</span>
      <div><div className="k">{k}</div><div className="v">{v}</div></div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="inforow">
      <span className="label">{icon} {label}</span>
      <span className="value">{value}</span>
    </div>
  );
}
