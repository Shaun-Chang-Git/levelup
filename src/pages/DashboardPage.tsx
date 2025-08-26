import React from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  LinearProgress,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStatistics } from '../hooks/useStatistics';
import WeeklyProgressChart from '../components/charts/WeeklyProgressChart';
import CategoryChart from '../components/charts/CategoryChart';

const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { 
    dashboardStats, 
    loading, 
    error, 
    refreshAllStats, 
    clearError 
  } = useStatistics();

  // 로딩 중일 때
  if (loading || !dashboardStats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 사용자 정보 및 레벨 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main', fontSize: 32 }}>
            {dashboardStats.profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              안녕하세요, {dashboardStats.profile?.display_name || '사용자'}님! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              레벨 {dashboardStats.profile.level} • {dashboardStats.profile.total_points} 포인트 • {dashboardStats.currentStreak}일 연속 달성
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                레벨 {dashboardStats.profile.level + 1}까지
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={dashboardStats.profile.levelProgress} 
                sx={{ flex: 1, mr: 2, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2">
                {dashboardStats.profile.experiencePoints}/{dashboardStats.profile.nextLevelXp} XP
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* 통계 카드들 */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">
                {dashboardStats.totalGoals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 목표
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {dashboardStats.completedGoals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                완료된 목표
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main">
                {dashboardStats.activeGoals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                진행 중 목표
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="error.main">
                {dashboardStats.currentStreak}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                연속 달성 일수
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 목표 진행 상황 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                최근 목표 진행 상황
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/goals')}
              >
                전체 보기
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              {dashboardStats.recentActiveGoals.length > 0 ? (
                dashboardStats.recentActiveGoals.map((goal: any) => (
                  <Box key={goal.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1">{goal.title}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {goal.categories && (
                          <Chip 
                            label={goal.categories.name} 
                            size="small" 
                            sx={{ 
                              backgroundColor: goal.categories.color + '20',
                              color: goal.categories.color 
                            }}
                          />
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {goal.progress}%
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={goal.progress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    {goal.target_value && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {goal.current_value}/{goal.target_value} {goal.unit}
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  진행 중인 목표가 없습니다. 새로운 목표를 만들어보세요!
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* 최근 업적 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                업적
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/achievements')}
              >
                전체 보기
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" color="warning.main" sx={{ mr: 2 }}>
                  {dashboardStats.totalAchievements}
                </Typography>
                <Box>
                  <Typography variant="body1">
                    달성한 업적
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    완료율: {dashboardStats.completionRate}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                더 많은 업적을 달성하기 위해 목표를 완료해보세요!
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 주간 진행률 차트 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              주간 목표 진행률
            </Typography>
            <WeeklyProgressChart data={dashboardStats.weeklyActivity} height={250} showArea />
          </Paper>
        </Grid>

        {/* 카테고리별 완료율 차트 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              카테고리별 완료율
            </Typography>
            <CategoryChart data={dashboardStats.categoryStats} height={250} chartType="pie" />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;