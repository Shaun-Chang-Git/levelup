import { supabase } from './supabase';
import { Achievement, UserAchievement } from '../types';

export class AchievementsService {
  // 모든 업적 조회
  static async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('reward_points');

    if (error) {
      throw new Error(`업적 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 사용자가 달성한 업적 조회
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`사용자 업적 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 사용자 업적 진행률 조회 (달성 여부와 함께)
  static async getUserAchievementProgress(userId: string): Promise<any> {
    try {
      // 모든 업적과 사용자가 달성한 업적을 조회
      const [allAchievements, userAchievements] = await Promise.all([
        this.getAllAchievements(),
        this.getUserAchievements(userId)
      ]);

      // 사용자 통계 조회
      const stats = await this.getUserStats(userId);

      // 각 업적별 진행률 계산
      const achievementProgress = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(
          ua => ua.achievement_id === achievement.id
        );

        let progress = 0;
        let currentValue = 0;
        let targetValue = achievement.condition_value || 1;

        // 업적 종류별 진행률 계산
        switch (achievement.condition_type) {
          case 'goal_complete':
            currentValue = stats.completedGoals;
            progress = Math.min((currentValue / targetValue) * 100, 100);
            break;
          case 'streak':
            currentValue = stats.maxStreak;
            progress = Math.min((currentValue / targetValue) * 100, 100);
            break;
          case 'total_points':
            currentValue = stats.totalPoints;
            progress = Math.min((currentValue / targetValue) * 100, 100);
            break;
          case 'category_goals':
            // 카테고리별 업적 처리 (간단화)
            if (achievement.name.includes('학습')) {
              currentValue = stats.categoryStats?.learning || 0;
            } else if (achievement.name.includes('건강')) {
              currentValue = stats.categoryStats?.health || 0;
            } else if (achievement.name.includes('취미')) {
              currentValue = stats.categoryStats?.hobby || 0;
            } else if (achievement.name.includes('커리어')) {
              currentValue = stats.categoryStats?.career || 0;
            }
            progress = Math.min((currentValue / targetValue) * 100, 100);
            break;
          default:
            progress = userAchievement ? 100 : 0;
        }

        return {
          ...achievement,
          isEarned: !!userAchievement,
          earnedAt: userAchievement?.earned_at || null,
          progress: Math.round(progress),
          currentValue,
          targetValue,
        };
      });

      return achievementProgress;
    } catch (err) {
      throw new Error(`업적 진행률 조회 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  }

  // 업적 달성 체크 (Supabase 함수 호출)
  static async checkAndAwardAchievements(userId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('check_and_award_achievements', {
        user_id: userId,
      });

    if (error) {
      throw new Error(`업적 체크 실패: ${error.message}`);
    }

    return data;
  }

  // 사용자 통계 조회 (업적 계산용)
  private static async getUserStats(userId: string): Promise<any> {
    try {
      // 사용자 프로필 조회 (포인트 정보)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(`프로필 조회 실패: ${profileError.message}`);
      }

      // 목표 통계 조회
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select(`
          *,
          categories(name)
        `)
        .eq('user_id', userId);

      if (goalsError) {
        throw new Error(`목표 조회 실패: ${goalsError.message}`);
      }

      const totalGoals = goals?.length || 0;
      const completedGoals = goals?.filter(goal => goal.status === 'completed').length || 0;
      const maxStreak = Math.max(...(goals?.map(goal => goal.streak_count || 0) || [0]));

      // 카테고리별 완료된 목표 수 계산
      const categoryStats = {
        learning: goals?.filter(goal => 
          goal.status === 'completed' && goal.categories?.name === '학습'
        ).length || 0,
        health: goals?.filter(goal => 
          goal.status === 'completed' && goal.categories?.name === '건강'
        ).length || 0,
        hobby: goals?.filter(goal => 
          goal.status === 'completed' && goal.categories?.name === '취미'
        ).length || 0,
        career: goals?.filter(goal => 
          goal.status === 'completed' && goal.categories?.name === '커리어'
        ).length || 0,
      };

      return {
        totalPoints: profile.total_points || 0,
        totalGoals,
        completedGoals,
        maxStreak,
        categoryStats,
      };
    } catch (err) {
      throw new Error(`통계 조회 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  }

  // 업적 아이콘 매핑
  static getAchievementIcon(icon: string): string {
    const iconMap: { [key: string]: string } = {
      'star': '⭐',
      'award': '🏅',
      'trophy': '🏆',
      'crown': '👑',
      'calendar': '📅',
      'flame': '🔥',
      'shield': '🛡️',
      'gem': '💎',
      'diamond': '💠',
      'book-open': '📖',
      'heart': '❤️',
      'palette': '🎨',
      'trending-up': '📈',
    };

    return iconMap[icon] || '🏆';
  }

  // 업적 난이도별 색상
  static getAchievementColor(rewardPoints: number): string {
    if (rewardPoints >= 1000) return '#9C27B0'; // 보라색 - 전설급
    if (rewardPoints >= 500) return '#F44336';  // 빨간색 - 어려움
    if (rewardPoints >= 300) return '#FF9800';  // 주황색 - 보통
    return '#4CAF50'; // 초록색 - 쉬움
  }

  // 업적 등급 텍스트
  static getAchievementGrade(rewardPoints: number): string {
    if (rewardPoints >= 1000) return '전설';
    if (rewardPoints >= 500) return '영웅';
    if (rewardPoints >= 300) return '숙련';
    return '초급';
  }
}