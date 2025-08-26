import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Smartphone as SmartphoneIcon,
} from '@mui/icons-material';
import { usePWA } from '../../hooks/usePWA';
import { useResponsive } from '../../hooks/useResponsive';
import InstallPrompt from './InstallPrompt';

const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, installPWA } = usePWA();
  const { isMobile } = useResponsive();
  const [showPrompt, setShowPrompt] = useState(false);

  if (isInstalled || !canInstall) {
    return null;
  }

  const handleClick = () => {
    if (isMobile) {
      setShowPrompt(true);
    } else {
      installPWA();
    }
  };

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowPrompt(false);
    }
    return success;
  };

  return (
    <>
      <Tooltip title="앱 설치">
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
            variant="dot"
            color="success"
            sx={{
              '& .MuiBadge-dot': {
                backgroundColor: '#4caf50',
                boxShadow: `0 0 0 2px rgba(76, 175, 80, 0.3)`,
                animation: 'pulse 2s infinite',
              },
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(0.95)',
                  boxShadow: `0 0 0 0 rgba(76, 175, 80, 0.7)`,
                },
                '70%': {
                  transform: 'scale(1)',
                  boxShadow: `0 0 0 10px rgba(76, 175, 80, 0)`,
                },
                '100%': {
                  transform: 'scale(0.95)',
                  boxShadow: `0 0 0 0 rgba(76, 175, 80, 0)`,
                },
              },
            }}
          >
            {isMobile ? <SmartphoneIcon /> : <InstallIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <InstallPrompt
        open={showPrompt}
        onInstall={handleInstall}
        onClose={() => setShowPrompt(false)}
      />
    </>
  );
};

export default PWAInstallButton;