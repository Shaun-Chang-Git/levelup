import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// 브레이크포인트 정의
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// 공통 스타일 변수
const commonStyles = {
  borderRadius: 12,
  cardElevation: 2,
  headerHeight: 64,
  bottomNavHeight: 56,
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
  },
  // 접근성 개선을 위한 추가 스타일
  accessibility: {
    focusOutlineWidth: 2,
    focusOutlineOffset: 2,
    minimumTouchTarget: 44, // WCAG 2.1 AA 권장 터치 타겟 크기
    minimumTextContrast: 4.5, // WCAG AA 기준
    minimumLargeTextContrast: 3, // WCAG AA 기준 (18pt 이상)
  }
};

// 라이트 테마 색상 팔레트
const lightPalette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#fff',
  },
  error: {
    main: '#f44336',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

// 다크 테마 색상 팔레트
const darkPalette = {
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
    contrastText: '#000',
  },
  secondary: {
    main: '#f48fb1',
    light: '#fce4ec',
    dark: '#ad1457',
    contrastText: '#000',
  },
  error: {
    main: '#f44336',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ffa726',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0277bd',
  },
  success: {
    main: '#66bb6a',
    light: '#81c784',
    dark: '#388e3c',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
};

// 타이포그래피 설정
const typography = {
  fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.125rem',
    fontWeight: 600,
    lineHeight: 1.2,
    '@media (max-width:600px)': {
      fontSize: '1.75rem',
    },
  },
  h2: {
    fontSize: '1.875rem',
    fontWeight: 600,
    lineHeight: 1.3,
    '@media (max-width:600px)': {
      fontSize: '1.5rem',
    },
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    '@media (max-width:600px)': {
      fontSize: '1.25rem',
    },
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
    '@media (max-width:600px)': {
      fontSize: '1.125rem',
    },
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
    '@media (max-width:600px)': {
      fontSize: '1rem',
    },
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
    '@media (max-width:600px)': {
      fontSize: '0.875rem',
    },
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
    '@media (max-width:600px)': {
      fontSize: '0.875rem',
    },
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.57,
    '@media (max-width:600px)': {
      fontSize: '0.8125rem',
    },
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.66,
    '@media (max-width:600px)': {
      fontSize: '0.6875rem',
    },
  },
};

// 컴포넌트 스타일 커스터마이징
const getComponentOverrides = (mode: PaletteMode) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontSize: '14px',
        '@media (max-width:600px)': {
          fontSize: '13px',
        },
        // 모바일에서 확대/축소 방지
        '@media (max-width:600px)': {
          touchAction: 'manipulation',
          WebkitTextSizeAdjust: '100%',
        },
      },
      // 접근성을 위한 전역 포커스 스타일
      '*:focus-visible': {
        outline: `${commonStyles.accessibility.focusOutlineWidth}px solid ${mode === 'dark' ? '#90caf9' : '#1976d2'}`,
        outlineOffset: `${commonStyles.accessibility.focusOutlineOffset}px`,
        borderRadius: '4px',
      },
      // 스크린 리더 전용 텍스트
      '.sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
        border: 0,
      },
      // 고대비 모드 지원
      '@media (prefers-contrast: high)': {
        '*': {
          borderWidth: '2px !important',
        },
      },
      // 애니메이션 감소 모드 지원
      '@media (prefers-reduced-motion: reduce)': {
        '*': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: mode === 'dark' 
          ? '0px 2px 4px rgba(0, 0, 0, 0.3)' 
          : '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: commonStyles.borderRadius,
        boxShadow: mode === 'dark'
          ? '0px 2px 8px rgba(0, 0, 0, 0.4)'
          : '0px 2px 8px rgba(0, 0, 0, 0.1)',
        '@media (max-width:600px)': {
          borderRadius: 8,
          margin: '0 8px',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 600,
        minHeight: 44, // 모바일 터치 최소 크기
        '@media (max-width:600px)': {
          minHeight: 48,
          fontSize: '0.875rem',
        },
      },
      sizeSmall: {
        minHeight: 36,
        '@media (max-width:600px)': {
          minHeight: 40,
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        minWidth: 44,
        minHeight: 44,
        '@media (max-width:600px)': {
          minWidth: 48,
          minHeight: 48,
        },
      },
      sizeSmall: {
        minWidth: 36,
        minHeight: 36,
        '@media (max-width:600px)': {
          minWidth: 40,
          minHeight: 40,
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          minHeight: 44,
          '@media (max-width:600px)': {
            minHeight: 48,
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        minHeight: 28,
        '@media (max-width:600px)': {
          minHeight: 32,
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 48,
        '@media (max-width:600px)': {
          minHeight: 44,
          '& .MuiTab-root': {
            minHeight: 44,
            fontSize: '0.875rem',
          },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: commonStyles.borderRadius,
        '@media (max-width:600px)': {
          borderRadius: '12px 12px 0 0',
          margin: 8,
          maxHeight: 'calc(100vh - 16px)',
        },
      },
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        height: commonStyles.bottomNavHeight,
        borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
      },
    },
  },
});

// 테마 생성 함수
export const createAppTheme = (mode: PaletteMode = 'light'): Theme => {
  const palette = mode === 'light' ? lightPalette : darkPalette;
  
  return createTheme({
    palette: {
      mode,
      ...palette,
    },
    typography,
    breakpoints: {
      values: breakpoints,
    },
    spacing: 8,
    shape: {
      borderRadius: commonStyles.borderRadius,
    },
    components: getComponentOverrides(mode),
    // 커스텀 속성 추가
    customStyles: commonStyles,
  } as any);
};

// 미디어 쿼리 헬퍼 함수들
export const mediaQueries = {
  mobile: `@media (max-width:${breakpoints.sm - 1}px)`,
  tablet: `@media (min-width:${breakpoints.sm}px) and (max-width:${breakpoints.md - 1}px)`,
  desktop: `@media (min-width:${breakpoints.md}px)`,
  largeDesktop: `@media (min-width:${breakpoints.lg}px)`,
};

// 모바일 감지 훅을 위한 유틸리티
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.sm;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.sm && window.innerWidth < breakpoints.md;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md;
};

// 모바일 전용 스타일 유틸리티
export const mobileStyles = {
  safeArea: {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  },
  fullHeight: {
    minHeight: '100vh',
    minHeight: '100dvh', // 동적 viewport 높이
  },
  touchFriendly: {
    minHeight: 44,
    minWidth: 44,
    '@media (max-width:600px)': {
      minHeight: 48,
      minWidth: 48,
    },
  },
};

export default createAppTheme;