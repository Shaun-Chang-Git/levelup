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

    const { data, error } = await query;

    if (error) {
      throw new Error(`목표 조회 실패: ${error.message}`);
    }

    return data || [];
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

  // 목표 진행률 업데이트 (Supabase 함수 호출)
  static async updateProgress(goalId: string, progressAmount: number, note?: string): Promise<any> {
    console.log('Updating progress:', goalId, progressAmount);
    const { data, error } = await supabase
      .rpc('update_goal_progress', {
        p_goal_id: goalId,
        p_progress_amount: progressAmount,
        p_note: note || null,
      });

    if (error) {
      console.error('Update progress error:', error);
      throw new Error(`진행률 업데이트 실패: ${error.message}`);
    }

    console.log('Progress updated successfully:', data);
    return data;
  }

  // 목표 완료 처리 (Supabase 함수 호출)
  static async completeGoal(goalId: string): Promise<any> {
    console.log('Completing goal:', goalId);
    const { data, error } = await supabase
      .rpc('complete_goal', {
        p_goal_id: goalId,
      });

    if (error) {
      console.error('Complete goal error:', error);
      throw new Error(`목표 완료 처리 실패: ${error.message}`);
    }

    console.log('Goal completed successfully:', data);
    return data;
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