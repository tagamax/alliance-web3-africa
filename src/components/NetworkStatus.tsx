import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <>
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5" />
              <div>
                <p className="font-semibold">Mode Hors Ligne</p>
                <p className="text-sm opacity-90">
                  Vous êtes hors ligne. Certaines fonctionnalités sont limitées.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOfflineBanner(false)}
              className="text-white hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-semibold">Hors ligne</span>
        </div>
      )}
    </>
  );
}
