import { Router } from 'express';
import { getFilters, getFacets } from '../repo.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/meta/filters -> options for building filter UI
router.get('/filters', async (req, res, next) => {
  try {
    res.json(await getFilters());
  } catch (err) {
    next(err);
  }
});

// GET /api/meta/facets -> contextual counts per option for the CURRENT filters
router.get('/facets', async (req, res, next) => {
  try {
    const q = req.query;
    res.json(await getFacets({
      type: q.type, brand: q.brand, status: q.status,
      transmission: q.transmission, drivetrain: q.drivetrain,
      branch: q.branch, dealer: q.dealer,
      minPrice: q.minPrice, maxPrice: q.maxPrice,
      featured: q.featured, q: q.q,
    }));
  } catch (err) {
    next(err);
  }
});

export default router;
