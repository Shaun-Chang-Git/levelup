// 🚀 Goals V2 테스트 페이지 - 새로운 데이터베이스 구조 테스트용
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import { Add as AddIcon, CheckCircle as CompleteIcon } from '@mui/icons-material';
import { GoalsService } from '../services/goalsService';
import { Goal } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const GoalsV2Page: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 데이터 로드
  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== LOADING V2 DATA ===');
      
      // 프로필과 목표 동시 로드
      const [profileData, goalsData] = await Promise.all([
        GoalsService.getUserProfile(user.id),
        GoalsService.getUserGoals(user.id)
      ]);
      
      console.log('Profile loaded:', profileData);
      console.log('Goals loaded:', goalsData);
      
      setProfile(profileData);
      setGoals(goalsData);
      
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 테스트 목표 생성
  const createTestGoal = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const testGoal = {
        user_id: user.id,
        category_id: 1, // 학습
        title: `테스트 목표 ${Date.now()}`,
        description: 'V2 데이터베이스 테스트용 목표',
        target_value: 10,
        current_value: 0,
        difficulty: 'medium' as const,
        reward_points: 100
      };
      
      console.log('Creating test goal:', testGoal);
      
      const newGoal = await GoalsService.createGoal(testGoal);
      console.log('Goal created:', newGoal);
      
      setGoals(prev => [newGoal, ...prev]);
      setSuccess('테스트 목표가 생성되었습니다!');
      
    } catch (err) {
      console.error('Goal creation error:', err);
      setError(err instanceof Error ? err.message : '목표 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  // 목표 완료
  const completeGoal = async (goalId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Completing goal:', goalId);
      
      const result = await GoalsService.completeGoal(goalId);
      console.log('Completion result:', result);
      
      setSuccess(`목표 완료! ${result.points_earned} 포인트 획득!`);
      
      // 데이터 다시 로드
      await loadData();
      
    } catch (err) {
      console.error('Goal completion error:', err);
      setError(err instanceof Error ? err.message : '목표 완료 실패');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning">로그인이 필요합니다.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* 헤더 */}
        <Typography variant="h4" component="h1" gutterBottom>
          🚀 Goals V2.0 테스트
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          새로운 데이터베이스 구조 테스트 페이지
        </Typography>

        {/* 프로필 정보 */}
        {profile && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6">사용자 프로필</Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip label={`레벨 ${profile.current_level}`} color="secondary" />
                <Chip label={`${profile.total_points} 포인트`} color="secondary" />
                <Chip label={`이메일: ${profile.email || '없음'}`} color="secondary" />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 에러/성공 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* 액션 버튼 */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createTestGoal}
            disabled={loading}
          >
            테스트 목표 생성
          </Button>
          <Button
            variant="outlined"
            onClick={loadData}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>

        {/* 로딩 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 목표 목록 */}
        <Typography variant="h6" gutterBottom>
          목표 목록 ({goals.length}개)
        </Typography>
        
        <Grid container spacing={2}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} key={goal.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {goal.title}
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    {goal.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={goal.status} 
                      color={goal.status === 'completed' ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={goal.difficulty} 
                      color="secondary"
                      size="small"
                    />
                    <Chip 
                      label={`${goal.reward_points}pt`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    진행률: {goal.current_value}/{goal.target_value || '?'}
                    {goal.target_value && ` (${Math.round((goal.current_value / goal.target_value) * 100)}%)`}
                  </Typography>

                  {goal.status !== 'completed' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CompleteIcon />}
                      onClick={() => completeGoal(goal.id)}
                      disabled={loading}
                      size="small"
                    >
                      완료하기
                    </Button>
                  )}

                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    생성: {new Date(goal.created_at).toLocaleString()}
                    {goal.completed_at && (
                      <> • 완료: {new Date(goal.completed_at).toLocaleString()}</>
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {goals.length === 0 && !loading && (
          <Alert severity="info">
            목표가 없습니다. 테스트 목표를 생성해보세요!
          </Alert>
        )}
      </Box>
    </Container>
  );
};