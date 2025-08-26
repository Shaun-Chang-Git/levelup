import React, { Suspense } from 'react';
import { AccessibleSpinner } from '../accessibility/AccessibleLoading';

/**
 * 지연 로딩 컴포넌트들
 * 코드 스플리팅을 통한 성능 최적화
 */

// 페이지 컴포넌트들의 지연 로딩
export const LazyDashboardPage = React.lazy(() => import('../../pages/DashboardPage'));
export const LazyGoalsPage = React.lazy(() => import('../../pages/GoalsPage'));
export const LazyHabitsPage = React.lazy(() => import('../../pages/HabitsPage'));
export const LazyAchievementsPage = React.lazy(() => import('../../pages/AchievementsPage'));
export const LazyChallengesPage = React.lazy(() => import('../../pages/ChallengesPage'));
export const LazyBadgesPage = React.lazy(() => import('../../pages/BadgesPage'));
export const LazyLeaderboardPage = React.lazy(() => import('../../pages/LeaderboardPage'));
export const LazySocialPage = React.lazy(() => import('../../pages/SocialPage'));

// 큰 컴포넌트들의 지연 로딩
export const LazyPushNotificationSettings = React.lazy(() => 
  import('../notifications/PushNotificationSettings').then(module => ({
    default: module.default
  }))
);

export const LazyInstallPrompt = React.lazy(() => 
  import('../pwa/InstallPrompt').then(module => ({
    default: module.default
  }))
);

/**
 * Suspense 래퍼 컴포넌트
 */
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback = <AccessibleSpinner size="large" message="페이지를 불러오는 중..." />,
  errorBoundary = true,
}) => {
  const SuspenseContent = () => (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <LazyErrorBoundary>
        <SuspenseContent />
      </LazyErrorBoundary>
    );
  }

  return <SuspenseContent />;
};

/**
 * 에러 바운더리 컴포넌트 (지연 로딩)
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    
    // 에러 리포팅 서비스로 전송 (실제 구현에서)
    if (process.env.REACT_APP_ERROR_REPORTING_ENDPOINT) {
      fetch(process.env.REACT_APP_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          errorInfo,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }).catch(reportingError => {
        console.error('Failed to report error:', reportingError);
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            margin: '16px',
          }}
        >
          <h2>컴포넌트 로딩 오류</h2>
          <p>페이지를 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 조건부 지연 로딩 훅
 */
export const useConditionalLazyLoad = (
  condition: boolean,
  importFunction: () => Promise<{ default: React.ComponentType<any> }>
) => {
  const [LazyComponent, setLazyComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (condition && !LazyComponent && !loading) {
      setLoading(true);
      importFunction()
        .then(module => {
          setLazyComponent(() => module.default);
          setError(null);
        })
        .catch(err => {
          console.error('Failed to load component:', err);
          setError(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [condition, LazyComponent, loading, importFunction]);

  return { LazyComponent, loading, error };
};

/**
 * 인터섹션 기반 지연 로딩 훅
 */
export const useIntersectionLazyLoad = (
  ref: React.RefObject<Element>,
  importFunction: () => Promise<{ default: React.ComponentType<any> }>,
  options?: IntersectionObserverInit
) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options]);

  return useConditionalLazyLoad(isVisible, importFunction);
};

/**
 * 프리로드 유틸리티
 */
export const preloadComponent = (
  importFunction: () => Promise<{ default: React.ComponentType<any> }>
): Promise<{ default: React.ComponentType<any> }> => {
  return importFunction().catch(error => {
    console.error('Failed to preload component:', error);
    throw error;
  });
};

/**
 * 라우트 기반 프리로딩
 */
export const preloadRouteComponents = (): void => {
  // 페이지 로드 후 2초 뒤에 주요 컴포넌트들 프리로드
  setTimeout(() => {
    // 우선순위가 높은 페이지들 먼저 프리로드
    preloadComponent(() => import('../../pages/DashboardPage'))
      .then(() => preloadComponent(() => import('../../pages/GoalsPage')))
      .then(() => preloadComponent(() => import('../../pages/HabitsPage')))
      .catch(error => console.error('Route preloading failed:', error));
  }, 2000);

  // 네트워크가 여유로울 때 나머지 컴포넌트들 프리로드
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      Promise.all([
        preloadComponent(() => import('../../pages/AchievementsPage')),
        preloadComponent(() => import('../../pages/ChallengesPage')),
        preloadComponent(() => import('../../pages/BadgesPage')),
        preloadComponent(() => import('../../pages/LeaderboardPage')),
        preloadComponent(() => import('../../pages/SocialPage')),
      ]).catch(error => {
        console.error('Background preloading failed:', error);
      });
    });
  }
};

/**
 * 모바일에서 터치 시 프리로드
 */
export const useTouchPreload = (
  importFunction: () => Promise<{ default: React.ComponentType<any> }>
) => {
  const handleTouchStart = React.useCallback(() => {
    preloadComponent(importFunction);
  }, [importFunction]);

  return handleTouchStart;
};

/**
 * 호버 시 프리로드 (데스크톱)
 */
export const useHoverPreload = (
  importFunction: () => Promise<{ default: React.ComponentType<any> }>
) => {
  const handleMouseEnter = React.useCallback(() => {
    preloadComponent(importFunction);
  }, [importFunction]);

  return handleMouseEnter;
};