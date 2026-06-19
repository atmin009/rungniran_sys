import { Router } from 'express';
import { login, verifyPin, issueSaleToken } from '../auth.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    const result = await login(username, password);
    if (!result) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Sale-side PIN gate
router.post('/pin', async (req, res, next) => {
  try {
    const { pin } = req.body || {};
    if (!pin) return res.status(400).json({ error: 'กรุณากรอก PIN' });
    const ok = await verifyPin(pin);
    if (!ok) return res.status(401).json({ error: 'PIN ไม่ถูกต้อง' });
    res.json({ token: issueSaleToken() });
  } catch (err) {
    next(err);
  }
});

export default router;
