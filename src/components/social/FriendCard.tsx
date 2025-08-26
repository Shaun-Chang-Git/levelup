import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton
} from '@mui/material';
import {
  PersonAdd,
  PersonRemove,
  Message,
  MoreVert
} from '@mui/icons-material';
import type { FriendListItem, FollowStatus, UserProfile } from '../../types';

interface FriendCardProps {
  user: UserProfile;
  followStatus?: FollowStatus;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMessage?: () => void;
  variant?: 'friend' | 'following' | 'follower' | 'search';
  loading?: boolean;
}

const FriendCard: React.FC<FriendCardProps> = ({
  user,
  followStatus,
  onFollow,
  onUnfollow,
  onMessage,
  variant = 'friend',
  loading = false
}) => {
  const getLevelColor = (level: number) => {
    if (level >= 30) return '#9c27b0'; // Purple
    if (level >= 20) return '#ff9800'; // Orange
    if (level >= 10) return '#2196f3'; // Blue
    return '#4caf50'; // Green
  };

  const getVariantText = () => {
    switch (variant) {
      case 'friend': return '친구';
      case 'following': return '팔로잉';
      case 'follower': return '팔로워';
      default: return '';
    }
  };

  const getActionButton = () => {
    if (variant === 'search') {
      if (followStatus?.isFollowing) {
        return (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<PersonRemove />}
            onClick={onUnfollow}
            disabled={loading}
            size="small"
          >
            언팔로우
          </Button>
        );
      } else {
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAdd />}
            onClick={onFollow}
            disabled={loading}
            size="small"
          >
            팔로우
          </Button>
        );
      }
    }

    if (variant === 'following') {
      return (
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PersonRemove />}
          onClick={onUnfollow}
          disabled={loading}
          size="small"
        >
          언팔로우
        </Button>
      );
    }

    if (variant === 'follower' && !followStatus?.isFollowing) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={onFollow}
          disabled={loading}
          size="small"
        >
          맞팔로우
        </Button>
      );
    }

    return null;
  };

  return (
    <Card sx={{ mb: 1, '&:hover': { boxShadow: 4 } }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" flex={1}>
            <Avatar
              src={user.avatar_url}
              sx={{ 
                width: 48, 
                height: 48, 
                mr: 2,
                bgcolor: getLevelColor(user.level)
              }}
            >
              {user.display_name?.[0]?.toUpperCase() || '?'}
            </Avatar>

            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography 
                  variant="h6" 
                  sx={{ fontSize: '1rem', fontWeight: 600 }}
                >
                  {user.display_name || `사용자${user.id.slice(0, 6)}`}
                </Typography>
                
                {variant !== 'search' && (
                  <Chip
                    label={getVariantText()}
                    size="small"
                    color={variant === 'friend' ? 'primary' : 'default'}
                    variant={variant === 'friend' ? 'filled' : 'outlined'}
                  />
                )}

                {followStatus?.isMutual && variant === 'search' && (
                  <Chip
                    label="친구"
                    size="small"
                    color="primary"
                    variant="filled"
                  />
                )}
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  레벨 {user.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.total_points.toLocaleString()} 포인트
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {getActionButton()}
            
            {variant === 'friend' && onMessage && (
              <IconButton
                size="small"
                onClick={onMessage}
                sx={{ color: 'primary.main' }}
              >
                <Message />
              </IconButton>
            )}

            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FriendCard;