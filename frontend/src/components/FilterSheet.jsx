import { useEffect, useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import FilterFields from './FilterFields.jsx';
import { fetchFacets } from '../api.js';

export default function FilterSheet({ meta, value, resultCount, onClose, onApply, onClear }) {
  const [draft, setDraft] = useState(value);
  const [facets, setFacets] = useState(null);
  const change = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  // live counts that follow what the user toggles inside the sheet
  useEffect(() => {
    let active = true;
    fetchFacets(draft).then((f) => active && setFacets(f)).catch(() => {});
    return () => { active = false; };
  }, [draft]);

  const count = facets ? facets.total : resultCount;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <div className="sheet__head">
          <h2>ตัวกรอง</h2>
          <button className="close" onClick={onClose} aria-label="ปิด"><X size={22} /></button>
        </div>

        <div className="sheet__body">
          <FilterFields meta={meta} value={draft} onChange={change} facets={facets} />
        </div>

        <div className="sheet__foot">
          <button className="btn btn--ghost" onClick={() => { setDraft(emptyExceptQuery(draft)); onClear(); }}>
            <RotateCcw size={18} /> ล้างค่า
          </button>
          <button className="btn btn--solid" onClick={() => onApply(draft)}>
            <Check size={18} /> ดูผลลัพธ์{typeof count === 'number' ? ` (${count})` : ''}
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
