import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#2d6a3a" strokeWidth="2"/>
              <path d="M24 14v14M17 21h14" stroke="#2d6a3a" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="24" cy="34" r="3" fill="#2d6a3a"/>
            </svg>
          </div>
          <h1>Batloung Farm</h1>
          <p>Distribution System · Maseru, Lesotho</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@batloungfarm.ls"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="login-demo">
          <p className="demo-title">Demo Accounts</p>
          <div className="demo-grid">
            <button type="button" className="demo-btn" onClick={() => { setEmail('admin@batloungfarm.ls'); setPassword('admin123'); }}>
              <span className="demo-role">Admin</span>
              <span className="demo-email">admin@batloungfarm.ls</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => { setEmail('maseru@vendor.ls'); setPassword('vendor123'); }}>
              <span className="demo-role">Vendor</span>
              <span className="demo-email">maseru@vendor.ls</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => { setEmail('leribe@vendor.ls'); setPassword('vendor123'); }}>
              <span className="demo-role">Vendor</span>
              <span className="demo-email">leribe@vendor.ls</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => { setEmail('berea@vendor.ls'); setPassword('vendor123'); }}>
              <span className="demo-role">Vendor</span>
              <span className="demo-email">berea@vendor.ls</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => { setEmail('mafeteng@vendor.ls'); setPassword('vendor123'); }}>
              <span className="demo-role">Vendor</span>
              <span className="demo-email">mafeteng@vendor.ls</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => { setEmail('qacha@vendor.ls'); setPassword('vendor123'); }}>
              <span className="demo-role">Vendor</span>
              <span className="demo-email">qacha@vendor.ls</span>
            </button>
            <button type="button" className="demo-btn" onClick={() => { setEmail('mokhotlong@vendor.ls'); setPassword('vendor123'); }}>
              <span className="demo-role">Vendor</span>
              <span className="demo-email">mokhotlong@vendor.ls</span>
            </button>
          </div>
          <p className="demo-hint">Click any account to auto-fill · Password: admin123 / vendor123</p>
        </div>
      </div>
    </div>
  );
}