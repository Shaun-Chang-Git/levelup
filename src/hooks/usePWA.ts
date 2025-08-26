import { useState, useEffect, useCallback } from 'react';

interface PWAPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    swRegistration: null,
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<PWAPromptEvent | null>(null);

  // PWA 설치 감지
  useEffect(() => {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    setState(prev => ({
      ...prev,
      isStandalone,
      isInstalled,
    }));
  }, []);

  // 설치 프롬프트 감지
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as PWAPromptEvent;
      setDeferredPrompt(promptEvent);
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
      }));
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      localStorage.setItem('pwa-installed', 'true');
      setDeferredPrompt(null);
      
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 서비스 워커 등록 및 업데이트 감지
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerSW();
    }
  }, []);

  const registerSW = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      setState(prev => ({
        ...prev,
        swRegistration: registration,
      }));

      // 업데이트 감지
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({
                ...prev,
                isUpdateAvailable: true,
              }));
            }
          });
        }
      });

      // 서비스 워커 메시지 수신
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
          setState(prev => ({
            ...prev,
            isUpdateAvailable: true,
          }));
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  // PWA 설치 실행
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('pwa-installed', 'true');
        
        setState(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
        }));
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }, [deferredPrompt]);

  // 앱 업데이트 적용
  const updateApp = useCallback(async () => {
    if (!state.swRegistration || !state.isUpdateAvailable) {
      return;
    }

    const waitingWorker = state.swRegistration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // 페이지 새로고침
      window.location.reload();
    }
  }, [state.swRegistration, state.isUpdateAvailable]);

  // 앱 업데이트 나중에 하기
  const dismissUpdate = useCallback(() => {
    setState(prev => ({
      ...prev,
      isUpdateAvailable: false,
    }));
  }, []);

  return {
    ...state,
    installPWA,
    updateApp,
    dismissUpdate,
    canInstall: state.isInstallable && !state.isInstalled,
  };
};

export default usePWA;