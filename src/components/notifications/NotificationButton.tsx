import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useSocial';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useResponsive } from '../../hooks/useResponsive';
import PushNotificationSettings from './PushNotificationSettings';

const NotificationButton: React.FC = () => {
  const { isMobile } = useResponsive();
  const { unreadCount } = useNotifications();
  const { isSubscribed, permission } = usePushNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isMobile) {
      setShowSettings(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    handleClose();
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const getNotificationIcon = () => {
    if (permission === 'denied' || !isSubscribed) {
      return <NotificationsOffIcon />;
    }
    return <NotificationsIcon />;
  };

  const getTooltipText = () => {
    if (permission === 'denied') {
      return '알림이 차단됨';
    }
    if (!isSubscribed) {
      return '알림 설정';
    }
    return `${unreadCount > 0 ? `${unreadCount}개의 새 알림` : '알림'}`;
  };

  const getBadgeColor = () => {
    if (permission === 'denied') return 'error';
    if (!isSubscribed) return 'warning';
    return 'primary';
  };

  return (
    <>
      <Tooltip title={getTooltipText()}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          size={isMobile ? "small" : "medium"}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color={getBadgeColor()}
            max={99}
            invisible={unreadCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                minWidth: 16,
                height: 16,
              },
            }}
          >
            {getNotificationIcon()}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* 데스크톱 메뉴 */}
      {!isMobile && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 280,
            }
          }}
        >
          {/* 헤더 */}
          <Box sx={{ px: 2, py: 1.5, backgroundColor: 'action.hover' }}>
            <Typography variant="subtitle2" fontWeight="600">
              알림 센터
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {isSubscribed 
                ? `푸시 알림 활성화됨 • ${unreadCount}개 읽지 않음`
                : '푸시 알림 비활성화됨'
              }
            </Typography>
          </Box>

          <Divider />

          {/* 최근 알림 (예시) */}
          {unreadCount > 0 ? (
            <>
              <MenuItem dense>
                <Box>
                  <Typography variant="body2" fontWeight="500">
                    목표 달성 축하합니다! 🎉
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2분 전
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem dense>
                <Box>
                  <Typography variant="body2" fontWeight="500">
                    새로운 습관 알림 ⏰
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    15분 전
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem dense>
                <Box>
                  <Typography variant="body2" fontWeight="500">
                    친구가 당신을 팔로우했습니다 👥
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1시간 전
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <ClearIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="모든 알림 읽음으로 표시"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </MenuItem>
            </>
          ) : (
            <MenuItem disabled>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <NotificationsIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  새로운 알림이 없습니다
                </Typography>
              </Box>
            </MenuItem>
          )}

          <Divider />

          {/* 설정 */}
          <MenuItem onClick={handleOpenSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="알림 설정"
              secondary={isSubscribed ? "알림 관리" : "알림 활성화"}
              primaryTypographyProps={{ fontSize: '0.875rem' }}
              secondaryTypographyProps={{ fontSize: '0.75rem' }}
            />
          </MenuItem>
        </Menu>
      )}

      {/* 푸시 알림 설정 다이얼로그 */}
      <PushNotificationSettings
        open={showSettings}
        onClose={handleCloseSettings}
      />
    </>
  );
};

export default NotificationButton;