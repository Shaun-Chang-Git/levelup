// LevelUp PWA Service Worker
const CACHE_NAME = 'levelup-v1.0.1';
const STATIC_CACHE_NAME = 'levelup-static-v1.0.1';
const DYNAMIC_CACHE_NAME = 'levelup-dynamic-v1.0.1';

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico',
  // 오프라인 페이지
  '/offline.html'
];

// 캐시할 API 엔드포인트 패턴
const API_CACHE_PATTERNS = [
  /\/api\/goals/,
  /\/api\/habits/,
  /\/api\/challenges/,
  /\/api\/achievements/,
  /\/api\/social/
];

// 캐시에서 제외할 패턴
const EXCLUDE_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/notifications/,
  /chrome-extension/
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
  
  // 새 버전 즉시 활성화
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 모든 클라이언트에서 새 버전 활성화
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Chrome extension 요청 무시
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // 제외 패턴 확인
  const shouldExclude = EXCLUDE_CACHE_PATTERNS.some(pattern => 
    pattern.test(request.url)
  );
  
  if (shouldExclude) {
    return;
  }
  
  // GET 요청만 캐시
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

// 네트워크 요청 처리
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // 1. 정적 자산 (Cache First)
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // 2. API 요청 (Network First with Cache Fallback)
    if (isApiRequest(request)) {
      return await networkFirstWithCache(request, DYNAMIC_CACHE_NAME);
    }
    
    // 3. 네비게이션 요청 (Network First with Offline Page)
    if (request.mode === 'navigate') {
      return await networkFirstWithOfflinePage(request);
    }
    
    // 4. 기타 요청 (Network First)
    return await networkFirst(request);
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // 네비게이션 요청인 경우 오프라인 페이지 반환
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// 정적 자산 확인
function isStaticAsset(request) {
  return request.url.includes('/static/') || 
         request.url.endsWith('.css') ||
         request.url.endsWith('.js') ||
         request.url.endsWith('.png') ||
         request.url.endsWith('.jpg') ||
         request.url.endsWith('.ico');
}

// API 요청 확인
function isApiRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Cache First 전략
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First with Cache Fallback 전략
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Network First with Offline Page 전략
async function networkFirstWithOfflinePage(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving offline page');
    return caches.match('/offline.html');
  }
}

// Network First 전략
async function networkFirst(request) {
  return fetch(request);
}

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  console.log('[SW] Push received', event.data);
  
  let notificationData = {
    title: '🎯 LevelUp',
    body: '새로운 알림이 있습니다.',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'levelup-notification',
    requireInteraction: false,
    data: { url: '/' },
    actions: [
      {
        action: 'open',
        title: '앱 열기',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: '닫기'
      }
    ]
  };
  
  // 푸시 데이터 파싱
  if (event.data) {
    try {
      const pushData = event.data.json();
      
      // 알림 타입별 설정
      switch (pushData.type) {
        case 'habit_reminder':
          notificationData = {
            ...notificationData,
            title: '⏰ 습관 알림',
            body: pushData.message || '습관을 실행할 시간입니다!',
            tag: 'habit-reminder',
            data: { url: '/habits' },
            actions: [
              { action: 'complete', title: '완료 표시' },
              { action: 'snooze', title: '10분 후 다시 알림' },
              { action: 'dismiss', title: '닫기' }
            ]
          };
          break;
          
        case 'achievement_unlocked':
          notificationData = {
            ...notificationData,
            title: '🏆 업적 달성!',
            body: pushData.message || '새로운 업적을 달성했습니다!',
            tag: 'achievement',
            data: { url: '/achievements' },
            requireInteraction: true,
            actions: [
              { action: 'view', title: '확인하기' },
              { action: 'share', title: '공유하기' }
            ]
          };
          break;
          
        case 'social_notification':
          notificationData = {
            ...notificationData,
            title: '👥 소셜 알림',
            body: pushData.message || '새로운 소셜 활동이 있습니다.',
            tag: 'social',
            data: { url: '/social' },
            actions: [
              { action: 'view', title: '확인하기' },
              { action: 'dismiss', title: '닫기' }
            ]
          };
          break;
          
        case 'goal_progress':
          notificationData = {
            ...notificationData,
            title: '📊 목표 진행',
            body: pushData.message || '목표 진행 상황을 확인해보세요.',
            tag: 'goal-progress',
            data: { url: '/goals' },
            actions: [
              { action: 'view', title: '확인하기' },
              { action: 'update', title: '업데이트' }
            ]
          };
          break;
          
        case 'weekly_report':
          notificationData = {
            ...notificationData,
            title: '📈 주간 리포트',
            body: pushData.message || '이번 주 활동 요약이 준비되었습니다.',
            tag: 'weekly-report',
            data: { url: '/dashboard' },
            requireInteraction: true,
            actions: [
              { action: 'view', title: '리포트 보기' },
              { action: 'dismiss', title: '나중에 보기' }
            ]
          };
          break;
          
        default:
          // 커스텀 데이터가 있으면 적용
          Object.assign(notificationData, pushData);
      }
      
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event.action);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  // 액션별 처리
  switch (action) {
    case 'dismiss':
      // 단순히 알림 닫기
      return;
      
    case 'complete':
      // 습관 완료 처리 (API 호출 등)
      event.waitUntil(
        handleHabitComplete(data)
          .then(() => clients.openWindow(url))
          .catch(() => clients.openWindow(url))
      );
      break;
      
    case 'snooze':
      // 10분 후 다시 알림
      event.waitUntil(
        scheduleSnoozeNotification(data)
      );
      break;
      
    case 'share':
      // 업적 공유
      event.waitUntil(
        clients.openWindow(url + '?share=true')
      );
      break;
      
    case 'view':
    case 'update':
    case 'open':
    default:
      // 앱 열기
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientList) => {
            // 이미 열린 창이 있으면 포커스
            for (const client of clientList) {
              if (client.url === self.registration.scope + url.substring(1) && 'focus' in client) {
                return client.focus();
              }
            }
            // 새 창 열기
            return clients.openWindow(url);
          })
      );
      break;
  }
});

// 습관 완료 처리 함수
async function handleHabitComplete(data) {
  try {
    // TODO: 실제 API 호출로 습관 완료 처리
    console.log('[SW] Handling habit completion:', data);
    
    // 예시 API 호출
    /*
    const response = await fetch('/api/habits/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        habitId: data.habitId,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to complete habit');
    }
    */
    
    // 성공 알림 표시
    self.registration.showNotification('✅ 습관 완료!', {
      body: '습관이 성공적으로 완료되었습니다.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'habit-completed',
      requireInteraction: false,
    });
    
  } catch (error) {
    console.error('[SW] Failed to complete habit:', error);
    
    // 실패 알림 표시
    self.registration.showNotification('❌ 오류', {
      body: '습관 완료 처리에 실패했습니다.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'habit-error',
      requireInteraction: false,
    });
  }
}

// 스누즈 알림 예약 함수
async function scheduleSnoozeNotification(data) {
  try {
    console.log('[SW] Scheduling snooze notification:', data);
    
    // 10분 후 알림 (실제로는 서버 측에서 스케줄링해야 함)
    setTimeout(() => {
      self.registration.showNotification('⏰ 습관 알림 (스누즈)', {
        body: data.message || '습관을 실행할 시간입니다!',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'habit-snooze',
        requireInteraction: false,
        data: data,
        actions: [
          { action: 'complete', title: '완료 표시' },
          { action: 'snooze', title: '10분 후 다시 알림' },
          { action: 'dismiss', title: '닫기' }
        ]
      });
    }, 10 * 60 * 1000); // 10분
    
  } catch (error) {
    console.error('[SW] Failed to schedule snooze notification:', error);
  }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 백그라운드 동기화 실행
async function doBackgroundSync() {
  try {
    // 오프라인 시 저장된 데이터 동기화
    console.log('[SW] Performing background sync');
    
    // 실제 구현은 앱의 오프라인 데이터 관리 로직에 따라 달라짐
    // 예: IndexedDB에서 대기 중인 요청들을 서버로 전송
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}