import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  LocalFireDepartment as FireIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { Goal, HabitCompletionResult } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';

interface HabitCardProps {
  habit: Goal;
  isCompletedToday: boolean;
  onComplete: (habitId: string, notes?: string, value?: number) => Promise<HabitCompletionResult>;
  onUndo: (habitId: string) => Promise<void>;
  onEdit?: (habit: Goal) => void;
  completionRate?: number;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompletedToday,
  onComplete,
  onUndo,
  onEdit,
  completionRate = 0,
}) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [completionDialog, setCompletionDialog] = useState(false);
  const [completionValue, setCompletionValue] = useState(habit.target_value || 1);
  const [completionNotes, setCompletionNotes] = useState('');

  // 완료 처리
  const handleComplete = async () => {
    if (habit.target_value && habit.target_value > 1) {
      // 수치가 있는 경우 다이얼로그 표시
      setCompletionDialog(true);
    } else {
      // 단순 완료
      await performCompletion();
    }
  };

  const performCompletion = async (notes?: string, value?: number) => {
    try {
      setLoading(true);
      const result = await onComplete(habit.id, notes, value);
      
      if (result.is_streak_milestone) {
        // 연속 달성 마일스톤 알림 (추후 구현)
        console.log(`🎉 ${result.current_streak}일 연속 달성!`);
      }
    } catch (error) {
      console.error('습관 완료 실패:', error);
    } finally {
      setLoading(false);
      setCompletionDialog(false);
      setCompletionNotes('');
      setCompletionValue(habit.target_value || 1);
    }
  };

  // 완료 취소
  const handleUndo = async () => {
    try {
      setLoading(true);
      await onUndo(habit.id);
    } catch (error) {
      console.error('습관 완료 취소 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 반복 유형 표시 텍스트
  const getRecurrenceText = () => {
    if (!habit.recurrence_type) return '';

    switch (habit.recurrence_type) {
      case 'daily':
        return habit.recurrence_interval === 1 ? '매일' : `${habit.recurrence_interval}일마다`;
      case 'weekly':
        if (habit.recurrence_days && habit.recurrence_days.length > 0) {
          const dayNames = ['', '월', '화', '수', '목', '금', '토', '일'];
          const days = habit.recurrence_days.map(d => dayNames[d]).join(', ');
          return `매주 ${days}요일`;
        }
        return '매주';
      case 'monthly':
        if (habit.recurrence_days && habit.recurrence_days.length > 0) {
          return `매월 ${habit.recurrence_days[0]}일`;
        }
        return '매월';
      default:
        return '';
    }
  };

  // 난이도별 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#2196F3';
    }
  };

  // 연속 달성 색상
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#9C27B0'; // 보라색 (30일 이상)
    if (streak >= 14) return '#FF5722'; // 주황색 (2주 이상)
    if (streak >= 7) return '#FF9800';  // 노랑색 (1주 이상)
    return '#4CAF50'; // 초록색 (기본)
  };

  return (
    <>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        opacity: isCompletedToday ? 0.8 : 1,
        border: isCompletedToday ? '2px solid #4CAF50' : 'none',
        mb: { xs: 1, sm: 0 },
        mx: { xs: 1, sm: 0 },
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: { xs: 2, sm: 3 },
        },
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}>
        <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2 } }}>
          {/* 제목과 완료 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography 
              variant="h6" 
              component="h3" 
              sx={{ 
                flex: 1, 
                mr: 1, 
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 600,
                lineHeight: 1.3
              }}
            >
              {habit.title}
            </Typography>
            <IconButton 
              color={isCompletedToday ? 'success' : 'default'}
              onClick={isCompletedToday ? handleUndo : handleComplete}
              disabled={loading}
              size={isMobile ? "medium" : "large"}
              sx={{
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 }
              }}
            >
              {isCompletedToday ? 
                <CheckIcon fontSize={isMobile ? "medium" : "large"} /> : 
                <UncheckIcon fontSize={isMobile ? "medium" : "large"} />
              }
            </IconButton>
          </Box>

          {/* 설명 */}
          {habit.description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: { xs: 2, sm: 3 },
                WebkitBoxOrient: 'vertical',
              }}
            >
              {habit.description}
            </Typography>
          )}

          {/* 카테고리, 난이도, 반복 정보 */}
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, mb: 2, flexWrap: 'wrap' }}>
            {habit.categories && (
              <Chip
                label={habit.categories.name}
                size="small"
                sx={{ 
                  backgroundColor: habit.categories.color + '20', 
                  color: habit.categories.color,
                  fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                  height: { xs: 24, sm: 32 }
                }}
              />
            )}
            <Chip
              label={habit.difficulty}
              size="small"
              sx={{ 
                backgroundColor: getDifficultyColor(habit.difficulty) + '20', 
                color: getDifficultyColor(habit.difficulty),
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                height: { xs: 24, sm: 32 }
              }}
            />
            <Chip
              label={getRecurrenceText()}
              size="small"
              variant="outlined"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                height: { xs: 24, sm: 32 }
              }}
            />
          </Box>

          {/* 목표 정보 */}
          {habit.target_value && (
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                목표: {habit.target_value} {habit.unit}
              </Typography>
            </Box>
          )}

          {/* 연속 달성 정보 */}
          {(habit.habit_streak || 0) > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FireIcon sx={{ color: getStreakColor(habit.habit_streak || 0), fontSize: 20 }} />
              <Typography 
                variant="body2" 
                sx={{ color: getStreakColor(habit.habit_streak || 0), fontWeight: 'bold' }}
              >
                {habit.habit_streak}일 연속 달성
              </Typography>
              {(habit.longest_streak || 0) > (habit.habit_streak || 0) && (
                <Typography variant="caption" color="text.secondary">
                  (최고: {habit.longest_streak}일)
                </Typography>
              )}
            </Box>
          )}

          {/* 완료율 (30일 기준) */}
          {completionRate > 0 && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  30일 완료율
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  {completionRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={completionRate} 
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          {/* 보상 포인트 */}
          <Typography variant="body2" color="text.secondary">
            💎 완료시 {habit.reward_points} 포인트
            {(habit.habit_streak || 0) >= 7 && (
              <span style={{ color: '#FF9800', fontWeight: 'bold' }}>
                {' '}(연속 보너스 적용!)
              </span>
            )}
          </Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
          <Box>
            {isCompletedToday ? (
              <Tooltip title="완료 취소">
                <Button
                  size="small"
                  startIcon={<UndoIcon />}
                  onClick={handleUndo}
                  disabled={loading}
                  color="warning"
                >
                  취소
                </Button>
              </Tooltip>
            ) : (
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleComplete}
                disabled={loading}
                color="success"
              >
                완료
              </Button>
            )}
          </Box>

          <Box>
            {onEdit && (
              <Tooltip title="습관 수정">
                <IconButton size="small" onClick={() => onEdit(habit)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardActions>
      </Card>

      {/* 완료 수치 입력 다이얼로그 */}
      <Dialog open={completionDialog} onClose={() => setCompletionDialog(false)}>
        <DialogTitle>
          습관 완료: {habit.title}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`완료량 (${habit.unit})`}
            type="number"
            fullWidth
            variant="outlined"
            value={completionValue}
            onChange={(e) => setCompletionValue(parseInt(e.target.value) || 1)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="메모 (선택사항)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="오늘의 습관 실행에 대한 메모를 남겨보세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={() => performCompletion(completionNotes, completionValue)} 
            variant="contained"
            disabled={loading}
          >
            완료
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HabitCard;