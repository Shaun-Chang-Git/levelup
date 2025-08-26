// 접근성 유틸리티 함수들

/**
 * 키보드 네비게이션을 위한 키 확인 함수
 */
export const isEnterOrSpace = (event: React.KeyboardEvent): boolean => {
  return event.key === 'Enter' || event.key === ' ';
};

/**
 * 포커스 가능한 요소인지 확인
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableElements.some(selector => element.matches(selector));
};

/**
 * 요소 내의 모든 포커스 가능한 요소 찾기
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input[type="text"]:not([disabled])',
    'input[type="radio"]:not([disabled])',
    'input[type="checkbox"]:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
};

/**
 * 포커스 트랩 구현
 */
export const trapFocus = (container: HTMLElement, event: KeyboardEvent): void => {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * 스크린 리더용 텍스트 생성
 */
export const generateAriaLabel = (
  primary: string,
  secondary?: string,
  context?: string
): string => {
  const parts = [primary];
  
  if (secondary) {
    parts.push(secondary);
  }
  
  if (context) {
    parts.push(`in ${context}`);
  }
  
  return parts.join(', ');
};

/**
 * 색상 대비 확인 (WCAG AA 기준)
 */
export const checkColorContrast = (foreground: string, background: string): boolean => {
  // 실제 구현에서는 색상 대비 계산 라이브러리 사용 권장
  // 여기서는 기본적인 구조만 제공
  
  const getLuminance = (color: string): number => {
    // RGB 값으로 변환 후 휘도 계산
    // 실제 구현 필요
    return 0;
  };

  const contrast = (getLuminance(foreground) + 0.05) / (getLuminance(background) + 0.05);
  return contrast >= 4.5; // WCAG AA 기준
};

/**
 * 읽기 시간 계산 (접근성 정보용)
 */
export const calculateReadingTime = (text: string, wordsPerMinute = 200): string => {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  if (minutes < 1) {
    return '1분 미만';
  } else if (minutes === 1) {
    return '약 1분';
  } else {
    return `약 ${minutes}분`;
  }
};

/**
 * 동적 콘텐츠 변경 알림
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // 메시지가 읽혀진 후 요소 제거
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

/**
 * 키보드 네비게이션 헬퍼
 */
export const createKeyboardNavigationHandler = (
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) => {
  return (event: KeyboardEvent, currentIndex: number): number => {
    const { key } = event;
    let newIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  };
};

/**
 * 폼 필드 검증 메시지 생성
 */
export const createValidationMessage = (
  fieldName: string,
  error?: string,
  requirements?: string[]
): string => {
  if (error) {
    return `${fieldName}: ${error}`;
  }
  
  if (requirements && requirements.length > 0) {
    return `${fieldName} 요구사항: ${requirements.join(', ')}`;
  }
  
  return `${fieldName}이(가) 유효합니다`;
};

/**
 * 진행률을 접근 가능한 텍스트로 변환
 */
export const formatProgressForScreenReader = (current: number, total: number, unit = '개'): string => {
  const percentage = Math.round((current / total) * 100);
  return `진행률 ${percentage}%, 전체 ${total}${unit} 중 ${current}${unit} 완료`;
};

/**
 * 날짜를 접근 가능한 형식으로 포맷
 */
export const formatDateForScreenReader = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  
  return date.toLocaleDateString('ko-KR', options);
};

/**
 * 시간을 접근 가능한 형식으로 포맷
 */
export const formatTimeForScreenReader = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };
  
  return date.toLocaleTimeString('ko-KR', options);
};

/**
 * 숫자를 접근 가능한 형식으로 포맷
 */
export const formatNumberForScreenReader = (num: number, unit?: string): string => {
  const formattedNumber = num.toLocaleString('ko-KR');
  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
};

/**
 * 건너뛰기 링크 생성 헬퍼
 */
export const createSkipLink = (targetId: string, text: string): React.CSSProperties => {
  return {
    position: 'absolute',
    left: '-9999px',
    zIndex: 999,
    padding: '8px 16px',
    backgroundColor: '#000',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    ':focus': {
      left: '10px',
      top: '10px'
    }
  };
};