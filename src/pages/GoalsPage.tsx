import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useGoals } from '../hooks/useGoals';
import { Goal } from '../types';
import CreateGoalModal from '../components/goals/CreateGoalModal';
import EditGoalModal from '../components/goals/EditGoalModal';

const GoalsPage: React.FC = () => {
  const {
    goals,
    categories,
    loading,
    error,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    completeGoal,
    clearError,
  } = useGoals();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressDialog, setProgressDialog] = useState<{
    open: boolean;
    goal: Goal | null;
    amount: number;
    note: string;
  }>({
    open: false,
    goal: null,
    amount: 0,
    note: '',
  });

  // 필터링
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    loadGoals(categoryId || undefined, selectedStatus || undefined);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    const status = event.target.value;
    setSelectedStatus(status);
    loadGoals(selectedCategory || undefined, status || undefined);
  };

  // 목표 상태 변경
  const handleStatusUpdate = async (goal: Goal, newStatus: 'active' | 'paused' | 'cancelled') => {
    try {
      await updateGoal(goal.id, { status: newStatus });
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // 목표 삭제
  const handleDelete = async (goalId: string) => {
    if (window.confirm('정말로 이 목표를 삭제하시겠습니까?')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error('삭제 실패:', error);
      }
    }
  };

  // 진행률 업데이트 다이얼로그
  const openProgressDialog = (goal: Goal) => {
    setProgressDialog({
      open: true,
      goal,
      amount: 1,
      note: '',
    });
  };

  const handleProgressSubmit = async () => {
    if (!progressDialog.goal) return;

    try {
      await updateProgress(
        progressDialog.goal.id,
        progressDialog.amount,
        progressDialog.note
      );
      setProgressDialog({ open: false, goal: null, amount: 0, note: '' });
    } catch (error) {
      console.error('진행률 업데이트 실패:', error);
    }
  };

  // 목표 완료
  const handleComplete = async (goal: Goal) => {
    if (window.confirm('이 목표를 완료로 표시하시겠습니까?')) {
      try {
        const result = await completeGoal(goal.id);
        if (result?.points_earned) {
          alert(`축하합니다! ${result.points_earned} 포인트를 획득했습니다!`);
        }
      } catch (error) {
        console.error('완료 처리 실패:', error);
      }
    }
  };

  // 목표 수정 모달 열기
  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditModalOpen(true);
  };

  // 목표 수정 처리
  const handleEditGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      await updateGoal(goalId, updates);
      setEditModalOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('목표 수정 실패:', error);
    }
  };

  // 진행률 계산
  const calculateProgress = (current: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 상태별 한국어 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'paused': return '일시정지';
      case 'cancelled': return '취소됨';
      default: return status;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          내 목표
        </Typography>
      </Box>

      {/* 필터 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={selectedCategory}
            label="카테고리"
            onChange={handleCategoryChange}
          >
            <MenuItem value="">전체</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>상태</InputLabel>
          <Select
            value={selectedStatus}
            label="상태"
            onChange={handleStatusChange}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="active">진행중</MenuItem>
            <MenuItem value="completed">완료</MenuItem>
            <MenuItem value="paused">일시정지</MenuItem>
            <MenuItem value="cancelled">취소됨</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 목표 목록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>로딩 중...</Typography>
        </Box>
      ) : goals.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            아직 목표가 없습니다
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            첫 번째 목표를 만들어보세요!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} lg={4} key={goal.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  {/* 제목과 상태 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                      {goal.title}
                    </Typography>
                    <Chip
                      label={getStatusText(goal.status)}
                      color={getStatusColor(goal.status) as any}
                      size="small"
                    />
                  </Box>

                  {/* 설명 */}
                  {goal.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {goal.description}
                    </Typography>
                  )}

                  {/* 카테고리와 난이도 */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {goal.categories && (
                      <Chip
                        label={goal.categories.name}
                        size="small"
                        sx={{ backgroundColor: goal.categories.color + '20', color: goal.categories.color }}
                      />
                    )}
                    <Chip
                      label={goal.difficulty}
                      size="small"
                      sx={{ backgroundColor: getDifficultyColor(goal.difficulty) + '20', color: getDifficultyColor(goal.difficulty) }}
                    />
                  </Box>

                  {/* 진행률 */}
                  {goal.target_value && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          {goal.current_value || 0}/{goal.target_value} {goal.unit}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {calculateProgress(goal.current_value || 0, goal.target_value)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={calculateProgress(goal.current_value || 0, goal.target_value)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}

                  {/* 연속 달성 */}
                  {goal.streak_count > 0 && (
                    <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                      🔥 {goal.streak_count}일 연속 달성
                    </Typography>
                  )}

                  {/* 보상 포인트 */}
                  <Typography variant="body2" color="text.secondary">
                    💎 완료 시 {goal.reward_points} 포인트
                  </Typography>
                </CardContent>

                {/* 액션 버튼들 */}
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {goal.status === 'active' && (
                      <>
                        <Button
                          size="small"
                          startIcon={<PlayIcon />}
                          onClick={() => openProgressDialog(goal)}
                        >
                          진행
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CompleteIcon />}
                          color="success"
                          onClick={() => handleComplete(goal)}
                        >
                          완료
                        </Button>
                      </>
                    )}

                    {goal.status === 'paused' && (
                      <Button
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => handleStatusUpdate(goal, 'active')}
                      >
                        재시작
                      </Button>
                    )}

                    {goal.status === 'active' && (
                      <Button
                        size="small"
                        startIcon={<PauseIcon />}
                        onClick={() => handleStatusUpdate(goal, 'paused')}
                      >
                        일시정지
                      </Button>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEditModal(goal)}>
                      수정
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDelete(goal.id)}
                    >
                      삭제
                    </Button>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 목표 추가 플로팅 버튼 */}
      <Fab
        color="primary"
        aria-label="add goal"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 목표 생성 모달 */}
      <CreateGoalModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createGoal}
        categories={categories}
      />

      {/* 목표 수정 모달 */}
      <EditGoalModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleEditGoal}
        goal={editingGoal}
        categories={categories}
      />

      {/* 진행률 업데이트 다이얼로그 */}
      <Dialog
        open={progressDialog.open}
        onClose={() => setProgressDialog({ open: false, goal: null, amount: 0, note: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          진행률 업데이트: {progressDialog.goal?.title}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`진행량 (${progressDialog.goal?.unit})`}
            type="number"
            fullWidth
            variant="outlined"
            value={progressDialog.amount}
            onChange={(e) => setProgressDialog(prev => ({ ...prev, amount: Number(e.target.value) }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="메모 (선택사항)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={progressDialog.note}
            onChange={(e) => setProgressDialog(prev => ({ ...prev, note: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialog({ open: false, goal: null, amount: 0, note: '' })}>
            취소
          </Button>
          <Button onClick={handleProgressSubmit} variant="contained">
            업데이트
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GoalsPage;