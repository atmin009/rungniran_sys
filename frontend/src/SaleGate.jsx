import { useEffect, useRef, useState } from 'react';
import { Delete, LogIn, AlertCircle } from 'lucide-react';
import { getSaleToken, verifySalePin } from './api.js';
import logo from './logo_rungniran.png';

export default function SaleGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => Boolean(getSaleToken()));

  useEffect(() => {
    const onLocked = () => setUnlocked(false);
    window.addEventListener('sale-locked', onLocked);
    return () => window.removeEventListener('sale-locked', onLocked);
  }, []);

  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  return children;
}

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (value) => {
    setLoading(true);
    setError('');
    try {
      await verifySalePin(value);
      onUnlock();
    } catch (err) {
      setError(err.message);
      setPin('');
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const press = (d) => {
    if (loading) return;
    setError('');
    const next = (pin + d).slice(0, 8);
    setPin(next);
  };
  const back = () => setPin((p) => p.slice(0, -1));

  const onSubmit = (e) => { e.preventDefault(); if (pin.length >= 4) submit(pin); };

  return (
    <div className="pin">
      <form className="pin__card" onSubmit={onSubmit}>
        <img className="pin__logo" src={logo} alt="รุ่งนิรันดร์กลการ" />
        <p className="pin__hint">กรอก PIN เพื่อเข้าใช้งาน</p>

        <input
          ref={inputRef}
          className="pin__hidden"
          type="tel"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          autoComplete="off"
        />

        <div className="pin__dots">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`pin__dot ${i < pin.length ? 'is-on' : ''}`} />
          ))}
        </div>

        {error && <div className="pin__error"><AlertCircle size={16} /> {error}</div>}

        <div className="pin__pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button type="button" key={n} className="pin__key" onClick={() => press(String(n))}>{n}</button>
          ))}
          <button type="button" className="pin__key pin__key--ghost" onClick={back} aria-label="ลบ"><Delete size={22} /></button>
          <button type="button" className="pin__key" onClick={() => press('0')}>0</button>
          <button type="submit" className="pin__key pin__key--ok" disabled={pin.length < 4 || loading} aria-label="ยืนยัน"><LogIn size={22} /></button>
        </div>
      </form>
    </div>
  );
}
