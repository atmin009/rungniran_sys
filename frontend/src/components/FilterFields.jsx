import {
  Car, Tag, Wallet, MapPin, User, Settings2, CircleDot, Cog, Check, ChevronDown,
} from 'lucide-react';

const PRICE_PRESETS = [
  { label: 'ไม่เกิน 5 แสน', min: '', max: 500000 },
  { label: '5 แสน - 1 ล้าน', min: 500000, max: 1000000 },
  { label: '1 - 1.5 ล้าน', min: 1000000, max: 1500000 },
  { label: 'มากกว่า 1.5 ล้าน', min: 1500000, max: '' },
];

export default function FilterFields({ meta, value, onChange }) {
  if (!meta) return null;
  const toggle = (key, val) => onChange(key, value[key] === val ? '' : val);
  const set = (key, val) => onChange(key, val);

  const Pill = ({ active, onClick, children }) => (
    <button className={`option ${active ? 'option--active' : ''}`} onClick={onClick}>
      {active && <Check size={14} strokeWidth={3} className="option__check" />}
      {children}
    </button>
  );

  const priceActive = (p) =>
    String(value.minPrice) === String(p.min) && String(value.maxPrice) === String(p.max);

  return (
    <>
      <div className="field">
        <div className="field__label"><CircleDot size={16} /> สถานะรถ</div>
        <div className="options">
          {meta.statuses.map((s) => (
            <Pill key={s.value} active={value.status === s.value} onClick={() => toggle('status', s.value)}>
              {s.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Car size={16} /> ประเภทรถ</div>
        <div className="options">
          {meta.carTypes.map((t) => (
            <Pill key={t.value} active={value.type === t.value} onClick={() => toggle('type', t.value)}>
              {t.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Tag size={16} /> ยี่ห้อรถ</div>
        <div className="options">
          {meta.brands.map((b) => (
            <Pill key={b.name} active={value.brand === b.name} onClick={() => toggle('brand', b.name)}>
              {b.name}<span className="option__count">{b.count}</span>
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Wallet size={16} /> ช่วงราคา</div>
        <div className="options" style={{ marginBottom: 12 }}>
          {PRICE_PRESETS.map((p) => (
            <Pill
              key={p.label}
              active={priceActive(p)}
              onClick={() => {
                const on = priceActive(p);
                set('minPrice', on ? '' : String(p.min));
                set('maxPrice', on ? '' : String(p.max));
              }}
            >{p.label}</Pill>
          ))}
        </div>
        <div className="price-inputs">
          <div className="pricecol">
            <label>ราคาต่ำสุด</label>
            <div className="money">
              <span>฿</span>
              <input
                type="number" inputMode="numeric" placeholder="0"
                value={value.minPrice} onChange={(e) => set('minPrice', e.target.value)}
              />
            </div>
          </div>
          <div className="dash">–</div>
          <div className="pricecol">
            <label>ราคาสูงสุด</label>
            <div className="money">
              <span>฿</span>
              <input
                type="number" inputMode="numeric" placeholder="ไม่จำกัด"
                value={value.maxPrice} onChange={(e) => set('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Settings2 size={16} /> ระบบเกียร์</div>
        <div className="options">
          {meta.transmissions.map((t) => (
            <Pill key={t.value} active={value.transmission === t.value} onClick={() => toggle('transmission', t.value)}>
              {t.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Cog size={16} /> ระบบขับเคลื่อน</div>
        <div className="options">
          {meta.drivetrains.map((d) => (
            <Pill key={d.value} active={value.drivetrain === d.value} onClick={() => toggle('drivetrain', d.value)}>
              {d.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><MapPin size={16} /> สาขาที่รถอยู่</div>
        <div className="select-wrap">
          <select value={value.branch} onChange={(e) => set('branch', e.target.value)}>
            <option value="">ทุกสาขา</option>
            {meta.branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.province})</option>
            ))}
          </select>
          <ChevronDown size={18} className="select-wrap__chev" />
        </div>
      </div>

      <div className="field">
        <div className="field__label"><User size={16} /> ดีลเลอร์</div>
        <div className="select-wrap">
          <select value={value.dealer} onChange={(e) => set('dealer', e.target.value)}>
            <option value="">ดีลเลอร์ทั้งหมด</option>
            {meta.dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown size={18} className="select-wrap__chev" />
        </div>
      </div>
    </>
  );
}
