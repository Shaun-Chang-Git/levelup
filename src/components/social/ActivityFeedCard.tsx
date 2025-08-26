import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  Collapse,
  TextField,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MoreVert,
  Send,
  EmojiEmotions,
  Celebration,
  ThumbUp,
  LocalFireDepartment
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ActivityFeed, ActivityComment } from '../../types';

interface ActivityFeedCardProps {
  activity: ActivityFeed;
  comments: ActivityComment[];
  onReact: (reactionType: 'like' | 'love' | 'support' | 'celebrate' | 'wow' | 'motivate') => void;
  onRemoveReaction: () => void;
  onComment: (content: string, parentCommentId?: string) => void;
  onShare?: () => void;
  isLiked?: boolean;
  canInteract?: boolean;
}

const REACTION_ICONS = {
  like: { icon: <ThumbUp />, color: '#1976d2', label: '좋아요' },
  love: { icon: <Favorite />, color: '#f44336', label: '사랑해요' },
  support: { icon: <EmojiEmotions />, color: '#ff9800', label: '응원해요' },
  celebrate: { icon: <Celebration />, color: '#9c27b0', label: '축하해요' },
  wow: { icon: <EmojiEmotions />, color: '#ff5722', label: '놀라워요' },
  motivate: { icon: <LocalFireDepartment />, color: '#4caf50', label: '동기부여' }
};

const ActivityFeedCard: React.FC<ActivityFeedCardProps> = ({
  activity,
  comments,
  onReact,
  onRemoveReaction,
  onComment,
  onShare,
  isLiked = false,
  canInteract = true
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reactionMenuAnchor, setReactionMenuAnchor] = useState<null | HTMLElement>(null);

  const handleReactionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setReactionMenuAnchor(event.currentTarget);
  };

  const handleReactionMenuClose = () => {
    setReactionMenuAnchor(null);
  };

  const handleReaction = (reactionType: keyof typeof REACTION_ICONS) => {
    if (isLiked) {
      onRemoveReaction();
    } else {
      onReact(reactionType);
    }
    handleReactionMenuClose();
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onComment(commentText.trim());
      setCommentText('');
    }
  };

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'goal_completed':
        return '🎉';
      case 'goal_created':
        return '🎯';
      case 'badge_earned':
        return '🏆';
      case 'level_up':
        return '⬆️';
      case 'habit_streak':
        return '🔥';
      case 'challenge_completed':
        return '🏁';
      case 'friend_added':
        return '👥';
      default:
        return '📝';
    }
  };

  const getActivityColor = () => {
    switch (activity.activity_type) {
      case 'goal_completed':
        return '#4caf50';
      case 'badge_earned':
        return '#ff9800';
      case 'level_up':
        return '#9c27b0';
      case 'challenge_completed':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko
    });
  };

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
      <CardContent sx={{ pb: 1 }}>
        {/* 헤더 */}
        <Box display="flex" alignItems="flex-start" mb={2}>
          <Avatar
            src={activity.user_profile?.avatar_url}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {activity.user_profile?.display_name?.[0]?.toUpperCase() || '?'}
          </Avatar>

          <Box flex={1}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                >
                  {activity.user_profile?.display_name || '사용자'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(activity.created_at)}
                </Typography>
              </Box>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* 활동 내용 */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{getActivityIcon()}</span>
              {activity.title}
            </Typography>
          </Box>

          {activity.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {activity.description}
            </Typography>
          )}

          {/* 관련 목표 정보 */}
          {activity.related_goal && (
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                borderLeft: `4px solid ${getActivityColor()}`
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                📌 {activity.related_goal.title}
              </Typography>
              <Chip
                label={activity.related_goal.difficulty === 'easy' ? '쉬움' :
                      activity.related_goal.difficulty === 'medium' ? '보통' :
                      activity.related_goal.difficulty === 'hard' ? '어려움' : '전문가'}
                size="small"
                color={
                  activity.related_goal.difficulty === 'easy' ? 'success' :
                  activity.related_goal.difficulty === 'medium' ? 'primary' :
                  activity.related_goal.difficulty === 'hard' ? 'warning' : 'error'
                }
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          {/* 관련 배지 정보 */}
          {activity.related_badge && (
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                borderLeft: `4px solid ${activity.related_badge.color}`
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {activity.related_badge.icon_emoji} {activity.related_badge.name}
              </Typography>
              <Chip
                label={activity.related_badge.tier}
                size="small"
                sx={{ 
                  mt: 1,
                  bgcolor: activity.related_badge.color + '20',
                  color: activity.related_badge.color
                }}
              />
            </Box>
          )}
        </Box>

        {/* 반응 및 댓글 통계 */}
        <Box display="flex" alignItems="center" justifyContent="between" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={2}>
            {activity.likes_count > 0 && (
              <Typography variant="body2" color="text.secondary">
                ❤️ {activity.likes_count}
              </Typography>
            )}
            {activity.comments_count > 0 && (
              <Typography variant="body2" color="text.secondary">
                💬 {activity.comments_count}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>

      {canInteract && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                color={isLiked ? 'error' : 'default'}
                onClick={handleReactionMenuOpen}
                size="small"
              >
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>

              <IconButton
                onClick={() => setShowComments(!showComments)}
                size="small"
              >
                <Comment />
              </IconButton>

              {onShare && (
                <IconButton onClick={onShare} size="small">
                  <Share />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* 반응 메뉴 */}
          <Menu
            anchorEl={reactionMenuAnchor}
            open={Boolean(reactionMenuAnchor)}
            onClose={handleReactionMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            {Object.entries(REACTION_ICONS).map(([key, reaction]) => (
              <MenuItem
                key={key}
                onClick={() => handleReaction(key as keyof typeof REACTION_ICONS)}
                sx={{ gap: 1 }}
              >
                <Box sx={{ color: reaction.color }}>
                  {reaction.icon}
                </Box>
                {reaction.label}
              </MenuItem>
            ))}
          </Menu>
        </CardActions>
      )}

      {/* 댓글 섹션 */}
      <Collapse in={showComments}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* 댓글 작성 */}
          <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
            <Avatar sx={{ width: 32, height: 32 }}>
              U
            </Avatar>
            <Box flex={1}>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                placeholder="댓글을 작성하세요..."
                variant="outlined"
                size="small"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                size="small"
                startIcon={<Send />}
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                댓글 달기
              </Button>
            </Box>
          </Box>

          {/* 댓글 목록 */}
          {comments.map((comment) => (
            <Box
              key={comment.id}
              display="flex"
              alignItems="flex-start"
              gap={1}
              mb={1}
            >
              <Avatar
                src={comment.user_profile?.avatar_url}
                sx={{ width: 32, height: 32 }}
              >
                {comment.user_profile?.display_name?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box flex={1}>
                <Box 
                  sx={{ 
                    bgcolor: 'grey.100', 
                    borderRadius: 2, 
                    p: 1.5,
                    mb: 0.5 
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    {comment.user_profile?.display_name || '사용자'}
                  </Typography>
                  <Typography variant="body2">
                    {comment.content}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(comment.created_at)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Card>
  );
};

export default ActivityFeedCard;