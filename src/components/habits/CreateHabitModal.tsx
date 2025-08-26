import React, { useState } from 'react';
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
  FormControlLabel,
  Switch,
  FormGroup,
  Checkbox,
  Grid,
} from '@mui/material';
import { Category, Goal, RecurringGoalOptions } from '../../types';
import { GoalsService } from '../../services/goalsService';

interface CreateHabitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (habitData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & RecurringGoalOptions) => Promise<void>;
  categories: Category[];
}

const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  open,
  onClose,
  onSubmit,
  categories,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
    target_value: '',
    unit: '',
    // 반복 설정
    is_recurring: true,
    recurrence_type: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrence_interval: 1,
    recurrence_days: [] as number[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('습관 제목을 입력해주세요.');
      return;
    }

    if (!formData.category_id) {
      setError('카테고리를 선택해주세요.');
      return;
    }

    // 주간 반복의 경우 요일이 선택되었는지 확인
    if (formData.recurrence_type === 'weekly' && formData.recurrence_days.length === 0) {
      setError('주간 반복의 경우 최소 한 개의 요일을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const habitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        difficulty: formData.difficulty,
        target_value: formData.target_value ? parseInt(formData.target_value) : null,
        current_value: 0,
        unit: formData.unit.trim() || null,
        status: 'active' as const,
        target_date: null, // 습관은 지속적이므로 종료 날짜 없음
        reward_points: GoalsService.calculateRewardPoints(formData.difficulty),
        streak_count: 0,
        // 반복 설정
        is_recurring: true,
        recurrence_type: formData.recurrence_type,
        recurrence_interval: formData.recurrence_interval,
        recurrence_days: formData.recurrence_days.length > 0 ? formData.recurrence_days : null,
      };

      await onSubmit(habitData);
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        category_id: '',
        difficulty: 'medium',
        target_value: '',
        unit: '',
        is_recurring: true,
        recurrence_type: 'daily',
        recurrence_interval: 1,
        recurrence_days: [],
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '습관 생성에 실패했습니다.');
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

  // 요일 선택 핸들러
  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day].sort()
    }));
  };

  // 난이도별 색상과 설명
  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: '#4CAF50', label: '쉬움', points: 50, desc: '쉽게 실천할 수 있는 습관' };
      case 'medium':
        return { color: '#FF9800', label: '보통', points: 100, desc: '적당한 노력이 필요한 습관' };
      case 'hard':
        return { color: '#F44336', label: '어려움', points: 200, desc: '의지력이 필요한 도전적인 습관' };
      case 'expert':
        return { color: '#9C27B0', label: '전문가', points: 500, desc: '매우 도전적이고 전문적인 습관' };
      default:
        return { color: '#2196F3', label: '보통', points: 100, desc: '' };
    }
  };

  const selectedDifficulty = getDifficultyInfo(formData.difficulty);

  // 요일 이름
  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>새 습관 만들기</DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 기본 정보 */}
          <Typography variant="h6" gutterBottom>
            기본 정보
          </Typography>

          {/* 습관 제목 */}
          <TextField
            autoFocus
            margin="dense"
            label="습관 제목 *"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="예: 매일 30분 운동하기"
            sx={{ mb: 2 }}
          />

          {/* 습관 설명 */}
          <TextField
            margin="dense"
            label="습관 설명 (선택사항)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="이 습관에 대한 상세한 설명을 입력하세요"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* 카테고리 */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
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
            </Grid>

            {/* 난이도 */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
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
            </Grid>
          </Grid>

          {/* 난이도 정보 */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
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
                💎 완료시마다 {selectedDifficulty.points} 포인트
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedDifficulty.desc}
            </Typography>
          </Box>

          {/* 목표 수치와 단위 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="목표 수치 (선택사항)"
                type="number"
                variant="outlined"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="예: 30"
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="단위 (선택사항)"
                variant="outlined"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="예: 분, 개, 잔"
                fullWidth
              />
            </Grid>
          </Grid>

          {/* 반복 설정 */}
          <Typography variant="h6" gutterBottom>
            반복 설정
          </Typography>

          {/* 반복 유형 */}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>반복 유형</InputLabel>
            <Select
              value={formData.recurrence_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                recurrence_type: e.target.value as 'daily' | 'weekly' | 'monthly',
                recurrence_days: [] // 유형 변경시 요일/일자 초기화
              }))}
              label="반복 유형"
            >
              <MenuItem value="daily">매일</MenuItem>
              <MenuItem value="weekly">매주 (요일 선택)</MenuItem>
              <MenuItem value="monthly">매월 (일자 선택)</MenuItem>
            </Select>
          </FormControl>

          {/* 일일 반복 간격 */}
          {formData.recurrence_type === 'daily' && (
            <Box sx={{ mb: 2 }}>
              <TextField
                label="반복 간격 (일)"
                type="number"
                value={formData.recurrence_interval}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  recurrence_interval: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                inputProps={{ min: 1, max: 30 }}
                helperText={formData.recurrence_interval === 1 ? '매일 반복' : `${formData.recurrence_interval}일마다 반복`}
                sx={{ width: 200 }}
              />
            </Box>
          )}

          {/* 주간 반복 요일 선택 */}
          {formData.recurrence_type === 'weekly' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                반복할 요일을 선택하세요
              </Typography>
              <FormGroup row>
                {dayNames.map((day, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={formData.recurrence_days.includes(index + 1)}
                        onChange={() => handleDayToggle(index + 1)}
                        size="small"
                      />
                    }
                    label={day}
                  />
                ))}
              </FormGroup>
              {formData.recurrence_days.length > 0 && (
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  선택된 요일: {formData.recurrence_days.map(d => dayNames[d - 1]).join(', ')}
                </Typography>
              )}
            </Box>
          )}

          {/* 월간 반복 일자 선택 */}
          {formData.recurrence_type === 'monthly' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                반복할 일자를 선택하세요
              </Typography>
              <TextField
                label="반복 일자"
                type="number"
                value={formData.recurrence_days[0] || ''}
                onChange={(e) => {
                  const day = parseInt(e.target.value) || 1;
                  setFormData(prev => ({ 
                    ...prev, 
                    recurrence_days: [Math.max(1, Math.min(31, day))]
                  }));
                }}
                inputProps={{ min: 1, max: 31 }}
                helperText="매월 몇 일에 반복할지 설정 (1-31)"
                sx={{ width: 200 }}
              />
            </Box>
          )}

          {/* 습관 예시 */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
            <Typography variant="body2" gutterBottom>
              💡 습관 예시
            </Typography>
            <Typography variant="body2">
              • 매일: 물 8잔 마시기, 30분 독서하기<br/>
              • 주 3회: 헬스장 가기 (월, 수, 금)<br/>
              • 월 2회: 정리 정돈하기 (1일, 15일)
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
            {loading ? '생성 중...' : '습관 만들기'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateHabitModal;