import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Share,
  MoreVert,
  Public,
  People,
  Visibility,
  Lock,
  Comment,
  Favorite
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import type { GoalShare, GoalShareOptions } from '../../types';

interface GoalShareCardProps {
  goalShare: GoalShare;
  onUpdateShare?: (shareType: string, options: GoalShareOptions) => void;
  onUnshare?: () => void;
  onReact?: () => void;
  onComment?: () => void;
  isOwner?: boolean;
  canInteract?: boolean;
}

const GoalShareCard: React.FC<GoalShareCardProps> = ({
  goalShare,
  onUpdateShare,
  onUnshare,
  onReact,
  onComment,
  isOwner = false,
  canInteract = true
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareType, setShareType] = useState(goalShare.share_type);
  const [shareOptions, setShareOptions] = useState({
    allowComments: goalShare.allow_comments,
    allowReactions: goalShare.allow_reactions,
    showProgress: goalShare.show_progress,
    shareMessage: goalShare.share_message || ''
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditDialogOpen = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    // 원래 값으로 복원
    setShareType(goalShare.share_type);
    setShareOptions({
      allowComments: goalShare.allow_comments,
      allowReactions: goalShare.allow_reactions,
      showProgress: goalShare.show_progress,
      shareMessage: goalShare.share_message || ''
    });
  };

  const handleSaveChanges = () => {
    if (onUpdateShare) {
      onUpdateShare(shareType, shareOptions);
    }
    setEditDialogOpen(false);
  };

  const handleUnshare = () => {
    if (onUnshare) {
      onUnshare();
    }
    handleMenuClose();
  };

  const getShareTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Public />;
      case 'friends':
        return <People />;
      case 'followers':
        return <Visibility />;
      case 'private':
        return <Lock />;
      default:
        return <Share />;
    }
  };

  const getShareTypeLabel = (type: string) => {
    switch (type) {
      case 'public':
        return '전체 공개';
      case 'friends':
        return '친구만';
      case 'followers':
        return '팔로워만';
      case 'private':
        return '비공개';
      default:
        return '공유';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4caf50';
      case 'medium':
        return '#2196f3';
      case 'hard':
        return '#ff9800';
      case 'expert':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const calculateProgress = () => {
    if (!goalShare.goal || !goalShare.goal.target_value) return 0;
    return (goalShare.goal.current_value / goalShare.goal.target_value) * 100;
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).fromNow();
  };

  return (
    <>
      <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
        <CardContent>
          {/* 헤더 */}
          <Box display="flex" alignItems="flex-start" mb={2}>
            <Avatar
              src={goalShare.user_profile?.avatar_url}
              sx={{ width: 40, height: 40, mr: 2 }}
            >
              {goalShare.user_profile?.display_name?.[0]?.toUpperCase() || '?'}
            </Avatar>

            <Box flex={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ fontWeight: 600, fontSize: '0.95rem' }}
                  >
                    {goalShare.user_profile?.display_name || '사용자'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(goalShare.shared_at)}
                    </Typography>
                    <Chip
                      icon={getShareTypeIcon(goalShare.share_type)}
                      label={getShareTypeLabel(goalShare.share_type)}
                      size="small"
                      variant="outlined"
                      color={goalShare.share_type === 'public' ? 'primary' : 'default'}
                    />
                  </Box>
                </Box>

                {isOwner && (
                  <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVert />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>

          {/* 공유 메시지 */}
          {goalShare.share_message && (
            <Typography 
              variant="body2" 
              sx={{ mb: 2, fontStyle: 'italic' }}
            >
              "{goalShare.share_message}"
            </Typography>
          )}

          {/* 목표 정보 */}
          {goalShare.goal && (
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: `2px solid ${getDifficultyColor(goalShare.goal.difficulty)}`
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography 
                  variant="h6" 
                  sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                >
                  🎯 {goalShare.goal.title}
                </Typography>
                
                <Chip
                  label={
                    goalShare.goal.difficulty === 'easy' ? '쉬움' :
                    goalShare.goal.difficulty === 'medium' ? '보통' :
                    goalShare.goal.difficulty === 'hard' ? '어려움' : '전문가'
                  }
                  size="small"
                  sx={{ 
                    bgcolor: getDifficultyColor(goalShare.goal.difficulty),
                    color: 'white'
                  }}
                />
              </Box>

              {goalShare.goal.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2 }}
                >
                  {goalShare.goal.description}
                </Typography>
              )}

              {/* 진행률 표시 (설정에 따라) */}
              {goalShare.show_progress && goalShare.goal.target_value && (
                <Box mb={1}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      진행률
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {goalShare.goal.current_value} / {goalShare.goal.target_value} {goalShare.goal.unit}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(calculateProgress(), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.300',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getDifficultyColor(goalShare.goal.difficulty)
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {Math.round(calculateProgress())}% 완료
                  </Typography>
                </Box>
              )}

              {/* 목표 상태 */}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={
                    goalShare.goal.status === 'active' ? '진행 중' :
                    goalShare.goal.status === 'completed' ? '완료' :
                    goalShare.goal.status === 'paused' ? '일시정지' : '취소됨'
                  }
                  size="small"
                  color={
                    goalShare.goal.status === 'completed' ? 'success' :
                    goalShare.goal.status === 'active' ? 'primary' :
                    goalShare.goal.status === 'paused' ? 'warning' : 'default'
                  }
                />

                {goalShare.goal.target_date && (
                  <Typography variant="caption" color="text.secondary">
                    목표일: {new Date(goalShare.goal.target_date).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* 상호작용 버튼 */}
          {canInteract && (
            <Box display="flex" alignItems="center" gap={1} mt={2}>
              {goalShare.allow_reactions && onReact && (
                <Button
                  size="small"
                  startIcon={<Favorite />}
                  onClick={onReact}
                  variant="outlined"
                >
                  응원하기
                </Button>
              )}

              {goalShare.allow_comments && onComment && (
                <Button
                  size="small"
                  startIcon={<Comment />}
                  onClick={onComment}
                  variant="outlined"
                >
                  댓글
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 메뉴 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditDialogOpen}>
          공유 설정 수정
        </MenuItem>
        <MenuItem onClick={handleUnshare} sx={{ color: 'error.main' }}>
          공유 해제
        </MenuItem>
      </Menu>

      {/* 공유 설정 수정 다이얼로그 */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>목표 공유 설정 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>공유 범위</InputLabel>
              <Select
                value={shareType}
                onChange={(e) => setShareType(e.target.value)}
                label="공유 범위"
              >
                <MenuItem value="public">전체 공개</MenuItem>
                <MenuItem value="friends">친구만</MenuItem>
                <MenuItem value="followers">팔로워만</MenuItem>
                <MenuItem value="private">비공개</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              label="공유 메시지"
              placeholder="목표에 대한 간단한 설명을 추가하세요..."
              value={shareOptions.shareMessage}
              onChange={(e) => setShareOptions(prev => ({ ...prev, shareMessage: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareOptions.showProgress}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, showProgress: e.target.checked }))}
                  />
                }
                label="진행률 표시"
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareOptions.allowReactions}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, allowReactions: e.target.checked }))}
                  />
                }
                label="반응 허용"
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareOptions.allowComments}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, allowComments: e.target.checked }))}
                  />
                }
                label="댓글 허용"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>취소</Button>
          <Button onClick={handleSaveChanges} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoalShareCard;