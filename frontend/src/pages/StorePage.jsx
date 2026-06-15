// Legacy redirect — the real storefront is ServicePage
import { useEffect } from 'react';
export default function StorePage() {
  useEffect(() => {
    const params = window.location.search;
    window.location.replace(`/store${params}`);
  }, []);
  return null;
}
