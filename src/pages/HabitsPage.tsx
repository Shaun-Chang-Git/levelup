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
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon,
  DateRange as AllIcon,
  LocalFire as FireIcon,
} from '@mui/icons-material';
import { useHabits } from '../hooks/useHabits';
import { useGoals } from '../hooks/useGoals';
import { Goal } from '../types';
import HabitCard from '../components/habits/HabitCard';
import CreateHabitModal from '../components/habits/CreateHabitModal';

type TabValue = 'today' | 'all' | 'stats';

const HabitsPage: React.FC = () => {
  const { 
    habits, 
    todaysHabits, 
    habitStats, 
    loading, 
    error, 
    createHabit, 
    completeHabit, 
    undoHabitCompletion,
    getHabitCompletionRate,
    isHabitCompleted,
    clearError 
  } = useHabits();
  
  const { categories } = useGoals();
  
  const [currentTab, setCurrentTab] = useState<TabValue>('today');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completionStates, setCompletionStates] = useState<Record<string, boolean>>({});
  const [completionRates, setCompletionRates] = useState<Record<string, number>>({});

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  // 오늘의 완료 상태 로드
  useEffect(() => {
    const loadCompletionStates = async () => {
      const states: Record<string, boolean> = {};
      const rates: Record<string, number> = {};
      
      for (const habit of todaysHabits) {
        try {
          const today = new Date().toISOString().split('T')[0];
          states[habit.id] = await isHabitCompleted(habit.id, today);
          rates[habit.id] = await getHabitCompletionRate(habit.id, 30);
        } catch (error) {
          console.error(`습관 ${habit.id} 상태 로드 실패:`, error);
          states[habit.id] = false;
          rates[habit.id] = 0;
        }
      }
      
      setCompletionStates(states);
      setCompletionRates(rates);
    };

    if (todaysHabits.length > 0) {
      loadCompletionStates();
    }
  }, [todaysHabits, isHabitCompleted, getHabitCompletionRate]);

  // 습관 완료 핸들러
  const handleCompleteHabit = async (habitId: string, notes?: string, value?: number) => {
    const result = await completeHabit(habitId, undefined, notes, value);
    
    // 상태 업데이트
    setCompletionStates(prev => ({ ...prev, [habitId]: true }));
    
    return result;
  };

  // 습관 완료 취소 핸들러
  const handleUndoCompletion = async (habitId: string) => {
    await undoHabitCompletion(habitId);
    
    // 상태 업데이트
    setCompletionStates(prev => ({ ...prev, [habitId]: false }));
  };

  // 현재 탭에 따른 습관 목록
  const getCurrentHabits = (): Goal[] => {
    switch (currentTab) {
      case 'today':
        return todaysHabits;
      case 'all':
        return habits.filter(h => h.status === 'active');
      default:
        return [];
    }
  };

  const currentHabits = getCurrentHabits();

  // 통계 카드 데이터
  const getStatsCards = () => {
    if (!habitStats) return [];

    return [
      {
        title: '전체 습관',
        value: habitStats.total_habits,
        icon: <AllIcon />,
        color: '#2196F3',
      },
      {
        title: '활성 습관',
        value: habitStats.active_habits,
        icon: <TrendingUpIcon />,
        color: '#4CAF50',
      },
      {
        title: '오늘 완료',
        value: habitStats.completed_today,
        icon: <TodayIcon />,
        color: '#FF9800',
      },
      {
        title: '최고 연속',
        value: `${habitStats.longest_streak}일`,
        icon: <FireIcon />,
        color: '#F44336',
      },
    ];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          습관 추적
        </Typography>
      </Box>

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            icon={<TodayIcon />} 
            label="오늘의 습관" 
            value="today" 
            iconPosition="start"
          />
          <Tab 
            icon={<AllIcon />} 
            label="모든 습관" 
            value="all" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            label="통계" 
            value="stats" 
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

      {/* 통계 탭 */}
      {currentTab === 'stats' && (
        <Box>
          {/* 통계 카드들 */}
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

          {/* 추가 통계 정보 */}
          {habitStats && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  상세 통계
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  <Chip 
                    label={`총 완료 횟수: ${habitStats.total_completions}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`오늘 달성률: ${habitStats.active_habits > 0 ? Math.round((habitStats.completed_today / habitStats.active_habits) * 100) : 0}%`}
                    color="success" 
                    variant="outlined" 
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* 습관 목록 탭들 */}
      {currentTab !== 'stats' && (
        <>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>로딩 중...</Typography>
            </Box>
          ) : currentHabits.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {currentTab === 'today' ? '오늘 수행할 습관이 없습니다' : '등록된 습관이 없습니다'}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                새로운 습관을 만들어 건강한 생활을 시작해보세요!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {currentHabits.map((habit) => (
                <Grid item xs={12} md={6} lg={4} key={habit.id}>
                  <HabitCard
                    habit={habit}
                    isCompletedToday={currentTab === 'today' ? completionStates[habit.id] || false : false}
                    onComplete={handleCompleteHabit}
                    onUndo={handleUndoCompletion}
                    completionRate={completionRates[habit.id] || 0}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* 오늘의 습관 요약 */}
          {currentTab === 'today' && todaysHabits.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  오늘의 진행 상황
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" color="primary">
                    {Object.values(completionStates).filter(Boolean).length}/{todaysHabits.length}
                  </Typography>
                  <Typography variant="body1">
                    습관 완료
                  </Typography>
                  <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                    {Object.values(completionStates).filter(Boolean).length === todaysHabits.length && (
                      <Chip 
                        label="🎉 오늘의 습관 모두 완료!" 
                        color="success" 
                        variant="filled"
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 습관 추가 플로팅 버튼 */}
      <Fab
        color="primary"
        aria-label="add habit"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 습관 생성 모달 */}
      <CreateHabitModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createHabit}
        categories={categories}
      />
    </Container>
  );
};

export default HabitsPage;