import { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import FilterFields from './FilterFields.jsx';

export default function FilterSheet({ meta, value, resultCount, onClose, onApply, onClear }) {
  const [draft, setDraft] = useState(value);
  const change = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <div className="sheet__head">
          <h2>ตัวกรอง</h2>
          <button className="close" onClick={onClose} aria-label="ปิด"><X size={22} /></button>
        </div>

        <div className="sheet__body">
          <FilterFields meta={meta} value={draft} onChange={change} />
        </div>

        <div className="sheet__foot">
          <button className="btn btn--ghost" onClick={() => { setDraft(emptyExceptQuery(draft)); onClear(); }}>
            <RotateCcw size={18} /> ล้างค่า
          </button>
          <button className="btn btn--solid" onClick={() => onApply(draft)}>
            <Check size={18} /> ดูผลลัพธ์{typeof resultCount === 'number' ? ` (${resultCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function emptyExceptQuery(draft) {
  return {
    q: draft.q || '', status: '', type: '', brand: '', minPrice: '', maxPrice: '',
    transmission: '', drivetrain: '', branch: '', dealer: '', featured: '',
    sort: draft.sort || 'recommended',
  };
}
