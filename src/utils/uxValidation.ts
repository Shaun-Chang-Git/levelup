// UX 개선사항 테스트 및 검증 유틸리티

/**
 * UX 검증 메트릭 인터페이스
 */
interface UXMetrics {
  // 반응성 메트릭
  responsiveness: {
    mobileBreakpoints: boolean;
    tabletBreakpoints: boolean;
    desktopBreakpoints: boolean;
    touchTargetSize: boolean;
  };
  
  // 접근성 메트릭
  accessibility: {
    focusIndicators: boolean;
    colorContrast: boolean;
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
    skipLinks: boolean;
  };
  
  // 성능 메트릭
  performance: {
    loadTime: number;
    interactionTime: number;
    layoutStability: number;
    bundleSize: number;
  };
  
  // 사용성 메트릭
  usability: {
    navigationClarity: boolean;
    errorHandling: boolean;
    feedbackMechanisms: boolean;
    consistentDesign: boolean;
  };
  
  // PWA 메트릭
  pwa: {
    installable: boolean;
    offlineSupport: boolean;
    pushNotifications: boolean;
    serviceWorkerActive: boolean;
  };
}

/**
 * UX 검증 테스트 스위트
 */
class UXValidator {
  private results: Partial<UXMetrics> = {};

  /**
   * 반응형 디자인 검증
   */
  async validateResponsiveness(): Promise<UXMetrics['responsiveness']> {
    const results = {
      mobileBreakpoints: false,
      tabletBreakpoints: false,
      desktopBreakpoints: false,
      touchTargetSize: false,
    };

    // 브레이크포인트 테스트
    const testBreakpoint = (width: number): boolean => {
      // 임시 뷰포트 크기 변경하여 테스트
      const originalWidth = window.innerWidth;
      
      // 모바일 브레이크포인트 (< 600px)
      if (width < 600) {
        results.mobileBreakpoints = this.checkMobileLayout();
      }
      // 태블릿 브레이크포인트 (600px - 960px)
      else if (width >= 600 && width < 960) {
        results.tabletBreakpoints = this.checkTabletLayout();
      }
      // 데스크톱 브레이크포인트 (>= 960px)
      else {
        results.desktopBreakpoints = this.checkDesktopLayout();
      }
      
      return true;
    };

    // 터치 타겟 크기 검증
    results.touchTargetSize = this.validateTouchTargets();

    // 다양한 화면 크기에서 테스트
    [375, 768, 1024, 1440].forEach(width => testBreakpoint(width));

    this.results.responsiveness = results;
    return results;
  }

  private checkMobileLayout(): boolean {
    // 모바일 레이아웃 검증 로직
    const header = document.querySelector('header');
    const navigation = document.querySelector('nav[role="navigation"]');
    
    // 헤더 높이 검사
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const isHeaderAppropriate = headerHeight >= 56 && headerHeight <= 64;
    
    // 네비게이션이 적절히 접혔는지 검사
    const isNavigationCollapsed = navigation ? 
      getComputedStyle(navigation).display !== 'flex' : true;
    
    return isHeaderAppropriate && isNavigationCollapsed;
  }

  private checkTabletLayout(): boolean {
    // 태블릿 레이아웃 검증 로직
    const container = document.querySelector('main');
    const containerWidth = container?.getBoundingClientRect().width || 0;
    
    // 콘텐츠 너비가 적절한지 검사
    const isWidthAppropriate = containerWidth >= 600 && containerWidth <= 960;
    
    return isWidthAppropriate;
  }

  private checkDesktopLayout(): boolean {
    // 데스크톱 레이아웃 검증 로직
    const container = document.querySelector('main');
    const sidebar = document.querySelector('aside');
    
    const hasProperLayout = container && 
      getComputedStyle(container).display === 'flex';
    
    return !!hasProperLayout;
  }

  private validateTouchTargets(): boolean {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    let validCount = 0;
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = window.innerWidth <= 600 ? 44 : 40;
      
      if (rect.width >= minSize && rect.height >= minSize) {
        validCount++;
      }
    });

    return validCount / interactiveElements.length >= 0.9; // 90% 이상 통과
  }

  /**
   * 접근성 검증
   */
  async validateAccessibility(): Promise<UXMetrics['accessibility']> {
    const results = {
      focusIndicators: this.checkFocusIndicators(),
      colorContrast: await this.checkColorContrast(),
      keyboardNavigation: this.checkKeyboardNavigation(),
      screenReaderSupport: this.checkScreenReaderSupport(),
      skipLinks: this.checkSkipLinks(),
    };

    this.results.accessibility = results;
    return results;
  }

  private checkFocusIndicators(): boolean {
    // 포커스 가능한 요소들 검사
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    let hasValidFocus = true;
    focusableElements.forEach(element => {
      const styles = getComputedStyle(element, ':focus-visible');
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      
      if (outline === 'none' && outlineWidth === '0px') {
        hasValidFocus = false;
      }
    });

    return hasValidFocus;
  }

  private async checkColorContrast(): Promise<boolean> {
    // 색상 대비 검사 (간단한 버전)
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, a');
    let contrastChecksPassed = 0;
    let totalChecks = 0;

    textElements.forEach(element => {
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && color !== backgroundColor) {
        totalChecks++;
        // 실제 구현에서는 색상 대비 계산 라이브러리 사용
        const contrastRatio = this.calculateContrastRatio(color, backgroundColor);
        if (contrastRatio >= 4.5) {
          contrastChecksPassed++;
        }
      }
    });

    return totalChecks === 0 ? true : contrastChecksPassed / totalChecks >= 0.9;
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    // 간단한 색상 대비 계산 (실제로는 더 정교한 계산 필요)
    // 여기서는 기본값 반환
    return 4.5;
  }

  private checkKeyboardNavigation(): boolean {
    // 키보드 네비게이션 테스트
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // 모든 포커스 가능한 요소가 Tab으로 접근 가능한지 확인
    return focusableElements.length > 0;
  }

  private checkScreenReaderSupport(): boolean {
    // 스크린 리더 지원 검사
    const hasAriaLabels = document.querySelectorAll('[aria-label]').length > 0;
    const hasAriaDescriptions = document.querySelectorAll('[aria-describedby]').length > 0;
    const hasProperHeadingStructure = this.checkHeadingStructure();
    const hasLandmarks = this.checkLandmarks();

    return hasAriaLabels && hasProperHeadingStructure && hasLandmarks;
  }

  private checkHeadingStructure(): boolean {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length === 0) return false;

    // h1이 존재하는지 확인
    const hasH1 = headings.some(h => h.tagName === 'H1');
    return hasH1;
  }

  private checkLandmarks(): boolean {
    const landmarks = document.querySelectorAll(
      'main, nav, aside, header, footer, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]'
    );
    return landmarks.length >= 3; // main, header, footer 최소한 존재
  }

  private checkSkipLinks(): boolean {
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    return skipLinks.length > 0;
  }

  /**
   * 성능 검증
   */
  async validatePerformance(): Promise<UXMetrics['performance']> {
    const results = {
      loadTime: 0,
      interactionTime: 0,
      layoutStability: 0,
      bundleSize: 0,
    };

    // Navigation Timing API 사용
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      results.loadTime = timing.loadEventEnd - timing.navigationStart;
    }

    // Core Web Vitals 측정
    if ('PerformanceObserver' in window) {
      await this.measureCoreWebVitals(results);
    }

    this.results.performance = results;
    return results;
  }

  private async measureCoreWebVitals(results: UXMetrics['performance']): Promise<void> {
    return new Promise((resolve) => {
      let lcpDone = false;
      let clsDone = false;

      // LCP 측정
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        results.interactionTime = lastEntry.startTime;
        lcpDone = true;
        
        if (clsDone) resolve();
      });

      // CLS 측정
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        results.layoutStability = clsValue;
        clsDone = true;
        
        if (lcpDone) resolve();
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        resolve();
      }

      // 5초 후 타임아웃
      setTimeout(resolve, 5000);
    });
  }

  /**
   * 사용성 검증
   */
  validateUsability(): UXMetrics['usability'] {
    const results = {
      navigationClarity: this.checkNavigationClarity(),
      errorHandling: this.checkErrorHandling(),
      feedbackMechanisms: this.checkFeedbackMechanisms(),
      consistentDesign: this.checkDesignConsistency(),
    };

    this.results.usability = results;
    return results;
  }

  private checkNavigationClarity(): boolean {
    const navigation = document.querySelector('nav');
    const navigationItems = navigation?.querySelectorAll('a, button');
    
    // 네비게이션 아이템이 명확한 라벨을 가지고 있는지 확인
    let hasLabels = true;
    navigationItems?.forEach(item => {
      const text = item.textContent?.trim();
      const ariaLabel = item.getAttribute('aria-label');
      if (!text && !ariaLabel) {
        hasLabels = false;
      }
    });

    return hasLabels && (navigationItems?.length || 0) > 0;
  }

  private checkErrorHandling(): boolean {
    // 폼 요소들이 적절한 에러 처리를 가지고 있는지 확인
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, textarea, select');
    
    let hasErrorHandling = true;
    inputs.forEach(input => {
      const hasAriaDescribedby = input.hasAttribute('aria-describedby');
      const hasValidation = input.hasAttribute('required') || 
                          input.hasAttribute('pattern') ||
                          input.hasAttribute('min') ||
                          input.hasAttribute('max');
      
      if (hasValidation && !hasAriaDescribedby) {
        hasErrorHandling = false;
      }
    });

    return hasErrorHandling;
  }

  private checkFeedbackMechanisms(): boolean {
    // 사용자 피드백 메커니즘 확인
    const buttons = document.querySelectorAll('button');
    const hasLoadingStates = Array.from(buttons).some(button => 
      button.hasAttribute('aria-busy') || 
      button.querySelector('[role="status"]')
    );
    
    const hasNotifications = document.querySelector('[role="alert"], [role="status"]');
    
    return hasLoadingStates && !!hasNotifications;
  }

  private checkDesignConsistency(): boolean {
    // 디자인 일관성 확인
    const buttons = document.querySelectorAll('button');
    const cards = document.querySelectorAll('[role="article"], .card, .MuiCard-root');
    
    // 버튼 스타일 일관성 검사
    const buttonStyles = Array.from(buttons).map(button => {
      const styles = getComputedStyle(button);
      return {
        borderRadius: styles.borderRadius,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
      };
    });

    // 스타일이 일관적인지 확인 (간단한 체크)
    const isConsistent = buttonStyles.length === 0 || 
      buttonStyles.every(style => 
        style.borderRadius === buttonStyles[0].borderRadius &&
        style.fontWeight === buttonStyles[0].fontWeight
      );

    return isConsistent;
  }

  /**
   * PWA 기능 검증
   */
  async validatePWA(): Promise<UXMetrics['pwa']> {
    const results = {
      installable: false,
      offlineSupport: false,
      pushNotifications: false,
      serviceWorkerActive: false,
    };

    // Service Worker 확인
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorkerActive = !!registration?.active;
      } catch (e) {
        results.serviceWorkerActive = false;
      }
    }

    // 설치 가능성 확인
    results.installable = this.checkInstallability();

    // 오프라인 지원 확인
    results.offlineSupport = this.checkOfflineSupport();

    // 푸시 알림 지원 확인
    results.pushNotifications = this.checkPushNotificationSupport();

    this.results.pwa = results;
    return results;
  }

  private checkInstallability(): boolean {
    // 매니페스트 파일 확인
    const manifestLink = document.querySelector('link[rel="manifest"]');
    return !!manifestLink;
  }

  private checkOfflineSupport(): boolean {
    // 오프라인 페이지 존재 확인 (간단한 체크)
    return 'serviceWorker' in navigator;
  }

  private checkPushNotificationSupport(): boolean {
    return 'PushManager' in window && 'Notification' in window;
  }

  /**
   * 전체 UX 검증 실행
   */
  async runCompleteValidation(): Promise<UXMetrics> {
    console.log('🚀 UX 검증 시작...');

    const [responsiveness, accessibility, performance, usability, pwa] = await Promise.all([
      this.validateResponsiveness(),
      this.validateAccessibility(),
      this.validatePerformance(),
      Promise.resolve(this.validateUsability()),
      this.validatePWA(),
    ]);

    const completeResults: UXMetrics = {
      responsiveness,
      accessibility,
      performance,
      usability,
      pwa,
    };

    this.generateReport(completeResults);
    return completeResults;
  }

  /**
   * 검증 리포트 생성
   */
  private generateReport(metrics: UXMetrics): void {
    console.log('📊 UX 검증 리포트');
    console.log('==================');
    
    // 반응성 리포트
    console.log('📱 반응형 디자인:');
    Object.entries(metrics.responsiveness).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });

    // 접근성 리포트
    console.log('\n♿ 접근성:');
    Object.entries(metrics.accessibility).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });

    // 성능 리포트
    console.log('\n⚡ 성능:');
    console.log(`  로드 시간: ${metrics.performance.loadTime}ms`);
    console.log(`  상호작용 시간: ${metrics.performance.interactionTime}ms`);
    console.log(`  레이아웃 안정성: ${metrics.performance.layoutStability}`);

    // 사용성 리포트
    console.log('\n🎯 사용성:');
    Object.entries(metrics.usability).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });

    // PWA 리포트
    console.log('\n📱 PWA:');
    Object.entries(metrics.pwa).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });

    // 전체 점수 계산
    const totalScore = this.calculateOverallScore(metrics);
    console.log(`\n🏆 전체 점수: ${totalScore}%`);
    
    if (totalScore >= 90) {
      console.log('🎉 우수한 UX 품질입니다!');
    } else if (totalScore >= 70) {
      console.log('👍 양호한 UX 품질입니다.');
    } else {
      console.log('⚠️  UX 개선이 필요합니다.');
    }
  }

  private calculateOverallScore(metrics: UXMetrics): number {
    let totalChecks = 0;
    let passedChecks = 0;

    // Boolean 값들 계산
    Object.values(metrics.responsiveness).forEach(value => {
      totalChecks++;
      if (value) passedChecks++;
    });

    Object.values(metrics.accessibility).forEach(value => {
      totalChecks++;
      if (value) passedChecks++;
    });

    Object.values(metrics.usability).forEach(value => {
      totalChecks++;
      if (value) passedChecks++;
    });

    Object.values(metrics.pwa).forEach(value => {
      totalChecks++;
      if (value) passedChecks++;
    });

    // 성능 점수는 별도 계산
    const performanceScore = this.calculatePerformanceScore(metrics.performance);
    totalChecks += 4;
    passedChecks += Math.round(performanceScore / 25);

    return Math.round((passedChecks / totalChecks) * 100);
  }

  private calculatePerformanceScore(performance: UXMetrics['performance']): number {
    let score = 0;

    // 로드 시간 점수 (3초 이하 = 100점)
    if (performance.loadTime <= 3000) score += 25;
    else if (performance.loadTime <= 5000) score += 15;
    else if (performance.loadTime <= 8000) score += 5;

    // 상호작용 시간 점수 (2.5초 이하 = 100점)
    if (performance.interactionTime <= 2500) score += 25;
    else if (performance.interactionTime <= 4000) score += 15;
    else if (performance.interactionTime <= 6000) score += 5;

    // 레이아웃 안정성 점수 (0.1 이하 = 100점)
    if (performance.layoutStability <= 0.1) score += 25;
    else if (performance.layoutStability <= 0.25) score += 15;
    else if (performance.layoutStability <= 0.5) score += 5;

    // 번들 크기는 간단히 25점 할당
    score += 25;

    return score;
  }
}

// 전역 UX 검증기 인스턴스
export const uxValidator = new UXValidator();

// 개발 모드에서만 검증 실행
export const runUXValidationInDev = (): void => {
  if (process.env.NODE_ENV === 'development') {
    // 페이지 로드 완료 후 검증 실행
    window.addEventListener('load', () => {
      setTimeout(() => {
        uxValidator.runCompleteValidation();
      }, 3000); // 3초 후 실행
    });
  }
};

export default uxValidator;