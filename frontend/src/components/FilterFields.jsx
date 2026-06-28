import {
  Car, Tag, Wallet, MapPin, User, Settings2, CircleDot, Cog, Check, ChevronDown,
} from 'lucide-react';

const PRICE_PRESETS = [
  { label: 'ไม่เกิน 5 แสน', min: '', max: 500000 },
  { label: '5 แสน - 1 ล้าน', min: 500000, max: 1000000 },
  { label: '1 - 1.5 ล้าน', min: 1000000, max: 1500000 },
  { label: 'มากกว่า 1.5 ล้าน', min: 1500000, max: '' },
];

export default function FilterFields({ meta, value, onChange, facets }) {
  if (!meta) return null;
  const toggle = (key, val) => onChange(key, value[key] === val ? '' : val);
  const set = (key, val) => onChange(key, val);

  // contextual count for an option (null = unknown -> don't show/disable)
  const fcount = (group, key) => (facets && facets[group] ? (facets[group][key] ?? 0) : null);

  const Pill = ({ active, onClick, disabled, count, children }) => (
    <button
      className={`option ${active ? 'option--active' : ''} ${disabled ? 'option--off' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {active && <Check size={14} strokeWidth={3} className="option__check" />}
      {children}
      {count != null && <span className="option__count">{count}</span>}
    </button>
  );

  // build pill props: count (facet, fallback to static) + disable when 0 (but never the active one)
  const pill = (group, key, active, staticCount) => {
    const fc = fcount(group, key);
    const count = fc != null ? fc : (staticCount ?? null);
    const disabled = !active && (fc != null ? fc === 0 : staticCount === 0);
    return { count, disabled };
  };

  const priceActive = (p) =>
    String(value.minPrice) === String(p.min) && String(value.maxPrice) === String(p.max);

  return (
    <>
      <div className="field">
        <div className="field__label"><CircleDot size={16} /> สถานะรถ</div>
        <div className="options">
          {meta.statuses.map((s) => {
            const active = value.status === s.value;
            return (
              <Pill key={s.value} active={active} {...pill('statuses', s.value, active)} onClick={() => toggle('status', s.value)}>
                {s.label}
              </Pill>
            );
          })}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Car size={16} /> ประเภทรถ</div>
        <div className="options">
          {meta.carTypes.map((t) => {
            const active = value.type === t.value;
            return (
              <Pill key={t.value} active={active} {...pill('carTypes', t.value, active, t.count)} onClick={() => toggle('type', t.value)}>
                {t.label}
              </Pill>
            );
          })}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Tag size={16} /> ยี่ห้อรถ</div>
        <div className="options">
          {meta.brands.map((b) => {
            const active = value.brand === b.name;
            return (
              <Pill key={b.name} active={active} {...pill('brands', b.name, active, b.count)} onClick={() => toggle('brand', b.name)}>
                {b.name}
              </Pill>
            );
          })}
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
          {meta.transmissions.map((t) => {
            const active = value.transmission === t.value;
            return (
              <Pill key={t.value} active={active} {...pill('transmissions', t.value, active)} onClick={() => toggle('transmission', t.value)}>
                {t.label}
              </Pill>
            );
          })}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><Cog size={16} /> ระบบขับเคลื่อน</div>
        <div className="options">
          {meta.drivetrains.map((d) => {
            const active = value.drivetrain === d.value;
            return (
              <Pill key={d.value} active={active} {...pill('drivetrains', d.value, active)} onClick={() => toggle('drivetrain', d.value)}>
                {d.label}
              </Pill>
            );
          })}
        </div>
      </div>

      <div className="field">
        <div className="field__label"><MapPin size={16} /> สาขาที่รถอยู่</div>
        <div className="select-wrap">
          <select value={value.branch} onChange={(e) => set('branch', e.target.value)}>
            <option value="">ทุกสาขา</option>
            {meta.branches.map((b) => {
              const c = fcount('branches', b.id);
              return (
                <option key={b.id} value={b.id} disabled={c === 0 && String(value.branch) !== String(b.id)}>
                  {b.name} ({b.province}){c != null ? ` · ${c}` : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown size={18} className="select-wrap__chev" />
        </div>
      </div>

      <div className="field">
        <div className="field__label"><User size={16} /> ดีลเลอร์</div>
        <div className="select-wrap">
          <select value={value.dealer} onChange={(e) => set('dealer', e.target.value)}>
            <option value="">ดีลเลอร์ทั้งหมด</option>
            {meta.dealers.map((d) => {
              const c = fcount('dealers', d.id);
              return (
                <option key={d.id} value={d.id} disabled={c === 0 && String(value.dealer) !== String(d.id)}>
                  {d.name}{c != null ? ` · ${c}` : ''}
                </option>
              );
            })}
          </select>
          <ChevronDown size={18} className="select-wrap__chev" />
        </div>
      </div>
    </>
  );
}
