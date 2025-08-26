import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isSubscribing: boolean;
  error: string | null;
}

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
    permission: 'default',
    subscription: null,
    isSubscribing: false,
    error: null,
  });

  // VAPID 공개 키 (실제 환경에서는 환경 변수로 관리)
  const VAPID_PUBLIC_KEY = 'BCauY0yI4K3jbDQSm-2hFhOJLb2yDrMnBwN-LpX8kRbAf5B3k1XlS9L6rS0G3N2g4f4S9D8f5g6h7j8k9l1m2n3o4p5';

  useEffect(() => {
    if (state.isSupported && 'Notification' in window) {
      setState(prev => ({
        ...prev,
        permission: Notification.permission,
      }));
    }
  }, [state.isSupported]);

  // Service Worker 등록 확인 및 푸시 구독 상태 확인
  useEffect(() => {
    if (!state.isSupported) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setState(prev => ({
            ...prev,
            subscription,
          }));
        }
      } catch (error) {
        console.error('Failed to check push subscription:', error);
        setState(prev => ({
          ...prev,
          error: '푸시 구독 상태 확인에 실패했습니다.',
        }));
      }
    };

    checkSubscription();
  }, [state.isSupported]);

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setState(prev => ({
        ...prev,
        permission,
        error: permission === 'denied' ? '알림 권한이 거부되었습니다.' : null,
      }));
      return permission;
    }

    throw new Error('Notifications are not supported');
  }, [state.isSupported]);

  // 푸시 알림 구독
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setState(prev => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // 권한이 없으면 먼저 요청
      if (state.permission === 'default') {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          throw new Error('Push permission not granted');
        }
      } else if (state.permission === 'denied') {
        throw new Error('Push permission denied');
      }

      // Service Worker 등록 확인
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service Worker not registered');
      }

      // 기존 구독이 있는지 확인
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // VAPID 키를 base64에서 Uint8Array로 변환
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribing: false,
      }));

      // 서버로 구독 정보 전송 (실제 구현에서는 API 호출)
      await sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setState(prev => ({
        ...prev,
        isSubscribing: false,
        error: '푸시 알림 구독에 실패했습니다.',
      }));
      throw error;
    }
  }, [state.isSupported, state.permission, requestPermission]);

  // 푸시 알림 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return true;
    }

    try {
      const success = await state.subscription.unsubscribe();
      
      if (success) {
        setState(prev => ({
          ...prev,
          subscription: null,
        }));

        // 서버에서 구독 정보 제거 (실제 구현에서는 API 호출)
        await removeSubscriptionFromServer(state.subscription);
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      setState(prev => ({
        ...prev,
        error: '푸시 알림 구독 해제에 실패했습니다.',
      }));
      return false;
    }
  }, [state.subscription]);

  // 로컬 알림 표시 (테스트용)
  const showLocalNotification = useCallback(async (options: PushNotificationOptions) => {
    if (state.permission !== 'granted') {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo192.png',
      badge: options.badge || '/logo192.png',
      tag: options.tag || 'levelup-notification',
      requireInteraction: options.requireInteraction || false,
    });

    // 클릭 이벤트 처리
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }, [state.permission, requestPermission]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
    clearError,
    isSubscribed: !!state.subscription,
    canSubscribe: state.isSupported && state.permission !== 'denied',
  };
};

// VAPID 키를 Uint8Array로 변환하는 유틸리티 함수
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 서버로 구독 정보 전송 (실제 구현에서는 API 호출)
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  // TODO: 실제 API 엔드포인트로 구독 정보 전송
  console.log('Sending subscription to server:', subscription);
  
  try {
    // 예시 API 호출
    /*
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
    */
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    throw error;
  }
}

// 서버에서 구독 정보 제거 (실제 구현에서는 API 호출)
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  // TODO: 실제 API 엔드포인트에서 구독 정보 제거
  console.log('Removing subscription from server:', subscription);
  
  try {
    // 예시 API 호출
    /*
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }
    */
  } catch (error) {
    console.error('Failed to remove subscription from server:', error);
    throw error;
  }
}

export default usePushNotifications;