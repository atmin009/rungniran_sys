const BASE = '/api';
const TOKEN_KEY = 'rnk_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    clearToken();
    if (!path.startsWith('/auth')) window.location.href = '/admin/login';
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
  return data;
}

export const adminLogin = (username, password) =>
  request('/auth/login', { method: 'POST', body: { username, password } });

// resource = 'cars' | 'brands' | 'car-types' | 'branches' | 'dealers'
export const adminList = (resource, params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) qs.append(k, v);
  });
  const q = qs.toString();
  return request(`/admin/${resource}${q ? `?${q}` : ''}`);
};
export const adminGet = (resource, id) => request(`/admin/${resource}/${id}`);
export const adminCreate = (resource, body) => request(`/admin/${resource}`, { method: 'POST', body });
export const adminUpdate = (resource, id, body) => request(`/admin/${resource}/${id}`, { method: 'PUT', body });
export const adminRemove = (resource, id) => request(`/admin/${resource}/${id}`, { method: 'DELETE' });

export const adminStats = () => request('/admin/stats');
export const adminOptions = () => request('/admin/options');
export const adminUpdatePin = (pin) => request('/admin/settings/pin', { method: 'PUT', body: { pin } });

async function upload(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  if (res.status === 401) { clearToken(); window.location.href = '/admin/login'; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
  return data;
}

export async function uploadImages(files) {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('files', f));
  const { urls } = await upload('/admin/uploads', fd);
  return urls;
}

export async function importPreview(file) {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/admin/import/cars/preview', fd);
}

export const importCommit = (rows) => request('/admin/import/cars', { method: 'POST', body: { rows } });

export async function downloadTemplate() {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/admin/import/template`, { headers });
  if (!res.ok) throw new Error('ดาวน์โหลดเทมเพลตไม่สำเร็จ');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'car-import-template.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
