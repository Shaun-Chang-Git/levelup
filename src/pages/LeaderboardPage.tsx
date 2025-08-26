import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents as TotalPointsIcon,
  TrendingUp as LevelIcon,
  Star as GoalIcon,
  LocalFireDepartment as StreakIcon,
  Refresh as RefreshIcon,
  Timer as WeeklyIcon,
  CalendarMonth as MonthlyIcon,
} from '@mui/icons-material';
import { useChallenges } from '../hooks/useChallenges';
import { useAuth } from '../contexts/AuthContext';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import { Leaderboard, LeaderboardEntry } from '../types';

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    leaderboards,
    loading,
    error,
    getLeaderboardEntries,
    getUserLeaderboardRank,
    clearError
  } = useChallenges();

  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // 리더보드 선택 핸들러
  const handleLeaderboardChange = async (leaderboardId: string) => {
    if (leaderboardId === selectedLeaderboard) return;
    
    setSelectedLeaderboard(leaderboardId);
    setLoadingEntries(true);

    try {
      // 리더보드 엔트리 로드
      const leaderboardEntries = await getLeaderboardEntries(leaderboardId, 100);
      setEntries(leaderboardEntries);

      // 현재 사용자 순위 조회
      if (user) {
        const rank = await getUserLeaderboardRank(leaderboardId);
        setUserRank(rank);
      }
    } catch (error) {
      console.error('리더보드 로딩 실패:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  // 리더보드 새로고침
  const handleRefresh = () => {
    if (selectedLeaderboard) {
      handleLeaderboardChange(selectedLeaderboard);
    }
  };

  // 첫 번째 리더보드 자동 선택
  useEffect(() => {
    if (leaderboards.length > 0 && !selectedLeaderboard) {
      handleLeaderboardChange(leaderboards[0].id);
    }
  }, [leaderboards, selectedLeaderboard]);

  // 현재 선택된 리더보드 정보
  const currentLeaderboard = leaderboards.find(lb => lb.id === selectedLeaderboard);

  // 리더보드 아이콘
  const getLeaderboardIcon = (type: Leaderboard['type']) => {
    switch (type) {
      case 'total_points': return <TotalPointsIcon />;
      case 'level_ranking': return <LevelIcon />;
      case 'goal_completions': return <GoalIcon />;
      case 'streak_days': return <StreakIcon />;
      case 'weekly_points': return <WeeklyIcon />;
      case 'monthly_points': return <MonthlyIcon />;
      default: return <TotalPointsIcon />;
    }
  };

  // 리더보드 설명
  const getLeaderboardDescription = (leaderboard: Leaderboard) => {
    switch (leaderboard.type) {
      case 'total_points': 
        return '모든 활동으로 획득한 총 포인트를 기준으로 한 순위입니다.';
      case 'level_ranking': 
        return '현재 레벨과 총 포인트를 기준으로 한 순위입니다.';
      case 'goal_completions': 
        return '완료한 목표의 개수를 기준으로 한 순위입니다.';
      case 'streak_days': 
        return '최고 연속 달성 일수를 기준으로 한 순위입니다.';
      case 'weekly_points': 
        return '이번 주 획득한 포인트를 기준으로 한 순위입니다.';
      case 'monthly_points': 
        return '이번 달 획득한 포인트를 기준으로 한 순위입니다.';
      default: 
        return leaderboard.description || '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          리더보드
        </Typography>
        
        <Tooltip title="새로고침">
          <IconButton onClick={handleRefresh} disabled={loadingEntries}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 내 순위 카드 (사용자가 순위에 있는 경우) */}
      {userRank && currentLeaderboard && (
        <Card sx={{ mb: 3, border: 2, borderColor: 'primary.main' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              내 순위
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{ 
                  width: 50, 
                  height: 50,
                  bgcolor: 'primary.main',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                #{userRank.rank_position}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">
                  {userRank.user_profiles?.display_name || '나'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  레벨 {userRank.user_profiles?.level}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {currentLeaderboard.type === 'total_points' || currentLeaderboard.type.includes('points') 
                    ? userRank.score.toLocaleString() + ' 포인트'
                    : currentLeaderboard.type === 'level_ranking'
                    ? '레벨 ' + userRank.score
                    : userRank.score.toString()
                  }
                </Typography>
                {userRank.rank_change !== 0 && (
                  <Chip
                    label={userRank.rank_change > 0 ? `+${userRank.rank_change}` : userRank.rank_change}
                    size="small"
                    color={userRank.rank_change > 0 ? "success" : "error"}
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 리더보드 탭 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedLeaderboard}
          onChange={(_, value) => handleLeaderboardChange(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {leaderboards.map((leaderboard) => (
            <Tab
              key={leaderboard.id}
              value={leaderboard.id}
              icon={getLeaderboardIcon(leaderboard.type)}
              label={leaderboard.name}
              iconPosition="start"
              sx={{ minWidth: 140 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* 리더보드 설명 */}
      {currentLeaderboard && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar
                sx={{ 
                  bgcolor: currentLeaderboard.color,
                  fontSize: '1.2rem'
                }}
              >
                {currentLeaderboard.icon_emoji}
              </Avatar>
              <Typography variant="h6">
                {currentLeaderboard.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {getLeaderboardDescription(currentLeaderboard)}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 리더보드 테이블 */}
      {loading && leaderboards.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : currentLeaderboard ? (
        loadingEntries ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <LeaderboardTable
            leaderboard={currentLeaderboard}
            entries={entries}
            currentUserId={user?.id}
            loading={loadingEntries}
          />
        )
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            사용 가능한 리더보드가 없습니다
          </Typography>
          <Typography color="text.secondary">
            관리자에게 문의해주세요.
          </Typography>
        </Box>
      )}

      {/* 추가 정보 */}
      {entries.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            총 {entries.length}명의 사용자가 순위에 등록되어 있습니다.
          </Typography>
          {currentLeaderboard && (
            <Typography variant="caption" color="text.secondary" display="block">
              마지막 업데이트: {new Date(currentLeaderboard.updated_at).toLocaleString('ko-KR')}
            </Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

export default LeaderboardPage;