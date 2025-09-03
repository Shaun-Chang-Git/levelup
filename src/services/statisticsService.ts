import { supabase } from './supabase';

export class StatisticsService {
  // 사용자 대시보드 통계 조회
  static async getDashboardStats(userId: string): Promise<any> {
    try {
      console.log('=== StatisticsService.getDashboardStats START ===');
      console.log('User ID:', userId);
      
      // 병렬로 데이터 조회
      console.log('Starting parallel data fetch...');
      const [profileResult, goalsResult, achievementsResult] = await Promise.all([
        // 프로필 정보
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),

        // 목표 정보
        supabase
          .from('goals')
          .select(`
            *,
            categories(name, color)
          `)
          .eq('user_id', userId),

        // 달성한 업적 정보
        supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
      ]);

      console.log('Parallel fetch completed');
      console.log('Profile result:', profileResult.error ? 'ERROR' : 'SUCCESS');
      console.log('Goals result:', goalsResult.error ? 'ERROR' : 'SUCCESS');
      console.log('Achievements result:', achievementsResult.error ? 'ERROR' : 'SUCCESS');

      if (profileResult.error) {
        console.error('Profile error:', profileResult.error);
        throw new Error(`프로필 조회 실패: ${profileResult.error.message}`);
      }

      if (goalsResult.error) {
        console.error('Goals error:', goalsResult.error);
        throw new Error(`목표 조회 실패: ${goalsResult.error.message}`);
      }

      const profile = profileResult.data;
      const goals = goalsResult.data || [];
      const userAchievements = achievementsResult.data || [];

      // 기본 통계 계산
      const totalGoals = goals.length;
      const completedGoals = goals.filter(goal => goal.status === 'completed').length;
      const activeGoals = goals.filter(goal => goal.status === 'active').length;
      const pausedGoals = goals.filter(goal => goal.status === 'paused').length;

      // 최대 연속 달성 일수
      const currentStreak = Math.max(...goals.map(goal => goal.streak_count || 0), 0);

      // 레벨 진행률 계산
      const currentLevel = profile.level;
      const totalPoints = profile.total_points;
      const currentLevelXp = (currentLevel - 1) * 1000;
      const nextLevelXp = currentLevel * 1000;
      const experiencePoints = Math.max(0, totalPoints - currentLevelXp);
      const levelProgress = Math.min((experiencePoints / 1000) * 100, 100);

      // 최근 활성 목표들 (진행률과 함께)
      const recentActiveGoals = goals
        .filter(goal => goal.status === 'active')
        .map(goal => ({
          ...goal,
          progress: goal.target_value > 0 
            ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
            : 0
        }))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

      // 최근 완료된 목표들
      const recentCompletedGoals = goals
        .filter(goal => goal.status === 'completed')
        .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime())
        .slice(0, 3);

      // 카테고리별 통계
      const categoryStats = goals.reduce((acc: any, goal) => {
        const categoryName = goal.categories?.name || '기타';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            color: goal.categories?.color || '#2196F3',
            total: 0,
            completed: 0,
            active: 0,
          };
        }
        
        acc[categoryName].total++;
        if (goal.status === 'completed') acc[categoryName].completed++;
        if (goal.status === 'active') acc[categoryName].active++;
        
        return acc;
      }, {});

      // 완료율 계산
      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      // 이번 주 활동 계산 (목표 진행 기록 기반)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyActivityResult = await supabase
        .from('goal_progress')
        .select('progress_date, progress_value')
        .eq('user_id', userId)
        .gte('progress_date', weekAgo.toISOString().split('T')[0])
        .order('progress_date', { ascending: true });

      const weeklyActivity = weeklyActivityResult.data || [];

      console.log('=== StatisticsService.getDashboardStats SUCCESS ===');
      console.log('Returning dashboard stats...');
      
      return {
        // 기본 통계
        totalGoals,
        completedGoals,
        activeGoals,
        pausedGoals,
        currentStreak,
        completionRate,

        // 프로필 정보
        profile: {
          ...profile,
          levelProgress,
          experiencePoints,
          nextLevelXp: 1000, // 항상 1000포인트마다 레벨업
        },

        // 목표 데이터
        recentActiveGoals,
        recentCompletedGoals,

        // 카테고리 통계
        categoryStats: Object.values(categoryStats),

        // 업적 정보
        totalAchievements: userAchievements.length,

        // 주간 활동
        weeklyActivity,
      };
    } catch (error) {
      throw new Error(`대시보드 통계 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 월간 목표 달성 통계
  static async getMonthlyStats(userId: string): Promise<any> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth.toISOString());

      if (error) {
        throw new Error(`월간 통계 조회 실패: ${error.message}`);
      }

      const monthlyCompletedGoals = data?.length || 0;
      const monthlyPoints = data?.reduce((sum, goal) => sum + (goal.reward_points || 0), 0) || 0;

      return {
        monthlyCompletedGoals,
        monthlyPoints,
      };
    } catch (error) {
      throw new Error(`월간 통계 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 주간 진행률 데이터 (차트용)
  static async getWeeklyProgressData(userId: string): Promise<any[]> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('goal_progress')
        .select('progress_date, progress_value')
        .eq('user_id', userId)
        .gte('progress_date', weekAgo.toISOString().split('T')[0])
        .order('progress_date', { ascending: true });

      if (error) {
        throw new Error(`주간 진행률 조회 실패: ${error.message}`);
      }

      // 날짜별로 그룹화하여 합계 계산
      const groupedData = (data || []).reduce((acc: any, item) => {
        const date = item.progress_date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += item.progress_value || 0;
        return acc;
      }, {});

      // 지난 7일간의 데이터 배열로 변환
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        result.push({
          date: dateStr,
          day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
          value: groupedData[dateStr] || 0,
        });
      }

      return result;
    } catch (error) {
      throw new Error(`주간 진행률 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 카테고리별 완료율 데이터 (차트용)
  static async getCategoryCompletionData(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select(`
          status,
          categories(name, color)
        `)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`카테고리 통계 조회 실패: ${error.message}`);
      }

      // 카테고리별 통계 계산
      const categoryStats = (data || []).reduce((acc: any, goal) => {
        const categoryName = goal.categories?.name || '기타';
        const categoryColor = goal.categories?.color || '#2196F3';
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            color: categoryColor,
            total: 0,
            completed: 0,
          };
        }
        
        acc[categoryName].total++;
        if (goal.status === 'completed') {
          acc[categoryName].completed++;
        }
        
        return acc;
      }, {});

      // 완료율과 함께 배열로 변환
      return Object.values(categoryStats).map((category: any) => ({
        ...category,
        completionRate: category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0,
      }));
    } catch (error) {
      throw new Error(`카테고리 통계 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
}