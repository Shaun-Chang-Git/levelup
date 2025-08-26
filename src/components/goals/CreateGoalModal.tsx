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
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Category, Goal, GoalTemplate } from '../../types';
import { GoalsService } from '../../services/goalsService';
import { TemplatesService } from '../../services/templatesService';
import TemplateSelectionModal from './TemplateSelectionModal';

interface CreateGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  categories: Category[];
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
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
    target_date: null as Date | null,
    is_recurring: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        difficulty: formData.difficulty,
        target_value: formData.target_value ? parseInt(formData.target_value) : null,
        current_value: 0,
        unit: formData.unit.trim() || null,
        status: 'active' as const,
        target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : null,
        reward_points: GoalsService.calculateRewardPoints(formData.difficulty),
        streak_count: 0,
      };

      await onSubmit(goalData);
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        category_id: '',
        difficulty: 'medium',
        target_value: '',
        unit: '',
        target_date: null,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '목표 생성에 실패했습니다.');
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

  // 템플릿 선택 핸들러
  const handleSelectTemplate = async (template: GoalTemplate) => {
    try {
      // 템플릿 사용량 증가
      await TemplatesService.incrementTemplateUsage(template.id);

      // 폼 데이터를 템플릿 값으로 채우기
      setFormData({
        title: template.title,
        description: template.description || '',
        category_id: template.category_id || '',
        difficulty: template.difficulty,
        target_value: template.target_value?.toString() || '',
        unit: template.unit || '',
        target_date: template.duration_days 
          ? new Date(Date.now() + template.duration_days * 24 * 60 * 60 * 1000) 
          : null,
      });

      setTemplateModalOpen(false);
    } catch (error) {
      console.error('템플릿 선택 실패:', error);
      setError('템플릿 적용 중 오류가 발생했습니다.');
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">새 목표 만들기</Typography>
            <Button
              variant="outlined"
              onClick={() => setTemplateModalOpen(true)}
              disabled={loading}
            >
              📋 템플릿 사용
            </Button>
          </Box>
        </DialogTitle>
        
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
              {loading ? '생성 중...' : '목표 만들기'}
            </Button>
          </DialogActions>
        </form>

        {/* 템플릿 선택 모달 */}
        <TemplateSelectionModal
          open={templateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          onSelectTemplate={handleSelectTemplate}
          categories={categories}
        />
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateGoalModal;