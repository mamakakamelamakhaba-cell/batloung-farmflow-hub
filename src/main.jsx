import React, { createContext, useContext, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './components/farm/FarmApp';
import * as Farm from './components/farm/FarmApp';
import { Settings } from './components/farm/Settings';
import { useLocation } from './lib/router-compat';
import './styles.css';
import { Login } from './components/auth/Login';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { SettingsProvider } from './components/auth/SettingsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});

const pages = [
  { path: '/', render: () => <Farm.Dashboard /> },
  { path: '/suppliers', render: () => <Farm.Suppliers /> },
  { path: '/fruits', render: () => <Farm.Fruits /> },
  { path: '/stock', render: () => <Farm.Stock /> },
  { path: '/vendors', render: () => <Farm.Vendors /> },
  { path: '/purchases', render: () => <Farm.Purchases /> },
  { path: '/sales', render: () => <Farm.Sales /> },
  { path: '/reports', render: () => <Farm.Reports /> },
  { path: '/settings', render: () => <Settings /> },
];

const detailPages = [
  { test: /^\/suppliers\/(\d+)$/, render: (id) => <Farm.SupplierDetail /> },
  { test: /^\/fruits\/(\d+)$/, render: (id) => <Farm.FruitDetail /> },
  { test: /^\/vendors\/(\d+)$/, render: (id) => <Farm.VendorDetail /> },
];

function NotFound() {
  return (
    <div className="empty-state">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <a className="text-link" href="/">Back to dashboard</a>
    </div>
  );
}

function ProtectedRouter() {
  const { isAuthenticated, loading } = useAuth();
  const [path] = useLocation();

  if (loading) {
    return (
      <Shell>
        <div className="loading-stack">
          {[1, 2, 3].map(n => <div className="skeleton-row" key={n}><i /><i /><i /></div>)}
        </div>
      </Shell>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  let page = <NotFound />;
  for (const candidate of pages) {
    if (candidate.path === path.replace(/\/$/, '') || (candidate.path === '/' && path === '/')) {
      page = candidate.render();
      break;
    }
  }
  for (const detail of detailPages) {
    const match = detail.test.exec(path);
    if (match) {
      page = detail.render(Number(match[1]));
      break;
    }
  }

  return <Shell>{page}</Shell>;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <ProtectedRouter />
        </QueryClientProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);