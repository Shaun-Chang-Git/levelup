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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  CloudOff as OfflineIcon,
  FlashOn as SpeedIcon,
  Shield as SecurityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useResponsive } from '../../hooks/useResponsive';

interface InstallPromptProps {
  open: boolean;
  onInstall: () => Promise<boolean>;
  onClose: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ open, onInstall, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await onInstall();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const features = [
    {
      icon: <OfflineIcon color="primary" />,
      title: '오프라인 사용',
      description: '인터넷 연결 없이도 앱 사용 가능',
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: '빠른 로딩',
      description: '네이티브 앱처럼 빠른 실행',
    },
    {
      icon: <SecurityIcon color="primary" />,
      title: '안전한 설치',
      description: '앱스토어 없이도 안전하게 설치',
    },
    {
      icon: <NotificationsIcon color="primary" />,
      title: '푸시 알림',
      description: '중요한 알림을 놓치지 마세요',
    },
  ];

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
          <Box
            sx={{
              fontSize: '2rem',
              mr: 1,
            }}
          >
            🎯
          </Box>
          <Typography variant="h6" component="div">
            LevelUp 앱 설치
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
        <Typography variant="body1" color="text.secondary" paragraph>
          LevelUp을 홈 화면에 추가하여 더 편리하게 이용하세요.
          네이티브 앱과 같은 경험을 제공합니다.
        </Typography>

        <List dense>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {feature.icon}
              </ListItemIcon>
              <ListItemText
                primary={feature.title}
                secondary={feature.description}
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
                secondaryTypographyProps={{
                  fontSize: '0.8125rem',
                }}
              />
            </ListItem>
          ))}
        </List>

        {isMobile && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              💡 <strong>설치 방법:</strong> 설치 버튼을 클릭한 후 브라우저에서 
              "홈 화면에 추가" 또는 "설치"를 선택하세요.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          color="inherit"
          size={isMobile ? "large" : "medium"}
        >
          나중에
        </Button>
        <Button
          onClick={handleInstall}
          variant="contained"
          startIcon={<InstallIcon />}
          disabled={installing}
          size={isMobile ? "large" : "medium"}
          sx={{
            minWidth: 120,
            ml: 1,
          }}
        >
          {installing ? '설치 중...' : '설치하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InstallPrompt;