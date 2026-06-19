import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, X, SlidersHorizontal, ArrowUpDown, PackageOpen, RotateCcw, Star,
} from 'lucide-react';
import { fetchCars, fetchFilters } from '../api.js';
import { SORT_OPTIONS, formatPrice } from '../constants.js';
import CarCard from '../components/CarCard.jsx';
import FilterFields from '../components/FilterFields.jsx';
import FilterSheet from '../components/FilterSheet.jsx';
import SaleHeader from '../components/SaleHeader.jsx';

const EMPTY = {
  q: '', status: '', type: '', brand: '', minPrice: '', maxPrice: '',
  transmission: '', drivetrain: '', branch: '', dealer: '', featured: '',
  sort: 'recommended',
};

const STATUS_CHIPS = [
  { value: 'available', label: 'พร้อมจำหน่าย' },
  { value: 'incoming', label: 'กำลังเข้า' },
  { value: 'reserved', label: 'ติดจอง' },
  { value: 'sold', label: 'ขายแล้ว' },
];

export default function CarList() {
  const [filters, setFilters] = useState(EMPTY);
  const [searchInput, setSearchInput] = useState('');
  const [meta, setMeta] = useState(null);
  const [cars, setCars] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstLoad = useRef(true);
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') || '';

  useEffect(() => { fetchFilters().then(setMeta).catch(() => {}); }, []);

  // sync car-type filter from the header quick-menu (URL ?type=)
  useEffect(() => {
    setFilters((f) => (f.type === urlType ? f : { ...f, type: urlType }));
  }, [urlType]);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: searchInput })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCars({ ...filters, page: 1, limit: 12 })
      .then((res) => {
        if (!active) return;
        setCars(res.data);
        setPagination(res.pagination);
      })
      .catch(() => active && setCars([]))
      .finally(() => active && setLoading(false));
    if (!firstLoad.current) window.scrollTo({ top: 0, behavior: 'smooth' });
    firstLoad.current = false;
    return () => { active = false; };
  }, [filters]);

  const loadMore = () => {
    const next = pagination.page + 1;
    fetchCars({ ...filters, page: next, limit: 12 }).then((res) => {
      setCars((prev) => [...prev, ...res.data]);
      setPagination(res.pagination);
    });
  };

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const clearAll = () => setFilters({ ...EMPTY, q: filters.q, sort: filters.sort });

  const activeCount = useMemo(() => {
    const keys = ['status', 'type', 'brand', 'minPrice', 'maxPrice',
      'transmission', 'drivetrain', 'branch', 'dealer', 'featured'];
    return keys.filter((k) => filters[k]).length;
  }, [filters]);

  const activeChips = useMemo(() => {
    if (!meta) return [];
    const find = (arr, v, k = 'value', l = 'label') => arr.find((x) => String(x[k]) === String(v))?.[l];
    const chips = [];
    if (filters.featured) chips.push({ id: 'featured', label: 'รถแนะนำ', clear: () => setFilter('featured', '') });
    if (filters.status) chips.push({ id: 'status', label: find(meta.statuses, filters.status), clear: () => setFilter('status', '') });
    if (filters.type) chips.push({ id: 'type', label: find(meta.carTypes, filters.type), clear: () => setFilter('type', '') });
    if (filters.brand) chips.push({ id: 'brand', label: filters.brand, clear: () => setFilter('brand', '') });
    if (filters.transmission) chips.push({ id: 'transmission', label: find(meta.transmissions, filters.transmission), clear: () => setFilter('transmission', '') });
    if (filters.drivetrain) chips.push({ id: 'drivetrain', label: find(meta.drivetrains, filters.drivetrain), clear: () => setFilter('drivetrain', '') });
    if (filters.branch) chips.push({ id: 'branch', label: find(meta.branches, filters.branch, 'id', 'name'), clear: () => setFilter('branch', '') });
    if (filters.dealer) chips.push({ id: 'dealer', label: find(meta.dealers, filters.dealer, 'id', 'name'), clear: () => setFilter('dealer', '') });
    if (filters.minPrice || filters.maxPrice) {
      const lo = filters.minPrice ? `฿${formatPrice(filters.minPrice)}` : '฿0';
      const hi = filters.maxPrice ? `฿${formatPrice(filters.maxPrice)}` : 'ขึ้นไป';
      chips.push({ id: 'price', label: `${lo} – ${hi}`, clear: () => { setFilter('minPrice', ''); setFilter('maxPrice', ''); } });
    }
    return chips;
  }, [filters, meta]);

  return (
    <>
      <SaleHeader meta={meta} count={pagination.total}>
        <div className="searchbar">
          <div className="search">
            <Search size={18} color="#94a3b8" />
            <input
              placeholder="ค้นหายี่ห้อ รุ่น หรือทะเบียน"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="clear" onClick={() => setSearchInput('')} aria-label="ล้าง">
                <X size={18} />
              </button>
            )}
          </div>
          <button className="iconbtn iconbtn--primary only-mobile" onClick={() => setSheetOpen(true)} aria-label="ตัวกรอง">
            <SlidersHorizontal size={20} />
            {activeCount > 0 && <span className="badge">{activeCount}</span>}
          </button>
        </div>
      </SaleHeader>

      <div className="layout">
        {/* Desktop sidebar */}
        <aside className="sidebar">
          <div className="sidebar__head">
            <span><SlidersHorizontal size={18} /> ตัวกรอง</span>
            {activeCount > 0 && (
              <button className="link-clear" onClick={clearAll}>
                <RotateCcw size={14} /> ล้าง ({activeCount})
              </button>
            )}
          </div>
          <div className="sidebar__body">
            <FilterFields meta={meta} value={filters} onChange={setFilter} />
          </div>
        </aside>

        <main className="content">
          <div className="chips">
            <button
              className={`chip ${!filters.status && !filters.featured ? 'chip--active' : ''}`}
              onClick={() => { setFilter('status', ''); setFilter('featured', ''); }}
            >ทั้งหมด</button>
            <button
              className={`chip chip--star ${filters.featured ? 'chip--active' : ''}`}
              onClick={() => setFilter('featured', filters.featured ? '' : '1')}
            ><Star size={14} fill={filters.featured ? '#fff' : 'none'} /> รถแนะนำ</button>
            {STATUS_CHIPS.map((c) => (
              <button
                key={c.value}
                className={`chip ${filters.status === c.value ? 'chip--active' : ''}`}
                onClick={() => setFilter('status', filters.status === c.value ? '' : c.value)}
              >{c.label}</button>
            ))}
          </div>

          {activeChips.length > 0 && (
            <div className="activebar">
              {activeChips.map((c) => (
                <button key={c.id} className="activebar__chip" onClick={c.clear}>
                  {c.label} <X size={13} strokeWidth={2.5} />
                </button>
              ))}
              <button className="activebar__clear" onClick={clearAll}>ล้างทั้งหมด</button>
            </div>
          )}

          <div className="toolbar">
            <span className="toolbar__hint">พบรถ {pagination.total} คัน</span>
            <label className="sort">
              <ArrowUpDown size={16} />
              <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="grid">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
            </div>
          ) : cars.length === 0 ? (
            <div className="state">
              <PackageOpen size={56} strokeWidth={1.4} />
              <h3>ไม่พบรถยนต์ที่ตรงเงื่อนไข</h3>
              <p>ลองปรับตัวกรองหรือล้างค่าการค้นหา</p>
            </div>
          ) : (
            <>
              <div className="grid">
                {cars.map((car) => <CarCard key={car.id} car={car} />)}
              </div>
              {pagination.page < pagination.totalPages && (
                <button className="loadmore" onClick={loadMore}>โหลดเพิ่มเติม</button>
              )}
            </>
          )}
        </main>
      </div>

      {sheetOpen && (
        <FilterSheet
          meta={meta}
          value={filters}
          resultCount={pagination.total}
          onClose={() => setSheetOpen(false)}
          onApply={(draft) => { setFilters(draft); setSheetOpen(false); }}
          onClear={clearAll}
        />
      )}
    </>
  );
}
