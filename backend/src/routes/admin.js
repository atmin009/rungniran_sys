import { Router } from 'express';
import { requireStaff, requireAdmin, setPin } from '../auth.js';
import { uploadCarImages, uploadSheet, publicUrl } from '../uploads.js';
import { buildTemplate, parseAndValidate } from '../import.js';
import { auditAdmin } from '../audit.js';
import * as repo from '../repo.js';

const router = Router();
router.use(requireStaff);
router.use(auditAdmin); // log every write (POST/PUT/PATCH/DELETE) with user + IP

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const runMulter = (mw) => (req, res, next) => mw(req, res, (err) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

router.get('/me', (req, res) => res.json({ user: req.user }));

// Stats — financial totals visible to admin only
router.get('/stats', wrap(async (req, res) => {
  const stats = await repo.getStats();
  if (req.user.role !== 'admin') delete stats.totalValue;
  res.json(stats);
}));

// Cars
router.get('/cars', wrap(async (req, res) => {
  const q = req.query;
  const result = await repo.listCars({
    type: q.type, brand: q.brand, status: q.status, transmission: q.transmission,
    drivetrain: q.drivetrain, branch: q.branch, dealer: q.dealer,
    minPrice: q.minPrice, maxPrice: q.maxPrice,
    featured: q.featured === '1' || q.featured === 'true',
    q: q.q, sort: q.sort || 'newest',
    page: Math.max(1, parseInt(q.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(q.limit) || 20)),
  });
  res.json(result);
}));
router.get('/cars/:id', wrap(async (req, res) => {
  const car = await repo.getCar(req.params.id);
  if (!car) return res.status(404).json({ error: 'ไม่พบรถยนต์คันนี้' });
  res.json(car);
}));
router.post('/cars', wrap(async (req, res) => res.status(201).json(await repo.createCar(req.body))));
router.put('/cars/:id', wrap(async (req, res) => {
  const car = await repo.updateCar(req.params.id, req.body);
  if (!car) return res.status(404).json({ error: 'ไม่พบรถยนต์คันนี้' });
  res.json(car);
}));
router.delete('/cars/:id', wrap(async (req, res) => { await repo.deleteCar(req.params.id); res.json({ ok: true }); }));

// Image upload (staff + admin)
router.post('/uploads', runMulter(uploadCarImages), wrap(async (req, res) => {
  const urls = (req.files || []).map((f) => publicUrl(f.filename));
  res.status(201).json({ urls });
}));

// Excel import (staff + admin)
router.get('/import/template', wrap(async (req, res) => {
  const buf = buildTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="car-import-template.xlsx"');
  res.send(buf);
}));
router.post('/import/cars/preview', runMulter(uploadSheet), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'กรุณาเลือกไฟล์ Excel' });
  const filters = await repo.getFilters();
  res.json(parseAndValidate(req.file.buffer, filters));
}));
router.post('/import/cars', wrap(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  let imported = 0;
  const failed = [];
  for (const row of rows) {
    try {
      if (row.newBrand && row.data.brand) await repo.ensureBrand(row.data.brand);
      await repo.createCar(row.data);
      imported += 1;
    } catch (err) {
      failed.push({ index: row.index, error: err.message });
    }
  }
  res.json({ imported, failed });
}));

// Master data management — admin only
router.use(['/brands', '/car-types', '/branches', '/dealers', '/users', '/settings'], requireAdmin);

// Brands
router.get('/brands', wrap(async (req, res) => res.json(await repo.listBrands())));
router.post('/brands', wrap(async (req, res) => res.status(201).json(await repo.createBrand(req.body.name))));
router.put('/brands/:id', wrap(async (req, res) => res.json(await repo.updateBrand(req.params.id, req.body.name))));
router.delete('/brands/:id', wrap(async (req, res) => { await repo.deleteBrand(req.params.id); res.json({ ok: true }); }));

// Car types
router.get('/car-types', wrap(async (req, res) => res.json(await repo.listCarTypes())));
router.post('/car-types', wrap(async (req, res) => res.status(201).json(await repo.createCarType(req.body))));
router.put('/car-types/:id', wrap(async (req, res) => res.json(await repo.updateCarType(req.params.id, req.body))));
router.delete('/car-types/:id', wrap(async (req, res) => { await repo.deleteCarType(req.params.id); res.json({ ok: true }); }));

// Branches
router.get('/branches', wrap(async (req, res) => res.json(await repo.listBranchesAdmin())));
router.post('/branches', wrap(async (req, res) => res.status(201).json(await repo.createBranch(req.body))));
router.put('/branches/:id', wrap(async (req, res) => res.json(await repo.updateBranch(req.params.id, req.body))));
router.delete('/branches/:id', wrap(async (req, res) => { await repo.deleteBranch(req.params.id); res.json({ ok: true }); }));

// Dealers
router.get('/dealers', wrap(async (req, res) => res.json(await repo.listDealersAdmin())));
router.post('/dealers', wrap(async (req, res) => res.status(201).json(await repo.createDealer(req.body))));
router.put('/dealers/:id', wrap(async (req, res) => res.json(await repo.updateDealer(req.params.id, req.body))));
router.delete('/dealers/:id', wrap(async (req, res) => { await repo.deleteDealer(req.params.id); res.json({ ok: true }); }));

// Users (admin only)
router.get('/users', wrap(async (req, res) => res.json(await repo.listUsers())));
router.post('/users', wrap(async (req, res) => res.status(201).json(await repo.createUser(req.body))));
router.put('/users/:id', wrap(async (req, res) => res.json(await repo.updateUser(req.params.id, req.body))));
router.delete('/users/:id', wrap(async (req, res) => { await repo.deleteUser(req.params.id, req.user.id); res.json({ ok: true }); }));

// Settings — change sale PIN (admin only)
router.put('/settings/pin', wrap(async (req, res) => { await setPin(req.body.pin); res.json({ ok: true }); }));

// Audit logs (admin only) — view who did what, from where
router.use(['/logs'], requireAdmin);
router.get('/logs', wrap(async (req, res) => {
  const q = req.query;
  res.json(await repo.listAuditLogs({
    q: q.q, action: q.action, role: q.role, from: q.from, to: q.to,
    page: Math.max(1, parseInt(q.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(q.limit) || 30)),
  }));
}));
router.get('/logs/actions', wrap(async (req, res) => res.json(await repo.listAuditActions())));

// Option constants for forms (staff + admin)
router.get('/options', wrap(async (req, res) => res.json(await repo.getFilters())));

export default router;
