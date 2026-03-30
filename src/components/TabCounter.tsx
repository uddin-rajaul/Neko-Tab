import { useEffect, useState } from 'react';

export function TabCounter() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    try {
      const today = new Date().toLocaleDateString();
      const stored = localStorage.getItem('neko-tab-count');
      let data = stored ? JSON.parse(stored) : { date: today, count: 0 };
      
      if (data.date !== today) {
        data = { date: today, count: 0 };
      }

      // Check if this specific session has already been counted
      if (!sessionStorage.getItem('tabCounted')) {
        data.count += 1;
        sessionStorage.setItem('tabCounted', 'true');
        localStorage.setItem('neko-tab-count', JSON.stringify(data));
      }

      setCount(data.count);

      // Listen for changes from other tabs
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'neko-tab-count' && e.newValue) {
          const newData = JSON.parse(e.newValue);
          if (newData.date === new Date().toLocaleDateString()) {
            setCount(newData.count);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    } catch (e) {
      console.error('Failed to parse tab count', e);
    }
  }, []);

  if (count <= 1) return null; // Don't show if it's the very first tab of the day? Or maybe show it always. Let's just show it.

  return (
    <div 
      className="tab-counter"
      title="New tabs opened today"
      style={{
        position: 'fixed',
        bottom: 'var(--spacing-md, 16px)',
        right: 'var(--spacing-md, 16px)',
        opacity: 0.3,
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono, monospace)',
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      📂 {count}
    </div>
  );
}