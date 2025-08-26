import React from 'react';
import {
  Snackbar,
  Box,
  Typography,
  Avatar,
  Slide,
  Paper,
  LinearProgress,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { TrendingUp as LevelIcon } from '@mui/icons-material';

interface LevelUpNotificationProps {
  newLevel: number;
  totalPoints: number;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const SlideTransition = (props: TransitionProps & { children: React.ReactElement }) => {
  return <Slide {...props} direction="down" />;
};

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  newLevel,
  totalPoints,
  open,
  onClose,
  autoHideDuration = 5000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      sx={{
        '& .MuiSnackbar-root': {
          top: 80, // Header 아래에 표시
        },
      }}
    >
      <Paper
        elevation={8}
        sx={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
          color: 'white',
          p: 3,
          borderRadius: 3,
          minWidth: 350,
          maxWidth: 500,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)',
            animation: 'levelPulse 3s ease-in-out infinite',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              mr: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              fontSize: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              animation: 'levelBounce 2s ease-in-out infinite',
            }}
          >
            <LevelIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🎊 레벨 업!
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              축하합니다! 새로운 레벨에 도달했습니다
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
            레벨 {newLevel}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', opacity: 0.9 }}>
            총 {totalPoints.toLocaleString()} 포인트 달성!
          </Typography>
          
          {/* 진행률 바 (레벨업 애니메이션) */}
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#fff',
                  animation: 'fillProgress 2s ease-in-out',
                },
              }}
            />
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, opacity: 0.8 }}>
              다음 레벨까지: {((newLevel * 1000) - totalPoints).toLocaleString()} 포인트
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
            계속해서 목표를 달성해 더 높은 레벨에 도전해보세요! 🚀
          </Typography>
        </Box>

        {/* 장식용 별들 */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 20,
            fontSize: 20,
            animation: 'twinkle 2s ease-in-out infinite',
          }}
        >
          ✨
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 40,
            right: 50,
            fontSize: 16,
            animation: 'twinkle 2s ease-in-out infinite 0.5s',
          }}
        >
          ⭐
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            fontSize: 18,
            animation: 'twinkle 2s ease-in-out infinite 1s',
          }}
        >
          🌟
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: 50,
            left: 50,
            fontSize: 14,
            animation: 'twinkle 2s ease-in-out infinite 1.5s',
          }}
        >
          ✨
        </Box>
      </Paper>
    </Snackbar>
  );
};

// CSS 애니메이션을 위한 스타일 추가 (전역 CSS에 추가 필요)
const globalStyles = `
  @keyframes levelPulse {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.05); }
  }

  @keyframes levelBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes fillProgress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(0); }
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;

// 스타일 요소 추가
if (typeof document !== 'undefined' && !document.getElementById('levelup-styles')) {
  const style = document.createElement('style');
  style.id = 'levelup-styles';
  style.textContent = globalStyles;
  document.head.appendChild(style);
}

export default LevelUpNotification;