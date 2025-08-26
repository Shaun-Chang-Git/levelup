import React from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Avatar,
  Slide,
  Paper,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { AchievementsService } from '../../services/achievementsService';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward_points: number;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const SlideTransition = (props: TransitionProps & { children: React.ReactElement }) => {
  return <Slide {...props} direction="down" />;
};

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  open,
  onClose,
  autoHideDuration = 6000,
}) => {
  if (!achievement) return null;

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)',
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px',
            animation: 'shimmer 2s linear infinite',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              width: 50,
              height: 50,
              mr: 2,
              backgroundColor: AchievementsService.getAchievementColor(achievement.reward_points),
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {AchievementsService.getAchievementIcon(achievement.icon)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              🎉 업적 달성!
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              새로운 업적을 잠금 해제했습니다
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {achievement.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
            {achievement.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              💎 {achievement.reward_points} 포인트 획득
            </Typography>
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {AchievementsService.getAchievementGrade(achievement.reward_points)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 장식용 요소들 */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            animation: 'pulse 2s infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -5,
            left: -5,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            animation: 'pulse 2s infinite 0.5s',
          }}
        />
      </Paper>
    </Snackbar>
  );
};

// CSS 애니메이션을 위한 스타일 추가 (전역 CSS에 추가 필요)
const globalStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.6; }
  }
`;

// 스타일 요소 추가
if (typeof document !== 'undefined' && !document.getElementById('achievement-styles')) {
  const style = document.createElement('style');
  style.id = 'achievement-styles';
  style.textContent = globalStyles;
  document.head.appendChild(style);
}

export default AchievementNotification;