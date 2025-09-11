import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  LinearProgress,
  Chip,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  useTheme
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  CheckCircle
} from '@mui/icons-material';
import { Goal, GoalStatus, GoalDifficulty } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onUpdateProgress?: (goalId: string, progress: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
  goal, 
  onEdit, 
  onDelete, 
  onUpdateProgress 
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const progressPercentage = goal.target_value 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100)
    : 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getDifficultyColor = (difficulty: GoalDifficulty): string => {
    const colors = {
      [GoalDifficulty.EASY]: theme.palette.success.main,
      [GoalDifficulty.MEDIUM]: theme.palette.warning.main,
      [GoalDifficulty.HARD]: theme.palette.error.main,
      [GoalDifficulty.EXPERT]: theme.palette.secondary.main,
    };
    return colors[difficulty];
  };

  const getDifficultyLabel = (difficulty: GoalDifficulty): string => {
    const labels = {
      [GoalDifficulty.EASY]: '쉬움',
      [GoalDifficulty.MEDIUM]: '보통',
      [GoalDifficulty.HARD]: '어려움',
      [GoalDifficulty.EXPERT]: '전문가',
    };
    return labels[difficulty];
  };

  const getStatusIcon = (status: GoalStatus) => {
    const icons = {
      [GoalStatus.ACTIVE]: <PlayArrow color="primary" />,
      [GoalStatus.COMPLETED]: <CheckCircle color="success" />,
      [GoalStatus.PAUSED]: <Pause color="warning" />,
      [GoalStatus.CANCELLED]: <Delete color="error" />,
    };
    return icons[status];
  };

  const getStatusLabel = (status: GoalStatus): string => {
    const labels = {
      [GoalStatus.ACTIVE]: '진행중',
      [GoalStatus.COMPLETED]: '완료',
      [GoalStatus.PAUSED]: '일시정지',
      [GoalStatus.CANCELLED]: '취소',
    };
    return labels[status];
  };

  const handleEdit = () => {
    onEdit?.(goal);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(goal.id);
    handleMenuClose();
  };

  const handleProgressUpdate = (): void => {
    const newProgress = prompt(
      `현재 진행상황을 입력하세요 (${goal.unit || '단위'}):`,
      goal.current_value.toString()
    );
    
    if (newProgress && !isNaN(Number(newProgress))) {
      onUpdateProgress?.(goal.id, Number(newProgress));
    }
  };

  const formatDeadline = (deadline: string): string => {
    const date = new Date(deadline);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = goal.target_date && new Date(goal.target_date) < new Date() && goal.status === GoalStatus.ACTIVE;
  const daysLeft = goal.target_date ? 
    Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    null;

  return (
    <Card
      sx={{
        mb: { xs: 1, sm: 2 },
        mx: { xs: 1, sm: 0 },
        position: 'relative',
        border: isOverdue ? 2 : 0,
        borderColor: isOverdue ? 'error.main' : 'transparent',
        '&:hover': {
          elevation: 4,
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          transition: 'transform 0.2s ease-in-out',
        },
      }}
      elevation={2}
    >
      <CardContent sx={{ pb: isMobile ? 2 : 1 }}>
        {/* Header with Status and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(goal.status)}
            <Typography 
              variant={isMobile ? "body2" : "body1"} 
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {getStatusLabel(goal.status)}
            </Typography>
          </Box>
          
          {(onEdit || onDelete) && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ p: { xs: 0.5, sm: 1 } }}
            >
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Title and Description */}
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h3" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.5rem' },
            fontWeight: 600,
            lineHeight: 1.3,
            mb: goal.description ? 1 : 2
          }}
        >
          {goal.title}
        </Typography>

        {goal.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            paragraph
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              mb: 2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, sm: 3 },
              WebkitBoxOrient: 'vertical',
            }}
          >
            {goal.description}
          </Typography>
        )}

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={isNaN(progressPercentage) ? 0 : progressPercentage}
            sx={{
              height: { xs: 8, sm: 10 },
              borderRadius: 5,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: getDifficultyColor(goal.difficulty),
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {goal.current_value.toLocaleString()} / {goal.target_value?.toLocaleString() || '∞'} {goal.unit || ''}
            </Typography>
            <Typography variant="body2" color="text.primary" fontWeight={600}>
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
        </Box>

        {/* Footer with Difficulty and Deadline */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={getDifficultyLabel(goal.difficulty)}
            size={isMobile ? "small" : "medium"}
            sx={{
              backgroundColor: getDifficultyColor(goal.difficulty),
              color: 'white',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          />

          {goal.target_date && (
            <Typography 
              variant="caption" 
              color={isOverdue ? "error.main" : "text.secondary"}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: isOverdue ? 600 : 400
              }}
            >
              📅 {formatDeadline(goal.target_date)}
              {daysLeft !== null && (
                <span>
                  {daysLeft > 0 ? ` (${daysLeft}일 남음)` : ' (마감)'}
                </span>
              )}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Action Buttons */}
      {goal.status === GoalStatus.ACTIVE && onUpdateProgress && (
        <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            onClick={handleProgressUpdate}
            fullWidth
            sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 0.5, sm: 1 }
            }}
          >
            📈 진행상황 업데이트
          </Button>
        </CardActions>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            수정
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            삭제
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default GoalCard;