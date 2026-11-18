// Small navigation helpers used by the screens.
import { useEffect, useState } from 'react';

export function Link({ href, children, ...rest }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function currentPath() {
  return typeof window === 'undefined' ? '/' : window.location.pathname;
}

/** Returns the current pathname and re-renders whenever it changes. */
export function useLocation() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('popstate', onChange);
    window.addEventListener('app:navigate', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('app:navigate', onChange);
    };
  }, []);

  return [path, null];
}

/** Route parameter from the path, e.g. /suppliers/3 -> { id: '3' }. */
export function useParams() {
  const [path] = useLocation();
  const segments = path.split('/').filter(Boolean);
  const params = {};
  const value = segments[1];
  if (value && /^\d+$/.test(value)) params['id'] = value;
  return params;
}

/** Navigate without a full page reload. */
export function navigate(href) {
  window.history.pushState({}, '', href);
  window.dispatchEvent(new Event('app:navigate'));
  window.scrollTo({ top: 0 });
}

// Let any in-app link click be handled by the client instead of the browser.
if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const target = event.target;
    const anchor = target?.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/') || anchor.target === '_blank' || event.metaKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  });
}
