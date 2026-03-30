import React, { useEffect, useState } from 'react';

export const TabCounter: React.FC = () => {
  const [tabCount, setTabCount] = useState<number>(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `neko-tab-count-${today}`;
    
    let count = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    if (!sessionStorage.getItem('tab_counted')) {
      sessionStorage.setItem('tab_counted', 'true');
      count += 1;
      localStorage.setItem(storageKey, count.toString());
      
      // Clean up old counts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('neko-tab-count-') && key !== storageKey) {
          localStorage.removeItem(key);
        }
      }
    }
    
    setTabCount(count);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setTabCount(parseInt(e.newValue || '0', 10));
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="stat-item" title={`${tabCount} new tabs opened today`}>
      <span className="stat-label">TABS</span>
      <span className="stat-value">{tabCount}</span>
    </div>
  );
};
