import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as OwnedIcon,
  Lock as LockedIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { Badge, UserBadge } from '../../types';
import { ChallengesService } from '../../services/challengesService';

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  showActions?: boolean;
  onToggleActive?: (badgeId: string, isActive: boolean) => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  userBadge,
  showActions = true,
  onToggleActive
}) => {
  // 소유 여부
  const isOwned = !!userBadge;
  const isActive = userBadge?.is_active || false;

  // 티어별 색상
  const tierColor = ChallengesService.getBadgeTierColor(badge.tier);

  // 희귀도별 배경 스타일
  const getRarityStyle = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return {
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
          borderColor: '#bdbdbd'
        };
      case 'rare':
        return {
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          borderColor: '#2196f3'
        };
      case 'epic':
        return {
          background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
          borderColor: '#9c27b0'
        };
      case 'legendary':
        return {
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
          borderColor: '#ff9800'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
          borderColor: '#bdbdbd'
        };
    }
  };

  const rarityStyle = getRarityStyle(badge.rarity);

  // 티어 라벨
  const getTierLabel = (tier: Badge['tier']) => {
    switch (tier) {
      case 'bronze': return '브론즈';
      case 'silver': return '실버';
      case 'gold': return '골드';
      case 'platinum': return '플래티넘';
      case 'diamond': return '다이아몬드';
      default: return tier;
    }
  };

  // 희귀도 라벨
  const getRarityLabel = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return '일반';
      case 'rare': return '희귀';
      case 'epic': return '영웅';
      case 'legendary': return '전설';
      default: return rarity;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: 2,
        borderColor: isOwned ? rarityStyle.borderColor : 'grey.300',
        background: isOwned ? rarityStyle.background : 'grey.100',
        opacity: isOwned ? 1 : 0.6,
        '&:hover': isOwned ? {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        } : {},
        transition: 'all 0.3s ease',
      }}
    >
      {/* 활성 배지 인디케이터 */}
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            zIndex: 10,
          }}
        >
          <StarIcon sx={{ fontSize: '0.9rem', color: 'white' }} />
        </Box>
      )}

      {/* 잠금 오버레이 (미획득 배지) */}
      {!isOwned && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 5,
            borderRadius: 1,
          }}
        >
          <LockedIcon sx={{ fontSize: '2rem', color: 'white', opacity: 0.8 }} />
        </Box>
      )}

      <CardContent sx={{ textAlign: 'center', flexGrow: 1, p: 2 }}>
        {/* 배지 아이콘 */}
        <Box sx={{ mb: 2 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              backgroundColor: badge.color,
              fontSize: '2.5rem',
              border: `3px solid ${tierColor}`,
              boxShadow: isOwned ? 3 : 1,
            }}
          >
            {badge.icon_emoji}
          </Avatar>
        </Box>

        {/* 배지 이름 */}
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom 
          sx={{ 
            fontSize: '1rem',
            fontWeight: 'bold',
            color: isOwned ? 'text.primary' : 'text.secondary'
          }}
        >
          {badge.name}
        </Typography>

        {/* 배지 설명 */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            minHeight: '2.5em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {badge.description}
        </Typography>

        {/* 티어 및 희귀도 */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={getTierLabel(badge.tier)}
            size="small"
            sx={{
              backgroundColor: tierColor + '20',
              color: tierColor,
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
          <Chip
            label={getRarityLabel(badge.rarity)}
            size="small"
            variant="outlined"
            sx={{
              borderColor: rarityStyle.borderColor,
              color: rarityStyle.borderColor,
              fontSize: '0.7rem'
            }}
          />
        </Box>

        {/* 보너스 포인트 */}
        {badge.bonus_points > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
            <TrophyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
            <Typography variant="body2" fontWeight="bold" color="primary">
              +{badge.bonus_points} 포인트
            </Typography>
          </Box>
        )}

        {/* 획득 날짜 (소유한 경우) */}
        {isOwned && userBadge && (
          <Typography variant="caption" color="text.secondary">
            {new Date(userBadge.earned_at).toLocaleDateString('ko-KR')} 획득
          </Typography>
        )}

        {/* 획득 조건 (미획득인 경우) */}
        {!isOwned && (
          <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              획득 조건을 달성하면 해제됩니다
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* 액션 버튼 (소유한 경우에만) */}
      {showActions && isOwned && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Tooltip title={isActive ? "활성 해제" : "대표 배지로 설정"}>
            <Button
              fullWidth
              variant={isActive ? "contained" : "outlined"}
              color={isActive ? "primary" : "inherit"}
              startIcon={isActive ? <StarIcon /> : <StarBorderIcon />}
              onClick={() => onToggleActive?.(badge.id, !isActive)}
              size="small"
            >
              {isActive ? "활성 배지" : "대표로 설정"}
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* 특별 효과 (희귀도에 따라) */}
      {isOwned && badge.rarity === 'legendary' && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.1) 50%, transparent 70%)',
            animation: 'shimmer 3s infinite',
            pointerEvents: 'none',
            borderRadius: 1,
          }}
        />
      )}

      <style>
        {`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </Card>
  );
};

export default BadgeCard;