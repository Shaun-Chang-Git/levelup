import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as UpdateIcon,
} from '@mui/icons-material';
import { usePWA } from '../../hooks/usePWA';
import InstallPrompt from './InstallPrompt';

const PWAManager: React.FC = () => {
  const {
    canInstall,
    isUpdateAvailable,
    isOnline,
    installPWA,
    updateApp,
    dismissUpdate,
  } = usePWA();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [hasShownInstallPrompt, setHasShownInstallPrompt] = useState(false);

  // PWA 설치 프롬프트 자동 표시 (첫 방문 후 일정 시간 후)
  useEffect(() => {
    if (canInstall && !hasShownInstallPrompt) {
      const hasShownBefore = localStorage.getItem('pwa-install-prompt-shown');
      const lastShown = localStorage.getItem('pwa-install-prompt-last-shown');
      const now = Date.now();
      
      if (!hasShownBefore) {
        // 첫 방문 후 30초 후에 표시
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
          setHasShownInstallPrompt(true);
          localStorage.setItem('pwa-install-prompt-shown', 'true');
          localStorage.setItem('pwa-install-prompt-last-shown', now.toString());
        }, 30000);

        return () => clearTimeout(timer);
      } else if (lastShown) {
        // 7일 후에 다시 표시
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        if (parseInt(lastShown) < weekAgo) {
          const timer = setTimeout(() => {
            setShowInstallPrompt(true);
            setHasShownInstallPrompt(true);
            localStorage.setItem('pwa-install-prompt-last-shown', now.toString());
          }, 10000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [canInstall, hasShownInstallPrompt]);

  // 오프라인 상태 알림
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    }
  }, [isOnline]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowInstallPrompt(false);
    }
    return success;
  };

  const handleCloseInstallPrompt = () => {
    setShowInstallPrompt(false);
    // 하루 동안 다시 표시하지 않음
    const tomorrow = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-prompt-dismissed-until', tomorrow.toString());
  };

  const handleUpdate = () => {
    updateApp();
  };

  const handleDismissUpdate = () => {
    dismissUpdate();
  };

  const handleCloseOfflineAlert = () => {
    setShowOfflineAlert(false);
  };

  return (
    <>
      {/* PWA 설치 프롬프트 */}
      <InstallPrompt
        open={showInstallPrompt}
        onInstall={handleInstall}
        onClose={handleCloseInstallPrompt}
      />

      {/* 앱 업데이트 알림 */}
      <Snackbar
        open={isUpdateAvailable}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity="info"
          variant="filled"
          icon={<UpdateIcon />}
          action={
            <Box>
              <Button
                color="inherit"
                size="small"
                onClick={handleUpdate}
                sx={{ mr: 1 }}
              >
                업데이트
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleDismissUpdate}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          새로운 버전이 사용 가능합니다.
        </Alert>
      </Snackbar>

      {/* 오프라인 상태 알림 */}
      <Snackbar
        open={showOfflineAlert && !isOnline}
        autoHideDuration={6000}
        onClose={handleCloseOfflineAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 8, sm: 2 } }}
      >
        <Alert
          onClose={handleCloseOfflineAlert}
          severity="warning"
          variant="filled"
        >
          인터넷 연결이 끊어졌습니다. 오프라인 모드에서 제한된 기능을 사용할 수 있습니다.
        </Alert>
      </Snackbar>

      {/* 온라인 복구 알림 */}
      <Snackbar
        open={isOnline && showOfflineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 8, sm: 2 } }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowOfflineAlert(false)}
        >
          인터넷 연결이 복구되었습니다.
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAManager;