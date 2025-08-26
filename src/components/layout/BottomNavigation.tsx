import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Badge,
  Paper,
  Box
} from '@mui/material';
import {
  Dashboard,
  EmojiEvents,
  People,
  TrackChanges,
  Repeat
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useSocial';
import { useSafeArea } from '../../hooks/useResponsive';

interface BottomNavigationProps {
  show: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ show }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const safeArea = useSafeArea();
  const { unreadCount } = useNotifications();

  // 현재 경로에 따른 활성 탭 결정
  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path === '/goals') return 1;
    if (path === '/habits') return 2;
    if (path === '/achievements' || path === '/challenges' || path === '/badges' || path === '/leaderboard') return 3;
    if (path === '/social') return 4;
    return 0; // 기본값
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/goals');
        break;
      case 2:
        navigate('/habits');
        break;
      case 3:
        navigate('/achievements');
        break;
      case 4:
        navigate('/social');
        break;
      default:
        navigate('/dashboard');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        paddingBottom: `${safeArea.bottom}px`,
        transform: show ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        sx={{
          height: 56,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            paddingTop: 1,
            paddingBottom: 1,
            '&.Mui-selected': {
              paddingTop: 1,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="대시보드"
          icon={<Dashboard />}
        />
        <BottomNavigationAction
          label="목표"
          icon={<EmojiEvents />}
        />
        <BottomNavigationAction
          label="습관"
          icon={<Repeat />}
        />
        <BottomNavigationAction
          label="성과"
          icon={<TrackChanges />}
        />
        <BottomNavigationAction
          label="소셜"
          icon={
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              max={99}
              invisible={unreadCount === 0}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.625rem',
                  minWidth: 16,
                  height: 16,
                  top: -2,
                  right: -2,
                }
              }}
            >
              <People />
            </Badge>
          }
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

// 하단 네비게이션 높이만큼 여백을 제공하는 Spacer 컴포넌트
export const BottomNavigationSpacer: React.FC<{ show: boolean }> = ({ show }) => {
  const safeArea = useSafeArea();

  if (!show) {
    return null;
  }

  return (
    <Box
      sx={{
        height: 56 + safeArea.bottom,
        flexShrink: 0,
      }}
    />
  );
};

export default BottomNavigation;