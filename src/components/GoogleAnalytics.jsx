import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = import.meta.env.VITE_GA_ID;

// mdstore's own analytics for the admin dashboard itself (not the storefronts).
// react-router navigates without full page loads, so route changes are sent
// as manual page_view events after the initial gtag('config') pageview.
export default function GoogleAnalytics() {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    if (!GA_ID || lastTrackedPath.current !== null) return;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    lastTrackedPath.current = currentPath;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!GA_ID || lastTrackedPath.current === null || lastTrackedPath.current === currentPath) return;
    lastTrackedPath.current = currentPath;
    window.gtag('event', 'page_view', { page_path: currentPath });
  }, [currentPath]);

  return null;
}
