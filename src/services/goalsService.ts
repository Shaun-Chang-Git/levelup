import { supabase } from './supabase';
import { Goal, Category, GoalProgress } from '../types';

export class GoalsService {
  // 카테고리 조회
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`카테고리 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 사용자의 모든 목표 조회
  static async getUserGoals(userId: string, categoryId?: string, status?: string): Promise<Goal[]> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== getUserGoals SERVICE DEBUG ===');
      console.log('User ID:', userId);
      console.log('Category ID:', categoryId);
      console.log('Status:', status);
    }
    
    try {
      let query = supabase
        .from('goals')
        .select(`
          *,
          categories(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Executing Supabase query...');
      }
      const { data, error } = await query;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Supabase query result:');
        console.log('- Data:', data ? `${data.length} goals` : 'null');
        console.log('- Error:', error);
      }

      if (error) {
        console.error('=== SUPABASE QUERY ERROR ===');
        console.error('Error details:', error);
        throw new Error(`목표 조회 실패: ${error.message}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('getUserGoals completed successfully');
      }
      return data || [];
      
    } catch (err) {
      console.error('=== getUserGoals CATCH ERROR ===');
      console.error('Caught error:', err);
      throw err;
    }
  }

  // 목표 생성
  static async createGoal(goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert([goalData])
      .select(`
        *,
        categories(*)
      `)
      .single();

    if (error) {
      throw new Error(`목표 생성 실패: ${error.message}`);
    }

    return data;
  }

  // 목표 수정
  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select(`
        *,
        categories(*)
      `)
      .single();

    if (error) {
      throw new Error(`목표 수정 실패: ${error.message}`);
    }

    return data;
  }

  // 목표 삭제
  static async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      throw new Error(`목표 삭제 실패: ${error.message}`);
    }
  }

  // 목표 진행률 업데이트 (완전히 재설계된 SQL 함수 사용)
  static async updateProgress(goalId: string, progressAmount: number, note?: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating progress:', goalId, progressAmount);
    }
    
    // 새로운 update_goal_progress_fixed 함수 사용 (user_id 모호성 문제 해결)
    const { data, error } = await supabase
      .rpc('update_goal_progress_fixed', {
        p_goal_id: goalId,
        p_progress_amount: progressAmount,
        p_note: note || null,
      });

    if (error) {
      console.error('Update progress error:', error);
      throw new Error(`진행률 업데이트 실패: ${error.message}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Progress updated successfully:', data);
    }
    return data;
  }

  // 목표 완료 처리 (완전히 재설계된 SQL 함수 사용)
  static async completeGoal(goalId: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== GOAL COMPLETION DEBUG ===');
      console.log('Goal ID:', goalId);
      console.log('Goal ID type:', typeof goalId);
      console.log('Using complete_goal_fixed function with proper table references...');
    }
    
    try {
      // 통합된 complete_goal_unified 함수 사용 (스키마 일관성 문제 해결)
      const { data, error } = await supabase.rpc('complete_goal_unified', {
        p_goal_id: goalId
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('=== COMPLETE_GOAL_FIXED RPC RESULT ===');
        console.log('- Data:', data);
        console.log('- Error:', error);
      }

      if (error) {
        console.error('RPC function failed with error:', error);
        throw new Error(`Goal completion failed: ${error.message}`);
      }

      // SQL 함수에서 success: false를 반환한 경우 에러 처리
      if (data && typeof data === 'object' && data.success === false) {
        console.error('SQL function returned success: false:', data.error);
        throw new Error(`목표 완료 실패: ${data.error}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('=== GOAL COMPLETION SUCCESS ===');
        console.log('Result:', data);
      }

      return data;

    } catch (err) {
      console.error('=== GOAL COMPLETION ERROR ===');
      console.error('Error:', err);
      throw err;
    }
  }

  // 목표의 진행 기록 조회
  static async getGoalProgress(goalId: string): Promise<GoalProgress[]> {
    const { data, error } = await supabase
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .order('progress_date', { ascending: false });

    if (error) {
      throw new Error(`진행 기록 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 사용자 통계 조회
  static async getUserStats(userId: string): Promise<any> {
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`통계 조회 실패: ${error.message}`);
    }

    const totalGoals = goals?.length || 0;
    const completedGoals = goals?.filter(goal => goal.status === 'completed').length || 0;
    const activeGoals = goals?.filter(goal => goal.status === 'active').length || 0;
    const pausedGoals = goals?.filter(goal => goal.status === 'paused').length || 0;

    // 최고 연속 달성 일수 계산
    const maxStreak = Math.max(...(goals?.map(goal => goal.streak_count) || [0]));

    return {
      totalGoals,
      completedGoals,
      activeGoals,
      pausedGoals,
      maxStreak,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    };
  }

  // 최근 진행 중인 목표들 조회 (대시보드용)
  static async getRecentActiveGoals(userId: string, limit: number = 5): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        categories(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`최근 목표 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 목표 진행률 계산
  static calculateProgress(current: number, target: number): number {
    if (!target || target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  // 목표 난이도별 보상 포인트 계산
  static calculateRewardPoints(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): number {
    const pointsMap = {
      easy: 50,
      medium: 100,
      hard: 200,
      expert: 500,
    };
    return pointsMap[difficulty] || 100;
  }
}