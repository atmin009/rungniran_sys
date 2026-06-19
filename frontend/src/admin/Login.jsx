import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from './auth.jsx';
import logo from '../logo_rungniran.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__brand">
          <img className="login__logo" src={logo} alt="รุ่งนิรันดร์กลการ" />
          <h1>รุ่งนิรันดร์กลการ</h1>
          <p>ระบบจัดการหลังบ้าน</p>
        </div>

        {error && <div className="login__error"><AlertCircle size={16} /> {error}</div>}

        <label className="login__field">
          <span>ชื่อผู้ใช้</span>
          <div className="login__input">
            <User size={18} />
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="admin" autoComplete="username" autoFocus
            />
          </div>
        </label>

        <label className="login__field">
          <span>รหัสผ่าน</span>
          <div className="login__input">
            <Lock size={18} />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
            />
          </div>
        </label>

        <button className="login__btn" disabled={loading}>
          <LogIn size={18} /> {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        <div className="login__hint">บัญชีเริ่มต้น: admin / admin123</div>
      </form>
    </div>
  );
}
