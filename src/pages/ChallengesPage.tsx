import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Alert,
  Fab,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Today as TodayIcon,
  AllInclusive as AllIcon,
  Star as FeaturedIcon,
  Refresh as RefreshIcon,
  AutoAwesome as MagicIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { useChallenges } from '../hooks/useChallenges';
import { useAuth } from '../contexts/AuthContext';
import ChallengeCard from '../components/challenges/ChallengeCard';
import { Challenge, UserChallenge, BadgeEarnedResult } from '../types';

type TabValue = 'today' | 'featured' | 'all' | 'my';

const ChallengesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    challenges,
    userChallenges,
    todaysChallenges,
    featuredChallenges,
    challengeStats,
    loading,
    error,
    joinChallenge,
    abandonChallenge,
    claimChallengeReward,
    autoJoinPeriodicChallenges,
    checkAndAwardBadges,
    clearError,
    loadChallenges,
    loadUserChallenges,
  } = useChallenges();

  const [currentTab, setCurrentTab] = useState<TabValue>('today');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    challengeId: string;
    challengeTitle: string;
    type: 'join' | 'abandon';
  }>({ open: false, challengeId: '', challengeTitle: '', type: 'join' });
  const [badgeNotification, setBadgeNotification] = useState<{
    open: boolean;
    result?: BadgeEarnedResult;
  }>({ open: false });

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  // 도전과제 참여 핸들러
  const handleJoinChallenge = async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    setConfirmDialog({
      open: true,
      challengeId,
      challengeTitle: challenge.title,
      type: 'join'
    });
  };

  // 도전과제 포기 핸들러
  const handleAbandonChallenge = async (challengeId: string) => {
    const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
    if (!userChallenge) return;

    setConfirmDialog({
      open: true,
      challengeId,
      challengeTitle: userChallenge.challenges?.title || '',
      type: 'abandon'
    });
  };

  // 보상 수령 핸들러
  const handleClaimReward = async (challengeId: string) => {
    try {
      await claimChallengeReward(challengeId);
      
      // 배지 획득 체크
      const badgeResult = await checkAndAwardBadges();
      if (badgeResult.badges_earned.length > 0) {
        setBadgeNotification({ open: true, result: badgeResult });
      }
    } catch (error) {
      console.error('보상 수령 실패:', error);
    }
  };

  // 확인 다이얼로그 처리
  const handleConfirmAction = async () => {
    try {
      if (confirmDialog.type === 'join') {
        await joinChallenge(confirmDialog.challengeId);
      } else {
        await abandonChallenge(confirmDialog.challengeId);
      }
      
      setConfirmDialog({ open: false, challengeId: '', challengeTitle: '', type: 'join' });
    } catch (error) {
      console.error('도전과제 액션 실패:', error);
    }
  };

  // 자동 참여 핸들러
  const handleAutoJoin = async () => {
    try {
      const joinedCount = await autoJoinPeriodicChallenges();
      if (joinedCount > 0) {
        // 성공 알림 또는 새로고침 로직
      }
    } catch (error) {
      console.error('자동 참여 실패:', error);
    }
  };

  // 현재 탭에 따른 도전과제 목록
  const getCurrentChallenges = (): (Challenge | UserChallenge)[] => {
    switch (currentTab) {
      case 'today':
        return todaysChallenges;
      case 'featured':
        return featuredChallenges;
      case 'all':
        return challenges;
      case 'my':
        return userChallenges;
      default:
        return [];
    }
  };

  const currentChallenges = getCurrentChallenges();

  // 탭별 아이콘
  const getTabIcon = (tabValue: TabValue) => {
    switch (tabValue) {
      case 'today': return <TodayIcon />;
      case 'featured': return <FeaturedIcon />;
      case 'all': return <AllIcon />;
      case 'my': return <TrophyIcon />;
      default: return null;
    }
  };

  // 통계 카드 데이터
  const getStatsCards = () => {
    if (!challengeStats) return [];

    return [
      {
        title: '참여 중인 도전',
        value: challengeStats.active_challenges,
        icon: <TrophyIcon />,
        color: '#2196F3',
      },
      {
        title: '완료한 도전',
        value: challengeStats.completed_challenges,
        icon: <TodayIcon />,
        color: '#4CAF50',
      },
      {
        title: '획득한 포인트',
        value: challengeStats.total_points_from_challenges.toLocaleString(),
        icon: <MagicIcon />,
        color: '#FF9800',
      },
      {
        title: '완료율',
        value: `${challengeStats.completion_rate.toFixed(1)}%`,
        icon: <FeaturedIcon />,
        color: '#9C27B0',
      },
    ];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          도전과제
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="자동 참여">
            <IconButton color="primary" onClick={handleAutoJoin}>
              <MagicIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="새로고침">
            <IconButton onClick={() => { loadChallenges(); loadUserChallenges(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 통계 카드 */}
      {challengeStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {getStatsCards().map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: stat.color }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" component="div" color={stat.color}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            icon={getTabIcon('today')} 
            label="오늘의 도전" 
            value="today" 
            iconPosition="start"
          />
          <Tab 
            icon={getTabIcon('featured')} 
            label="추천 도전" 
            value="featured" 
            iconPosition="start"
          />
          <Tab 
            icon={getTabIcon('all')} 
            label="모든 도전" 
            value="all" 
            iconPosition="start"
          />
          <Tab 
            icon={getTabIcon('my')} 
            label="내 도전과제" 
            value="my" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 도전과제 목록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>로딩 중...</Typography>
        </Box>
      ) : currentChallenges.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {currentTab === 'today' ? '오늘 수행할 도전과제가 없습니다' : 
             currentTab === 'my' ? '참여한 도전과제가 없습니다' :
             '도전과제가 없습니다'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            새로운 도전과제에 참여해보세요!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {currentChallenges.map((item) => {
            // Challenge 또는 UserChallenge인지 구분
            const isUserChallenge = 'user_id' in item;
            const challenge = isUserChallenge ? (item as UserChallenge).challenges! : (item as Challenge);
            const userChallenge = isUserChallenge ? (item as UserChallenge) : 
              userChallenges.find(uc => uc.challenge_id === (item as Challenge).id);

            return (
              <Grid item xs={12} md={6} lg={4} key={challenge.id}>
                <ChallengeCard
                  challenge={challenge}
                  userChallenge={userChallenge}
                  onJoin={handleJoinChallenge}
                  onAbandon={handleAbandonChallenge}
                  onClaimReward={handleClaimReward}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogTitle>
          {confirmDialog.type === 'join' ? '도전과제 참여' : '도전과제 포기'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'join' 
              ? `"${confirmDialog.challengeTitle}" 도전과제에 참여하시겠습니까?`
              : `"${confirmDialog.challengeTitle}" 도전과제를 포기하시겠습니까?`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            취소
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color={confirmDialog.type === 'join' ? 'primary' : 'error'}
            variant="contained"
          >
            {confirmDialog.type === 'join' ? '참여' : '포기'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 배지 획득 알림 */}
      <Snackbar
        open={badgeNotification.open}
        autoHideDuration={5000}
        onClose={() => setBadgeNotification({ open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setBadgeNotification({ open: false })}
          sx={{ minWidth: '300px' }}
        >
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              🎉 새 배지 획득!
            </Typography>
            {badgeNotification.result?.badges_earned.map((badge, index) => (
              <Chip
                key={badge.id}
                label={badge.name}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {badgeNotification.result && badgeNotification.result.total_bonus_points > 0 && (
              <Typography variant="body2">
                보너스: +{badgeNotification.result.total_bonus_points} 포인트
              </Typography>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChallengesPage;