import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSettings, FONTS } from '../auth/SettingsContext';
import { User, Palette, Monitor, Save, Check, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';

const THEMES = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function Settings() {
  const { user, authFetch } = useAuth();
  const { appearance, updateAppearance, notifications, updateNotifications } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Profile settings
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    location: '',
  });

  // Password change
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName: profile.fullName }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (password.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: password.current, newPassword: password.new }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPassword({ current: '', new: '', confirm: '', showCurrent: false, showNew: false, showConfirm: false });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Monitor },
    { id: 'security', label: 'Security', icon: AlertTriangle },
  ];

  const handleAppearanceChange = (updates) => {
    updateAppearance(updates);
    setMessage({ type: 'success', text: 'Appearance updated' });
  };

  const handleNotificationChange = (updates) => {
    updateNotifications(updates);
    setMessage({ type: 'success', text: 'Notifications updated' });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account, preferences, and security</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <SettingsSection title="Profile Information" subtitle="Update your personal details">
              <div className="form-grid">
                <div className="field">
                  <label>Full Name</label>
                  <input
                    value={profile.fullName}
                    onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    type="email"
                    placeholder="your@email.com"
                  />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input
                    value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+266 ..."
                  />
                </div>
                <div className="field">
                  <label>Location</label>
                  <input
                    value={profile.location}
                    onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                    placeholder="Maseru, Lesotho"
                  />
                </div>
              </div>
              <div className="field">
                <label>Role</label>
                <input value={user?.role || '—'} readOnly className="readonly" />
              </div>
              <div className="field">
                <label>Vendor Account</label>
                <input value={user?.vendorId ? `Vendor #${user.vendorId}` : 'Not linked to vendor'} readOnly className="readonly" />
              </div>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                <Save size={16} /> Save Changes
              </button>
            </SettingsSection>
          )}

          {activeTab === 'appearance' && (
            <SettingsSection title="Appearance" subtitle="Customize how the app looks and feels">
              <div className="setting-group">
                <h3>Theme</h3>
                <div className="theme-options">
                  {THEMES.map(t => (
                    <button
                      key={t.value}
                      className={`theme-option ${appearance.theme === t.value ? 'selected' : ''}`}
                      onClick={() => handleAppearanceChange({ theme: t.value })}
                    >
                      <span className="theme-icon">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <h3>Font</h3>
                <div className="font-options">
                  {FONTS.map(f => (
                    <button
                      key={f.value}
                      className={`font-option ${appearance.font === f.value ? 'selected' : ''}`}
                      onClick={() => handleAppearanceChange({ font: f.value })}
                      style={{ fontFamily: f.fontFamily }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <h3>Font Size</h3>
                <div className="segmented-control">
                  {['small', 'medium', 'large'].map(s => (
                    <button
                      key={s}
                      className={`segment ${appearance.fontSize === s ? 'active' : ''}`}
                      onClick={() => handleAppearanceChange({ fontSize: s })}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <h3>Display Options</h3>
                <div className="toggle-options">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={appearance.compactMode}
                      onChange={e => handleAppearanceChange({ compactMode: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <div>
                      <strong>Compact Mode</strong>
                      <small>Reduce spacing for more content on screen</small>
                    </div>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={appearance.animations}
                      onChange={e => handleAppearanceChange({ animations: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <div>
                      <strong>Animations</strong>
                      <small>Enable transitions and motion effects</small>
                    </div>
                  </label>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === 'notifications' && (
            <SettingsSection title="Notifications" subtitle="Choose what alerts you receive">
              <div className="toggle-options">
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="toggle-label">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={e => handleNotificationChange({ [key]: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <div>
                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</strong>
                      <small>{getNotificationDescription(key)}</small>
                    </div>
                  </label>
                ))}
              </div>
            </SettingsSection>
          )}

          {activeTab === 'security' && (
            <SettingsSection title="Security" subtitle="Manage your password and account access">
              <div className="form-grid">
                <div className="field">
                  <label>Current Password</label>
                  <div className="password-input">
                    <input
                      type={password.showCurrent ? 'text' : 'password'}
                      value={password.current}
                      onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <button type="button" className="toggle-password" onClick={() => setPassword(p => ({ ...p, showCurrent: !p.showCurrent }))}>
                      {password.showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>New Password</label>
                  <div className="password-input">
                    <input
                      type={password.showNew ? 'text' : 'password'}
                      value={password.new}
                      onChange={e => setPassword(p => ({ ...p, new: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <button type="button" className="toggle-password" onClick={() => setPassword(p => ({ ...p, showNew: !p.showNew }))}>
                      {password.showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <div className="password-input">
                    <input
                      type={password.showConfirm ? 'text' : 'password'}
                      value={password.confirm}
                      onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <button type="button" className="toggle-password" onClick={() => setPassword(p => ({ ...p, showConfirm: !p.showConfirm }))}>
                      {password.showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={loading}>
                <Save size={16} /> Change Password
              </button>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>These actions are irreversible.</p>
                <button className="btn btn-danger" onClick={() => { if (window.confirm('Are you sure you want to deactivate your account? This cannot be undone.')) { /* deactivate */ } }}>
                  Deactivate Account
                </button>
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, subtitle, children }) {
  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function getNotificationDescription(key) {
  const descriptions = {
    emailAlerts: 'Receive email notifications for important events',
    lowStock: 'Get alerts when stock falls below threshold',
    paymentReminders: 'Remind vendors with outstanding balances',
    saleConfirmations: 'Get email when a sale is recorded',
    weeklyReport: 'Receive weekly summary every Monday',
  };
  return descriptions[key] || '';
}