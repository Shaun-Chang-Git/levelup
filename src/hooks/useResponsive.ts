import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Breakpoint } from '@mui/material/styles';

// 화면 크기 감지 훅
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const theme = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // 초기값 설정
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < theme.breakpoints.values.sm;
  const isTablet = windowSize.width >= theme.breakpoints.values.sm && 
                  windowSize.width < theme.breakpoints.values.md;
  const isDesktop = windowSize.width >= theme.breakpoints.values.md;
  const isLargeDesktop = windowSize.width >= theme.breakpoints.values.lg;

  // 현재 브레이크포인트 반환
  const getCurrentBreakpoint = (): Breakpoint => {
    if (windowSize.width < theme.breakpoints.values.sm) return 'xs';
    if (windowSize.width < theme.breakpoints.values.md) return 'sm';
    if (windowSize.width < theme.breakpoints.values.lg) return 'md';
    if (windowSize.width < theme.breakpoints.values.xl) return 'lg';
    return 'xl';
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    currentBreakpoint: getCurrentBreakpoint(),
  };
};

// 특정 브레이크포인트 이상/이하 감지 훅
export const useBreakpoint = (breakpoint: Breakpoint, type: 'up' | 'down' | 'only' = 'up') => {
  const { windowSize } = useResponsive();
  const theme = useTheme();
  
  const breakpointValue = theme.breakpoints.values[breakpoint];
  const nextBreakpoint = getNextBreakpoint(breakpoint);
  const nextBreakpointValue = nextBreakpoint ? theme.breakpoints.values[nextBreakpoint] : Infinity;

  switch (type) {
    case 'up':
      return windowSize.width >= breakpointValue;
    case 'down':
      return windowSize.width < breakpointValue;
    case 'only':
      return windowSize.width >= breakpointValue && windowSize.width < nextBreakpointValue;
    default:
      return false;
  }
};

// 다음 브레이크포인트 반환 헬퍼
const getNextBreakpoint = (breakpoint: Breakpoint): Breakpoint | null => {
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);
  return currentIndex < breakpoints.length - 1 ? breakpoints[currentIndex + 1] : null;
};

// 방향 감지 훅 (세로/가로)
export const useOrientation = () => {
  const { windowSize } = useResponsive();
  
  const isPortrait = windowSize.height > windowSize.width;
  const isLandscape = windowSize.width > windowSize.height;
  
  return {
    isPortrait,
    isLandscape,
    orientation: isPortrait ? 'portrait' : 'landscape',
  };
};

// 터치 디바이스 감지 훅
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouchDevice = () => {
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 || 
             navigator.maxTouchPoints > 0;
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
};

// 스크롤 위치 감지 훅
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 초기값 설정
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
};

// 헤더 숨김/보임 감지 훅 (스크롤 방향 기반)
export const useHeaderVisibility = (threshold = 10) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { y: scrollY } = useScrollPosition();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
    const scrollDifference = Math.abs(scrollY - lastScrollY);

    if (scrollDifference < threshold) return;

    if (scrollDirection === 'down' && scrollY > 100) {
      setIsHeaderVisible(false);
    } else if (scrollDirection === 'up') {
      setIsHeaderVisible(true);
    }

    setLastScrollY(scrollY);
  }, [scrollY, lastScrollY, threshold]);

  return isHeaderVisible;
};

// Safe Area 감지 훅 (iOS PWA 지원)
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0,
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left')) || 0,
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right')) || 0,
      });
    };

    // CSS 환경 변수 설정
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');

    updateSafeArea();

    // 방향 변경 시 업데이트
    window.addEventListener('orientationchange', updateSafeArea);
    
    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
};

// 키보드 표시 감지 훅 (모바일)
export const useVirtualKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { windowSize } = useResponsive();
  const [initialHeight, setInitialHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (initialHeight === 0) {
      setInitialHeight(window.innerHeight);
    }

    const threshold = 150; // 키보드로 간주할 높이 차이
    const heightDifference = initialHeight - windowSize.height;
    
    setIsKeyboardVisible(heightDifference > threshold);
  }, [windowSize.height, initialHeight]);

  return isKeyboardVisible;
};

// 디바이스 정보 훅
export const useDeviceInfo = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const isTouchDevice = useTouchDevice();
  const { orientation } = useOrientation();

  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [platform, setPlatform] = useState<string>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 디바이스 타입 설정
    if (isMobile) {
      setDeviceType('mobile');
    } else if (isTablet) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }

    // 플랫폼 감지
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setPlatform('ios');
    } else if (userAgent.includes('android')) {
      setPlatform('android');
    } else if (userAgent.includes('windows')) {
      setPlatform('windows');
    } else if (userAgent.includes('mac')) {
      setPlatform('macos');
    } else {
      setPlatform('unknown');
    }
  }, [isMobile, isTablet, isDesktop]);

  return {
    deviceType,
    platform,
    isTouchDevice,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
  };
};

export default useResponsive;