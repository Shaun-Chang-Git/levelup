import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  LinearProgress,
  Chip,
  IconButton,
  Badge
} from '@mui/material';
import { 
  Notifications, 
  Menu as MenuIcon,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive, useHeaderVisibility } from '../../hooks/useResponsive';
import { useNotifications } from '../../hooks/useSocial';
import { useThemeMode } from '../../contexts/ThemeContext';
import PWAInstallButton from '../pwa/PWAInstallButton';
import NotificationButton from '../notifications/NotificationButton';

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const isHeaderVisible = useHeaderVisibility();
  const { unreadCount } = useNotifications();
  const { mode, toggleColorMode, isDark } = useThemeMode();
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      handleMenuClose();
      handleMobileMenuClose();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
    handleMobileMenuClose();
  };

  const calculateLevelProgress = () => {
    if (!profile) return 0;
    const currentLevelXp = (profile.level - 1) * 1000;
    const nextLevelXp = profile.level * 1000;
    const progressXp = profile.total_points - currentLevelXp;
    return (progressXp / 1000) * 100;
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={1}
      sx={{
        transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
        display: { xs: 'block', sm: 'block' }, // 모바일에서도 항상 표시
      }}
    >
      <Toolbar
        variant={isMobile ? 'dense' : 'regular'}
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* 모바일에서만 표시되는 메뉴 버튼 */}
        {isMobile && user && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleMobileMenuOpen}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* 로고 */}
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component={RouterLink} 
          to="/" 
          sx={{ 
            flexGrow: 0, 
            textDecoration: 'none', 
            color: 'inherit',
            mr: { xs: 1, sm: 4 },
            fontWeight: 'bold',
            fontSize: { xs: '1.1rem', sm: '1.5rem' }
          }}
        >
          🎯 LevelUp
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* 사용자가 로그인한 경우 */}
        {user && profile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {/* PWA 설치 버튼 */}
            <PWAInstallButton />

            {/* 다크모드 토글 버튼 */}
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              sx={{ p: 1 }}
              title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>

            {/* 알림 버튼 */}
            <NotificationButton />

            {/* 레벨 및 포인트 정보 */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`레벨 ${profile.level}`} 
                size="small" 
                color="secondary" 
              />
              <Typography variant="body2">
                {profile.total_points.toLocaleString()} 포인트
              </Typography>
            </Box>

            {/* 모바일에서는 간단한 레벨 표시 */}
            {isMobile && (
              <Chip 
                label={`Lv.${profile.level}`} 
                size="small" 
                color="secondary"
                sx={{ fontSize: '0.75rem', height: 24 }}
              />
            )}

            {/* 경험치 바 (태블릿 이상에서만 표시) */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: { sm: 80, md: 100 } }}>
              <LinearProgress 
                variant="determinate" 
                value={calculateLevelProgress()} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#fff'
                  }
                }}
              />
            </Box>

            {/* 사용자 아바타 */}
            <Avatar 
              onClick={handleMenuOpen}
              sx={{ 
                cursor: 'pointer',
                bgcolor: 'secondary.main',
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                fontSize: { xs: '0.875rem', sm: '1.25rem' }
              }}
            >
              {profile.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </Avatar>

            {/* 데스크톱용 사용자 메뉴 */}
            {!isMobile && (
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                  }
                }}
              >
                <MenuItem onClick={() => handleNavigate('/dashboard')}>
                  대시보드
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/goals')}>
                  내 목표
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/habits')}>
                  습관 추적
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/achievements')}>
                  업적
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/challenges')}>
                  도전과제
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/badges')}>
                  배지
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/leaderboard')}>
                  리더보드
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/social')}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    소셜
                    {unreadCount > 0 && (
                      <Badge 
                        badgeContent={unreadCount} 
                        color="error"
                        max={99}
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  로그아웃
                </MenuItem>
              </Menu>
            )}

            {/* 모바일용 메뉴 */}
            {isMobile && (
              <Menu
                anchorEl={mobileMenuAnchorEl}
                open={Boolean(mobileMenuAnchorEl)}
                onClose={handleMobileMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                  }
                }}
              >
                <MenuItem onClick={() => handleNavigate('/dashboard')}>
                  대시보드
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/goals')}>
                  내 목표
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/habits')}>
                  습관 추적
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/achievements')}>
                  업적
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/challenges')}>
                  도전과제
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/badges')}>
                  배지
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/leaderboard')}>
                  리더보드
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  로그아웃
                </MenuItem>
              </Menu>
            )}
          </Box>
        ) : (
          /* 로그인하지 않은 경우 */
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* PWA 설치 버튼 */}
            <PWAInstallButton />

            {/* 다크모드 토글 버튼 */}
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              sx={{ p: 1 }}
              title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>

            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/login"
              size={isMobile ? "small" : "medium"}
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              로그인
            </Button>
            <Button 
              color="inherit" 
              variant="outlined" 
              component={RouterLink} 
              to="/signup"
              size={isMobile ? "small" : "medium"}
              sx={{ 
                borderColor: 'white', 
                '&:hover': { borderColor: 'white' },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              회원가입
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;