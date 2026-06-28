const BASE = '/api';
const SALE_KEY = 'rnk_sale_token';

export const getSaleToken = () => localStorage.getItem(SALE_KEY);
export const setSaleToken = (t) => localStorage.setItem(SALE_KEY, t);
export const clearSaleToken = () => localStorage.removeItem(SALE_KEY);

async function request(path) {
  const headers = {};
  const token = getSaleToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (res.status === 401) {
    clearSaleToken();
    window.dispatchEvent(new Event('sale-locked'));
    throw new Error('กรุณากรอก PIN เพื่อเข้าใช้งาน');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
  return res.json();
}

export async function verifySalePin(pin) {
  const res = await fetch(`${BASE}/auth/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'PIN ไม่ถูกต้อง');
  setSaleToken(data.token);
  return data.token;
}

export function fetchCars(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) qs.append(k, v);
  });
  const query = qs.toString();
  return request(`/cars${query ? `?${query}` : ''}`);
}

export function fetchCar(id) {
  return request(`/cars/${id}`);
}

export function fetchFilters() {
  return request('/meta/filters');
}

export function fetchFacets(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) qs.append(k, v);
  });
  const query = qs.toString();
  return request(`/meta/facets${query ? `?${query}` : ''}`);
}
