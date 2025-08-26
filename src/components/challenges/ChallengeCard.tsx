import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Star as StarIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as JoinIcon,
  Close as AbandonIcon,
  GetApp as ClaimIcon,
} from '@mui/icons-material';
import { Challenge, UserChallenge } from '../../types';
import { ChallengesService } from '../../services/challengesService';
import { useResponsive } from '../../hooks/useResponsive';

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  showActions?: boolean;
  onJoin?: (challengeId: string) => void;
  onAbandon?: (challengeId: string) => void;
  onClaimReward?: (challengeId: string) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userChallenge,
  showActions = true,
  onJoin,
  onAbandon,
  onClaimReward
}) => {
  const { isMobile } = useResponsive();
  
  // 난이도별 색상
  const difficultyColor = ChallengesService.getDifficultyColor(challenge.difficulty);
  
  // 타입별 라벨
  const getTypeLabel = (type: Challenge['type']) => {
    switch (type) {
      case 'daily': return '일일';
      case 'weekly': return '주간';
      case 'monthly': return '월간';
      case 'special': return '특별';
      case 'seasonal': return '시즌';
      default: return type;
    }
  };

  // 진행률 계산
  const progressPercentage = userChallenge 
    ? ChallengesService.calculateProgressPercentage(
        userChallenge.current_progress, 
        userChallenge.target_progress
      )
    : 0;

  // 상태별 색상
  const getStatusColor = (status?: UserChallenge['status']) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'abandoned': return '#757575';
      case 'active': return '#2196F3';
      default: return '#757575';
    }
  };

  // 남은 시간 표시
  const timeRemaining = userChallenge?.deadline 
    ? ChallengesService.getTimeRemaining(userChallenge.deadline)
    : null;

  // 참여 상태 확인
  const isJoined = !!userChallenge;
  const isCompleted = userChallenge?.status === 'completed';
  const isActive = userChallenge?.status === 'active';
  const canClaim = isCompleted && !userChallenge?.reward_claimed;

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        mb: { xs: 1, sm: 0 },
        mx: { xs: 1, sm: 0 },
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: { xs: 2, sm: 3 },
        },
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
    >
      {/* 배경색 상단 바 */}
      <Box 
        sx={{ 
          height: 4,
          backgroundColor: challenge.background_color || difficultyColor,
        }} 
      />

      {/* 헤더 */}
      <Box sx={{ p: { xs: 1.5, sm: 2 }, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          {/* 도전과제 아이콘 */}
          <Avatar 
            sx={{ 
              bgcolor: challenge.background_color || difficultyColor,
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              fontSize: { xs: '1rem', sm: '1.2rem' }
            }}
          >
            {challenge.icon_emoji}
          </Avatar>

          {/* 타입 및 난이도 칩 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            maxWidth: { xs: '60%', sm: 'none' }
          }}>
            <Chip
              label={getTypeLabel(challenge.type)}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                height: { xs: 20, sm: 24 }
              }}
            />
            <Chip
              label={challenge.difficulty}
              size="small"
              sx={{
                backgroundColor: difficultyColor + '20',
                color: difficultyColor,
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                height: { xs: 20, sm: 24 }
              }}
            />
          </Box>
        </Box>

        {/* 제목 */}
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom 
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 600,
            lineHeight: 1.3
          }}
        >
          {challenge.title}
        </Typography>

        {/* 설명 */}
        {challenge.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              display: '-webkit-box',
              WebkitLineClamp: { xs: 1, sm: 2 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {challenge.description}
          </Typography>
        )}
      </Box>

      <CardContent sx={{ pt: 0, pb: 1, px: { xs: 1.5, sm: 2 }, flexGrow: 1 }}>
        {/* 진행률 (참여한 경우에만 표시) */}
        {isJoined && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                진행률
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {userChallenge!.current_progress} / {userChallenge!.target_progress}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage}
              sx={{
                height: { xs: 6, sm: 8 },
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isCompleted ? '#4CAF50' : challenge.background_color || difficultyColor,
                  borderRadius: 4,
                }
              }}
            />
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 0.5, 
                display: 'block',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {Math.round(progressPercentage)}% 완료
            </Typography>
          </Box>
        )}

        {/* 상태 정보 */}
        {userChallenge && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={
                userChallenge.status === 'active' ? '진행중' :
                userChallenge.status === 'completed' ? '완료' :
                userChallenge.status === 'failed' ? '실패' :
                userChallenge.status === 'abandoned' ? '포기' : userChallenge.status
              }
              size="small"
              sx={{
                backgroundColor: getStatusColor(userChallenge.status) + '20',
                color: getStatusColor(userChallenge.status),
                fontSize: '0.7rem'
              }}
            />
            {isCompleted && (
              <CompleteIcon sx={{ color: '#4CAF50', fontSize: '1rem' }} />
            )}
          </Box>
        )}

        {/* 시간 정보 */}
        {timeRemaining && isActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <TimeIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {timeRemaining}
            </Typography>
          </Box>
        )}

        {/* 보상 정보 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
          <TrophyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
          <Typography variant="body2" fontWeight="bold" color="primary">
            {challenge.reward_points} 포인트
          </Typography>
          {challenge.reward_title && (
            <Chip
              label={challenge.reward_title}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', ml: 'auto' }}
            />
          )}
        </Box>

        {/* 특별 정보 */}
        {challenge.is_featured && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <StarIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
            <Typography variant="caption" color="primary" fontWeight="bold">
              추천 도전과제
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* 액션 버튼 */}
      {showActions && (
        <CardActions sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
          {!isJoined ? (
            <Button
              fullWidth
              variant="contained"
              startIcon={isMobile ? null : <JoinIcon />}
              onClick={() => onJoin?.(challenge.id)}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                backgroundColor: challenge.background_color || difficultyColor,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 0.75, sm: 1 },
                '&:hover': {
                  backgroundColor: challenge.background_color || difficultyColor,
                  filter: 'brightness(0.9)'
                }
              }}
            >
              도전 시작
            </Button>
          ) : (
            <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
              {canClaim && (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={isMobile ? null : <ClaimIcon />}
                  onClick={() => onClaimReward?.(challenge.id)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 0.75, sm: 1 }
                  }}
                >
                  보상 수령
                </Button>
              )}
              
              {isActive && (
                <Tooltip title="도전과제 포기">
                  <IconButton
                    color="error"
                    size={isMobile ? "small" : "medium"}
                    onClick={() => onAbandon?.(challenge.id)}
                    sx={{ ml: 'auto' }}
                  >
                    <AbandonIcon fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                </Tooltip>
              )}

              {!isActive && !canClaim && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '100%',
                  py: { xs: 0.75, sm: 1 }
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {userChallenge!.status === 'completed' ? '완료됨' : 
                     userChallenge!.status === 'failed' ? '실패함' : '포기함'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardActions>
      )}

      {/* 보상 미수령 인디케이터 */}
      {canClaim && (
        <Box
          sx={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            animation: 'pulse 2s infinite'
          }}
        >
          <ClaimIcon sx={{ fontSize: '0.8rem', color: 'white' }} />
        </Box>
      )}

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </Card>
  );
};

export default ChallengeCard;