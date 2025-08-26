import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { ko } from 'date-fns/locale/ko';
import { Category, Goal } from '../../types';
import { GoalsService } from '../../services/goalsService';

interface EditGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  goal: Goal | null;
  categories: Category[];
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  open,
  onClose,
  onSubmit,
  goal,
  categories,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
    target_value: '',
    unit: '',
    target_date: null as Date | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정할 목표 데이터로 폼 초기화
  useEffect(() => {
    if (goal && open) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        category_id: goal.category_id || '',
        difficulty: goal.difficulty || 'medium',
        target_value: goal.target_value?.toString() || '',
        unit: goal.unit || '',
        target_date: goal.target_date ? new Date(goal.target_date) : null,
      });
      setError(null);
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goal) {
      setError('수정할 목표를 찾을 수 없습니다.');
      return;
    }

    if (!formData.title.trim()) {
      setError('목표 제목을 입력해주세요.');
      return;
    }

    if (!formData.category_id) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updates: Partial<Goal> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        difficulty: formData.difficulty,
        target_value: formData.target_value ? parseInt(formData.target_value) : null,
        unit: formData.unit.trim() || null,
        target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : null,
        reward_points: GoalsService.calculateRewardPoints(formData.difficulty),
      };

      await onSubmit(goal.id, updates);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '목표 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
    }
  };

  // 난이도별 색상과 설명
  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: '#4CAF50', label: '쉬움', points: 50, desc: '간단하고 달성하기 쉬운 목표' };
      case 'medium':
        return { color: '#FF9800', label: '보통', points: 100, desc: '적당한 노력이 필요한 목표' };
      case 'hard':
        return { color: '#F44336', label: '어려움', points: 200, desc: '상당한 노력과 의지가 필요한 목표' };
      case 'expert':
        return { color: '#9C27B0', label: '전문가', points: 500, desc: '매우 도전적이고 장기적인 목표' };
      default:
        return { color: '#2196F3', label: '보통', points: 100, desc: '' };
    }
  };

  const selectedDifficulty = getDifficultyInfo(formData.difficulty);

  // 목표가 없으면 모달을 표시하지 않음
  if (!goal) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>목표 수정</DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* 목표 제목 */}
            <TextField
              autoFocus
              margin="dense"
              label="목표 제목 *"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 매일 30분 독서하기"
              sx={{ mb: 2 }}
            />

            {/* 목표 설명 */}
            <TextField
              margin="dense"
              label="목표 설명 (선택사항)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="목표에 대한 상세한 설명을 입력하세요"
              sx={{ mb: 2 }}
            />

            {/* 카테고리 */}
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>카테고리 *</InputLabel>
              <Select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                label="카테고리 *"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 난이도 */}
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>난이도</InputLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard' | 'expert' 
                }))}
                label="난이도"
              >
                <MenuItem value="easy">쉬움 (50 포인트)</MenuItem>
                <MenuItem value="medium">보통 (100 포인트)</MenuItem>
                <MenuItem value="hard">어려움 (200 포인트)</MenuItem>
                <MenuItem value="expert">전문가 (500 포인트)</MenuItem>
              </Select>
            </FormControl>

            {/* 난이도 정보 */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={selectedDifficulty.label}
                  size="small"
                  sx={{ 
                    backgroundColor: selectedDifficulty.color + '20', 
                    color: selectedDifficulty.color 
                  }}
                />
                <Typography variant="body2" color="primary">
                  💎 완료 시 {selectedDifficulty.points} 포인트
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {selectedDifficulty.desc}
              </Typography>
            </Box>

            {/* 목표 수치와 단위 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                margin="dense"
                label="목표 수치 (선택사항)"
                type="number"
                variant="outlined"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="예: 30"
                sx={{ flex: 1 }}
              />
              <TextField
                margin="dense"
                label="단위 (선택사항)"
                variant="outlined"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="예: 분, 페이지, 개"
                sx={{ flex: 1 }}
              />
            </Box>

            {/* 목표 달성 날짜 */}
            <DatePicker
              label="목표 달성 날짜 (선택사항)"
              value={formData.target_date}
              onChange={(date) => setFormData(prev => ({ ...prev, target_date: date }))}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  margin: 'dense',
                }
              }}
              minDate={new Date()}
            />

            {/* 진행 상황 정보 */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
              <Typography variant="body2" gutterBottom>
                📊 현재 진행 상황
              </Typography>
              <Typography variant="body2">
                진행률: {goal.current_value || 0}/{goal.target_value || '-'} {goal.unit || ''} 
                ({GoalsService.calculateProgress(goal.current_value || 0, goal.target_value || 0)}%)
              </Typography>
              <Typography variant="body2">
                상태: {goal.status === 'active' ? '진행 중' : 
                       goal.status === 'completed' ? '완료' : 
                       goal.status === 'paused' ? '일시정지' : '취소'}
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} disabled={loading}>
              취소
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !formData.title.trim() || !formData.category_id}
            >
              {loading ? '수정 중...' : '목표 수정'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditGoalModal;