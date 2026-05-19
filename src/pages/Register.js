import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Building2, Eye, EyeOff } from 'lucide-react';
import './Login.css';
import './Register.css';

const DEPARTMENTS = [
  { id: 1, name: 'IT Bo\'lim' },
  { id: 2, name: 'Moliya Bo\'limi' },
  { id: 3, name: 'Kredit Bo\'limi' },
  { id: 4, name: 'Xavfsizlik Bo\'limi' },
  { id: 5, name: 'Kadrlar Bo\'limi' },
];

const Register = () => {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    type: 'DEPARTMENT_HEAD',
    departmentId: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
    };
    const res = await register(payload);
    if (res.success) {
      setSuccessMsg(res.message || 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
      setTimeout(() => navigate('/login'), 1800);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob blob1" />
        <div className="login-blob blob2" />
        <div className="login-blob blob3" />
        <div className="grid-overlay" />
      </div>

      <div className="login-card reg-card">
        <div className="login-logo">
          <div className="logo-icon">
            <Building2 size={28} />
          </div>
          <div className="logo-text">
            <span className="logo-main">AGROBANK</span>
            <span className="logo-sub">Davomat Nazorati</span>
          </div>
        </div>

        <h1 className="login-title">Ro'yxatdan o'tish</h1>
        <p className="login-desc">Yangi hisob yarating</p>

        {error && (
          <div className="alert alert-error"><span>⚠</span> {error}</div>
        )}
        {successMsg && (
          <div className="alert alert-success"><span>✓</span> {successMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-row">
            <div className="form-group">
              <label>To'liq ism</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Abdullayev Abdulla"
                required
              />
            </div>
            <div className="form-group">
              <label>Foydalanuvchi nomi</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="abdulla_99"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Parol</label>
            <div className="input-icon-wrap">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rol</label>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="ADMIN">Admin</option>
                <option value="DEPARTMENT_HEAD">Bo'lim boshlig'i</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bo'lim (ixtiyoriy)</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange}>
                <option value="">— Tanlang —</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <><UserPlus size={16} /> Ro'yxatdan o'tish</>}
          </button>
        </form>

        <p className="login-footer">
          Hisobingiz bormi? <Link to="/login">Kirish</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
