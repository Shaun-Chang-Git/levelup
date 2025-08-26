import React from 'react';
import { Box, Link, useTheme } from '@mui/material';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipNavigationProps {
  /** 건너뛰기 링크 목록 */
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: '본문으로 건너뛰기' },
  { href: '#navigation', label: '네비게이션으로 건너뛰기' },
  { href: '#footer', label: '푸터로 건너뛰기' },
];

const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = defaultLinks,
}) => {
  const theme = useTheme();

  return (
    <Box
      component="nav"
      aria-label="건너뛰기 링크"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10000,
        '& a': {
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
          border: 0,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          padding: theme.spacing(1, 2),
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '0 0 4px 0',
          transition: 'all 0.3s ease',
          '&:focus': {
            position: 'static',
            left: 'auto',
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            clipPath: 'none',
            whiteSpace: 'normal',
            outline: `3px solid ${theme.palette.secondary.main}`,
            outlineOffset: '2px',
          },
          '&:hover:focus': {
            backgroundColor: theme.palette.primary.dark,
          },
        },
      }}
    >
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          onClick={(e) => {
            // 해시 링크 클릭 시 해당 요소로 포커스 이동
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // 포커스 가능한 요소라면 포커스 이동
              if (target instanceof HTMLElement) {
                target.setAttribute('tabindex', '-1');
                target.focus();
                // 일시적인 tabindex 제거
                setTimeout(() => {
                  target.removeAttribute('tabindex');
                }, 100);
              }
            }
          }}
        >
          {link.label}
        </Link>
      ))}
    </Box>
  );
};

/**
 * 메인 콘텐츠 영역을 표시하는 컴포넌트
 */
export const MainContent: React.FC<{
  children: React.ReactNode;
  id?: string;
}> = ({ children, id = 'main-content' }) => {
  return (
    <Box
      component="main"
      id={id}
      role="main"
      aria-label="메인 콘텐츠"
      sx={{
        outline: 'none',
        '&:focus': {
          outline: 'none',
        },
      }}
      tabIndex={-1}
    >
      {children}
    </Box>
  );
};

/**
 * 네비게이션 영역을 표시하는 컴포넌트
 */
export const NavigationContent: React.FC<{
  children: React.ReactNode;
  id?: string;
  ariaLabel?: string;
}> = ({ children, id = 'navigation', ariaLabel = '메인 네비게이션' }) => {
  return (
    <Box
      component="nav"
      id={id}
      role="navigation"
      aria-label={ariaLabel}
      sx={{
        outline: 'none',
        '&:focus': {
          outline: 'none',
        },
      }}
      tabIndex={-1}
    >
      {children}
    </Box>
  );
};

/**
 * 푸터 영역을 표시하는 컴포넌트
 */
export const FooterContent: React.FC<{
  children: React.ReactNode;
  id?: string;
}> = ({ children, id = 'footer' }) => {
  return (
    <Box
      component="footer"
      id={id}
      role="contentinfo"
      aria-label="사이트 정보"
      sx={{
        outline: 'none',
        '&:focus': {
          outline: 'none',
        },
      }}
      tabIndex={-1}
    >
      {children}
    </Box>
  );
};

export default SkipNavigation;