import { Router } from 'express';
import { listCars, getCar } from '../repo.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/cars  -> filtered + paginated list
router.get('/', async (req, res, next) => {
  try {
    const q = req.query;
    const result = await listCars({
      type: q.type, brand: q.brand, status: q.status,
      transmission: q.transmission, drivetrain: q.drivetrain,
      branch: q.branch, dealer: q.dealer,
      minPrice: q.minPrice, maxPrice: q.maxPrice,
      featured: q.featured === '1' || q.featured === 'true',
      q: q.q, sort: q.sort || 'recommended',
      page: Math.max(1, parseInt(q.page) || 1),
      limit: Math.min(48, Math.max(1, parseInt(q.limit) || 12)),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/cars/:id
router.get('/:id', async (req, res, next) => {
  try {
    const car = await getCar(req.params.id);
    if (!car) return res.status(404).json({ error: 'ไม่พบรถยนต์คันนี้' });
    res.json(car);
  } catch (err) {
    next(err);
  }
});

export default router;
