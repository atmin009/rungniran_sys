import { Router } from 'express';
import { getFilters } from '../repo.js';
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

export default router;
