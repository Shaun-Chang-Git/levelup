// 성능 모니터링 및 최적화 유틸리티

/**
 * 성능 메트릭 인터페이스
 */
interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  
  // 커스텀 메트릭
  componentRenderTime?: number;
  apiResponseTime?: number;
  bundleLoadTime?: number;
  memoryUsage?: number;
}

/**
 * 성능 메트릭 수집기
 */
class PerformanceCollector {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Web Vitals 관찰자
    if ('PerformanceObserver' in window) {
      // LCP 측정
      const lcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.metrics.LCP = entry.startTime;
        }
      });
      
      // FID 측정
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.metrics.FID = entry.processingStart - entry.startTime;
        }
      });
      
      // CLS 측정
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.CLS = clsValue;
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        fidObserver.observe({ entryTypes: ['first-input'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        this.observers.push(lcpObserver, fidObserver, clsObserver);
      } catch (e) {
        console.warn('Performance Observer not fully supported', e);
      }
    }
  }

  /**
   * 컴포넌트 렌더링 시간 측정
   */
  measureComponentRender<T>(componentName: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.metrics.componentRenderTime = renderTime;
    
    if (renderTime > 16) { // 60fps 기준
      console.warn(`Slow component render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * API 응답 시간 측정
   */
  async measureApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.metrics.apiResponseTime = responseTime;
      
      if (responseTime > 1000) {
        console.warn(`Slow API call detected: ${apiName} took ${responseTime.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      console.error(`API call failed: ${apiName} took ${responseTime.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * 메모리 사용량 측정
   */
  measureMemoryUsage(): number | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const totalJSHeapSize = memory.totalJSHeapSize;
      
      this.metrics.memoryUsage = (usedJSHeapSize / totalJSHeapSize) * 100;
      
      if (this.metrics.memoryUsage > 80) {
        console.warn(`High memory usage detected: ${this.metrics.memoryUsage.toFixed(2)}%`);
      }
      
      return this.metrics.memoryUsage;
    }
    
    return null;
  }

  /**
   * Core Web Vitals 가져오기
   */
  getCoreWebVitals(): Partial<PerformanceMetrics> {
    return {
      LCP: this.metrics.LCP,
      FID: this.metrics.FID,
      CLS: this.metrics.CLS,
    };
  }

  /**
   * 모든 메트릭 가져오기
   */
  getAllMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 메트릭을 서버로 전송 (실제 구현에서는 분석 서비스로 전송)
   */
  sendMetricsToAnalytics(): void {
    const webVitals = this.getCoreWebVitals();
    
    // Google Analytics 4 이벤트 전송 예시
    if (typeof gtag !== 'undefined') {
      Object.entries(webVitals).forEach(([metric, value]) => {
        if (value !== undefined) {
          (window as any).gtag('event', metric, {
            custom_parameter: value,
          });
        }
      });
    }
    
    // 커스텀 분석 엔드포인트로 전송 예시
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: this.getAllMetrics(),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(error => {
        console.error('Failed to send performance metrics:', error);
      });
    }
  }

  /**
   * 관찰자 정리
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 전역 성능 컬렉터 인스턴스
export const performanceCollector = new PerformanceCollector();

/**
 * 이미지 지연 로딩 유틸리티
 */
export const createLazyImageObserver = (callback: (entry: IntersectionObserverEntry) => void) => {
  if (!('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01,
  });
};

/**
 * 컴포넌트 렌더링 최적화 데코레이터
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> => {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;

  return React.memo((props: P) => {
    return performanceCollector.measureComponentRender(
      displayName,
      () => React.createElement(WrappedComponent, props)
    );
  });
};

/**
 * 디바운싱 유틸리티 (성능 최적화용)
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * 쓰로틀링 유틸리티 (성능 최적화용)
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 번들 크기 분석 유틸리티
 */
export const analyzeBundleSize = (): void => {
  if (process.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
      console.log('Bundle analyzer available in development mode');
    }).catch(() => {
      console.log('Bundle analyzer not available');
    });
  }
};

/**
 * 중요하지 않은 리소스 지연 로딩
 */
export const loadNonCriticalResources = (): void => {
  // 페이지 로드 완료 후 중요하지 않은 스크립트 로드
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Google Analytics, 광고 스크립트 등 로드
      const nonCriticalScripts = [
        // 'https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID',
      ];

      nonCriticalScripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
      });
    }, 2000);
  });
};

/**
 * 리소스 힌트 추가
 */
export const addResourceHints = (hints: { href: string; as?: string; type?: 'preload' | 'prefetch' }[]): void => {
  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.type || 'preload';
    link.href = hint.href;
    if (hint.as) {
      link.as = hint.as;
    }
    document.head.appendChild(link);
  });
};

/**
 * 서비스 워커 캐시 관리
 */
export const manageSWCache = (): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // 캐시 정리 메시지 전송
      if (registration.active) {
        registration.active.postMessage({
          type: 'CLEANUP_OLD_CACHES'
        });
      }
    });
  }
};

/**
 * 성능 모니터링 시작
 */
export const startPerformanceMonitoring = (): void => {
  // Core Web Vitals 측정 시작
  performanceCollector.measureMemoryUsage();
  
  // 페이지 가시성 변경 시 메트릭 전송
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      performanceCollector.sendMetricsToAnalytics();
    }
  });

  // 페이지 언로드 시 메트릭 전송
  window.addEventListener('beforeunload', () => {
    performanceCollector.sendMetricsToAnalytics();
  });

  // 5분마다 메모리 사용량 체크
  setInterval(() => {
    performanceCollector.measureMemoryUsage();
  }, 5 * 60 * 1000);
};

// React import for withPerformanceMonitoring
import React from 'react';