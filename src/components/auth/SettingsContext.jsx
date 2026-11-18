import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const FONTS = [
  { value: 'system', label: 'System Default', fontFamily: 'inherit' },
  { value: 'inter', label: 'Inter', fontFamily: "'Inter', sans-serif" },
  { value: 'dm-sans', label: 'DM Sans', fontFamily: "'DM Sans', sans-serif" },
  { value: 'roboto', label: 'Roboto', fontFamily: "'Roboto', sans-serif" },
  { value: 'open-sans', label: 'Open Sans', fontFamily: "'Open Sans', sans-serif" },
];

export function SettingsProvider({ children }) {
  const [appearance, setAppearance] = useState({
    theme: 'system',
    font: 'dm-sans',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    lowStock: true,
    paymentReminders: true,
    saleConfirmations: true,
    weeklyReport: false,
  });

  // Apply theme globally
  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bf_theme', theme);
  }, []);

  // Apply font globally
  const applyFont = useCallback((fontValue) => {
    const font = FONTS.find(f => f.value === fontValue);
    if (font) {
      document.documentElement.style.setProperty('--font-sans', font.fontFamily);
      localStorage.setItem('bf_font', fontValue);
    }
  }, []);

  // Apply font size globally
  const applyFontSize = useCallback((size) => {
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font-size', sizes[size] || sizes.medium);
    localStorage.setItem('bf_fontSize', size);
  }, []);

  // Apply compact mode globally
  const applyCompactMode = useCallback((compact) => {
    document.documentElement.classList.toggle('compact-mode', compact);
    localStorage.setItem('bf_compactMode', String(compact));
  }, []);

  // Apply animations globally
  const applyAnimations = useCallback((enabled) => {
    document.documentElement.classList.toggle('no-animations', !enabled);
    localStorage.setItem('bf_animations', String(enabled));
  }, []);

  // Load and apply saved preferences on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('bf_theme') || 'system';
    const savedFont = localStorage.getItem('bf_font') || 'dm-sans';
    const savedFontSize = localStorage.getItem('bf_fontSize') || 'medium';
    const savedCompact = localStorage.getItem('bf_compactMode') === 'true';
    const savedAnimations = localStorage.getItem('bf_animations') !== 'false';

    setAppearance(prev => ({ ...prev, theme: savedTheme, font: savedFont, fontSize: savedFontSize, compactMode: savedCompact, animations: savedAnimations }));
    
    applyTheme(savedTheme);
    applyFont(savedFont);
    applyFontSize(savedFontSize);
    applyCompactMode(savedCompact);
    applyAnimations(savedAnimations);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const currentTheme = localStorage.getItem('bf_theme') || 'system';
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme, applyFont, applyFontSize, applyCompactMode, applyAnimations]);

  // Update appearance and apply immediately
  const updateAppearance = useCallback((updates) => {
    setAppearance(prev => {
      const next = { ...prev, ...updates };
      applyTheme(next.theme);
      applyFont(next.font);
      applyFontSize(next.fontSize);
      applyCompactMode(next.compactMode);
      applyAnimations(next.animations);
      localStorage.setItem('bf_appearance', JSON.stringify(next));
      return next;
    });
  }, [applyTheme, applyFont, applyFontSize, applyCompactMode, applyAnimations]);

  const updateNotifications = useCallback((updates) => {
    setNotifications(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('bf_notifications', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ appearance, updateAppearance, notifications, updateNotifications }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

export { FONTS };