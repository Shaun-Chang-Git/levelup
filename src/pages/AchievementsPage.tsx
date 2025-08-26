import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Alert,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFire as FireIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementsService } from '../services/achievementsService';

const AchievementsPage: React.FC = () => {
  const {
    achievements,
    loading,
    error,
    getAchievementStats,
    getAchievementsByCategory,
    getRecentAchievements,
    getAlmostAchievableAchievements,
    clearError,
  } = useAchievements();

  const [selectedTab, setSelectedTab] = useState(0);

  const stats = getAchievementStats();
  const categorizedAchievements = getAchievementsByCategory();
  const recentAchievements = getRecentAchievements();
  const almostAchievable = getAlmostAchievableAchievements();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // 업적 카드 렌더링
  const renderAchievementCard = (achievement: any) => (
    <Grid item xs={12} sm={6} md={4} key={achievement.id}>
      <Card 
        sx={{ 
          height: '100%',
          opacity: achievement.isEarned ? 1 : 0.7,
          border: achievement.isEarned ? '2px solid' : '1px solid',
          borderColor: achievement.isEarned 
            ? AchievementsService.getAchievementColor(achievement.reward_points)
            : 'grey.300',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* 달성 표시 */}
        {achievement.isEarned && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: AchievementsService.getAchievementColor(achievement.reward_points),
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <StarIcon sx={{ color: 'white', fontSize: 16 }} />
          </Box>
        )}

        <CardContent>
          {/* 아이콘과 제목 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ mr: 2 }}>
              {AchievementsService.getAchievementIcon(achievement.icon)}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="h3">
                {achievement.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip
                  label={AchievementsService.getAchievementGrade(achievement.reward_points)}
                  size="small"
                  sx={{
                    backgroundColor: AchievementsService.getAchievementColor(achievement.reward_points) + '20',
                    color: AchievementsService.getAchievementColor(achievement.reward_points),
                  }}
                />
                <Typography variant="body2" color="primary">
                  💎 {achievement.reward_points} 포인트
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 설명 */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {achievement.description}
          </Typography>

          {/* 진행률 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">
                {achievement.currentValue}/{achievement.targetValue}
              </Typography>
              <Typography variant="body2" color="primary">
                {achievement.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={achievement.progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: AchievementsService.getAchievementColor(achievement.reward_points),
                },
              }}
            />
          </Box>

          {/* 달성 날짜 */}
          {achievement.isEarned && achievement.earnedAt && (
            <Typography variant="body2" color="text.secondary">
              달성일: {new Date(achievement.earnedAt).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>업적 데이터를 불러오는 중...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          업적
        </Typography>
        <Typography variant="body1" color="text.secondary">
          목표를 달성하고 업적을 잠금 해제하세요!
        </Typography>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main">
              {stats.earned}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              달성한 업적
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              전체 업적
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.percentage}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              달성률
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {stats.totalPoints}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              업적 포인트
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 최근 달성 업적 & 거의 달성 가능한 업적 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 최근 달성한 업적 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              최근 달성한 업적
            </Typography>
            {recentAchievements.length > 0 ? (
              <Box>
                {recentAchievements.map((userAchievement) => (
                  <Box key={userAchievement.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {AchievementsService.getAchievementIcon(userAchievement.achievements?.icon || 'star')}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">
                          {userAchievement.achievements?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(userAchievement.earned_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={`+${userAchievement.achievements?.reward_points} 포인트`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                    {userAchievement !== recentAchievements[recentAchievements.length - 1] && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                아직 달성한 업적이 없습니다.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* 거의 달성 가능한 업적 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              거의 달성 가능한 업적
            </Typography>
            {almostAchievable.length > 0 ? (
              <Box>
                {almostAchievable.map((achievement) => (
                  <Box key={achievement.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        {AchievementsService.getAchievementIcon(achievement.icon)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">
                          {achievement.name}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={achievement.progress}
                          sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="body2" color="primary">
                        {achievement.progress}%
                      </Typography>
                    </Box>
                    {achievement !== almostAchievable[almostAchievable.length - 1] && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                곧 달성 가능한 업적이 없습니다.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 업적 탭 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TrophyIcon />} label="전체" />
          <Tab icon={<StarIcon />} label="진행" />
          <Tab icon={<FireIcon />} label="연속 달성" />
          <Tab icon={<CategoryIcon />} label="카테고리" />
        </Tabs>
      </Paper>

      {/* 업적 목록 */}
      <Box>
        {selectedTab === 0 && (
          <Grid container spacing={3}>
            {achievements.map(renderAchievementCard)}
          </Grid>
        )}

        {selectedTab === 1 && (
          <Grid container spacing={3}>
            {categorizedAchievements.progress.map(renderAchievementCard)}
          </Grid>
        )}

        {selectedTab === 2 && (
          <Grid container spacing={3}>
            {categorizedAchievements.streak.map(renderAchievementCard)}
          </Grid>
        )}

        {selectedTab === 3 && (
          <Grid container spacing={3}>
            {categorizedAchievements.category.map(renderAchievementCard)}
          </Grid>
        )}
      </Box>

      {/* 빈 상태 */}
      {achievements.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            업적 데이터가 없습니다
          </Typography>
          <Typography color="text.secondary">
            목표를 만들고 달성해보세요!
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default AchievementsPage;