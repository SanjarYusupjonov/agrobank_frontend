import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import logo from '../assets/logo226.jpg';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob blob1" />
        <div className="login-blob blob2" />
        <div className="login-blob blob3" />
        <div className="grid-overlay" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon logo-icon--img">
            <img src={logo} alt="Agrobank" className="login-logo-img" />
          </div>
          <div className="logo-text">
            <span className="logo-main">AGROBANK</span>
            <span className="logo-sub">Davomat Nazorati</span>
          </div>
        </div>

        <h1 className="login-title">Xush kelibsiz</h1>
        <p className="login-desc">Hisobingizga kiring</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Foydalanuvchi nomi</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Parol</label>
            <div className="input-icon-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <><LogIn size={16} /> Kirish</>
            )}
          </button>
        </form>

        <p className="login-footer">
          Hisob yo'qmi?{' '}
          <Link to="/register">Ro'yxatdan o'ting</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;