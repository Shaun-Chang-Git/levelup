import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as AchievementIcon,
  Group as SocialIcon,
  TrendingUp as ProgressIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useResponsive } from '../../hooks/useResponsive';

interface PushNotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  enabled: boolean;
  category: 'habits' | 'achievements' | 'social' | 'progress' | 'security';
}

const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ open, onClose }) => {
  const { isMobile } = useResponsive();
  const {
    isSupported,
    permission,
    isSubscribed,
    isSubscribing,
    error,
    subscribe,
    unsubscribe,
    showLocalNotification,
    clearError,
    canSubscribe,
  } = usePushNotifications();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'habit_reminders',
      title: '습관 알림',
      description: '설정된 시간에 습관 실행 알림',
      icon: <ScheduleIcon color="primary" />,
      enabled: true,
      category: 'habits',
    },
    {
      id: 'achievement_unlocked',
      title: '업적 달성',
      description: '새로운 업적이나 배지 획득 시 알림',
      icon: <AchievementIcon color="primary" />,
      enabled: true,
      category: 'achievements',
    },
    {
      id: 'social_interactions',
      title: '소셜 활동',
      description: '친구 활동, 댓글, 좋아요 알림',
      icon: <SocialIcon color="primary" />,
      enabled: true,
      category: 'social',
    },
    {
      id: 'weekly_progress',
      title: '주간 리포트',
      description: '매주 진행 상황 요약 알림',
      icon: <ProgressIcon color="primary" />,
      enabled: false,
      category: 'progress',
    },
    {
      id: 'security_alerts',
      title: '보안 알림',
      description: '계정 보안 관련 중요 알림',
      icon: <SecurityIcon color="primary" />,
      enabled: true,
      category: 'security',
    },
  ]);

  const handleSubscriptionToggle = async () => {
    try {
      clearError();
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    }
  };

  const handleSettingToggle = (settingId: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleTestNotification = async () => {
    try {
      await showLocalNotification({
        title: '🎯 LevelUp',
        body: '푸시 알림이 정상적으로 작동합니다!',
        tag: 'test-notification',
        requireInteraction: false,
      });
    } catch (error) {
      console.error('Failed to show test notification:', error);
    }
  };

  const getPermissionStatusColor = () => {
    switch (permission) {
      case 'granted': return 'success';
      case 'denied': return 'error';
      default: return 'warning';
    }
  };

  const getPermissionStatusText = () => {
    switch (permission) {
      case 'granted': return '허용됨';
      case 'denied': return '차단됨';
      default: return '미설정';
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="warning">
            현재 브라우저에서는 푸시 알림이 지원되지 않습니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>닫기</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6">
            푸시 알림 설정
          </Typography>
        </Box>
        
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }} 
            onClose={clearError}
          >
            {error}
          </Alert>
        )}

        {/* 전체 알림 상태 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600">
              푸시 알림
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={getPermissionStatusText()}
                color={getPermissionStatusColor()}
                size="small"
                variant="outlined"
              />
              <Switch
                checked={isSubscribed}
                onChange={handleSubscriptionToggle}
                disabled={!canSubscribe || isSubscribing}
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            브라우저 푸시 알림을 통해 중요한 정보를 놓치지 마세요.
          </Typography>

          {permission === 'denied' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.
            </Alert>
          )}

          {isSubscribed && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTestNotification}
                startIcon={<NotificationsIcon />}
              >
                테스트 알림 보내기
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 개별 알림 설정 */}
        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
          알림 종류
        </Typography>

        <List dense disablePadding>
          {settings.map((setting) => (
            <ListItem
              key={setting.id}
              sx={{
                borderRadius: 1,
                mb: 1,
                backgroundColor: 'action.hover',
                opacity: isSubscribed ? 1 : 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {setting.icon}
              </ListItemIcon>
              
              <ListItemText
                primary={setting.title}
                secondary={setting.description}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                }}
              />
              
              <ListItemSecondaryAction>
                <Switch
                  checked={setting.enabled && isSubscribed}
                  onChange={() => handleSettingToggle(setting.id)}
                  disabled={!isSubscribed}
                  size="small"
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {!isSubscribed && (
          <Alert severity="info" sx={{ mt: 2 }}>
            개별 알림 설정을 사용하려면 먼저 푸시 알림을 활성화해주세요.
          </Alert>
        )}

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>알림 관리 팁:</strong><br />
            • 브라우저별로 알림 권한을 관리할 수 있습니다<br />
            • 중요하지 않은 알림은 끄고 필요한 것만 켜두세요<br />
            • 무음 시간대 설정은 브라우저 설정에서 가능합니다
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          닫기
        </Button>
        <Button 
          variant="contained" 
          onClick={onClose}
          startIcon={isSubscribed ? <NotificationsIcon /> : <NotificationsOffIcon />}
        >
          {isSubscribed ? '설정 완료' : '나중에 설정'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PushNotificationSettings;