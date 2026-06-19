import { Link } from 'react-router-dom';
import { MapPin, Gauge, Settings2, Calendar, CircleDot, Star } from 'lucide-react';
import {
  STATUS_META, CAR_TYPE_LABEL, gearLabel,
  formatPrice, formatMileage, formatMonthYear,
} from '../constants.js';

export default function CarCard({ car }) {
  const status = STATUS_META[car.status] || STATUS_META.available;
  const cover = car.images?.[0];

  return (
    <Link to={`/cars/${car.id}`} className="card">
      <div className={`card__media ${car.status === 'sold' ? 'sold' : ''}`}>
        {cover && <img src={cover} alt={`${car.brand} ${car.model}`} loading="lazy" />}
        <span className={`status ${status.className}`}>
          <CircleDot size={12} strokeWidth={2.5} />
          {status.label}
        </span>
        {car.featured && (
          <span className="ribbon"><Star size={12} fill="#fff" /> แนะนำ</span>
        )}
        <span className="card__type">{CAR_TYPE_LABEL[car.carType] || car.carType}</span>
      </div>

      <div className="card__body">
        <div className="card__title">{car.brand} {car.model}</div>
        <div className="card__sub">{car.modelYear} · {car.color}</div>
        <div className="card__price">฿{formatPrice(car.price)}</div>

        <div className="card__meta">
          <span><Gauge size={14} />{formatMileage(car.mileage)}</span>
          <span><Settings2 size={14} />{gearLabel(car.transmission, car.drivetrain)}</span>
          <span><MapPin size={14} />{car.branch.name}</span>
          <span><Calendar size={14} />รับเข้า {formatMonthYear(car.purchaseDate)}</span>
        </div>

        <div className="card__plate">ทะเบียน {car.licensePlate}</div>
      </div>
    </Link>
  );
}
