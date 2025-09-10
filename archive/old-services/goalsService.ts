import { supabase } from './supabase';
import { Goal, Category, GoalProgress } from '../types';

export class GoalsService {
  // 카테고리 조회
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('goal_categories')
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
        .from('user_goals')
        .select(`
          *,
          goal_categories(*)
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
      .from('user_goals')
      .insert([goalData])
      .select(`
        *,
        goal_categories(*)
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
      .from('user_goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select(`
        *,
        goal_categories(*)
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
      .from('user_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      throw new Error(`목표 삭제 실패: ${error.message}`);
    }
  }

  // 목표 진행률 업데이트 (v2.0 클라이언트 사이드 로직)
  static async updateProgress(goalId: string, progressAmount: number, note?: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating progress:', goalId, progressAmount);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('사용자 인증이 필요합니다.');
    }
    
    // 1. 목표 정보 조회
    const { data: goal, error: goalError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();
    
    if (goalError) {
      throw new Error(`목표 조회 실패: ${goalError.message}`);
    }
    
    if (!goal) {
      throw new Error('목표를 찾을 수 없습니다.');
    }
    
    // 2. 새로운 진행량 계산
    const newCurrent = Math.min(goal.current_value + progressAmount, goal.target_value);
    const newProgress = Math.round((newCurrent / goal.target_value) * 100);
    
    // 3. 진행 로그 기록
    const { error: logError } = await supabase
      .from('goal_progress_logs')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        progress_amount: progressAmount,
        previous_value: goal.current_value,
        new_value: newCurrent,
        note: note || null
      });
    
    if (logError) {
      throw new Error(`진행 로그 기록 실패: ${logError.message}`);
    }
    
    // 4. 목표 업데이트
    const { data: updatedGoal, error: updateError } = await supabase
      .from('user_goals')
      .update({
        current_value: newCurrent,
        progress_percentage: newProgress,
        last_progress_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`목표 업데이트 실패: ${updateError.message}`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Progress updated successfully:', updatedGoal);
    }
    
    return updatedGoal;
  }

  // 목표 완료 (v2.0 클라이언트 사이드 로직)
  static async completeGoal(goalId: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== V2.0 GOAL COMPLETION START ===');
      console.log('Goal ID:', goalId);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      // 1. 목표 정보 조회
      const { data: goal, error: goalError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();
      
      if (goalError) {
        throw new Error(`목표 조회 실패: ${goalError.message}`);
      }
      
      if (!goal) {
        throw new Error('목표를 찾을 수 없습니다.');
      }
      
      if (goal.status === 'completed') {
        throw new Error('이미 완료된 목표입니다.');
      }

      // 2. 목표를 완료 상태로 업데이트
      const { data: updatedGoal, error: updateError } = await supabase
        .from('user_goals')
        .update({
          status: 'completed',
          current_value: goal.target_value,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`목표 완료 업데이트 실패: ${updateError.message}`);
      }

      // 3. 완료 로그 기록
      const { error: logError } = await supabase
        .from('goal_progress_logs')
        .insert({
          goal_id: goalId,
          user_id: user.id,
          progress_amount: goal.target_value - goal.current_value,
          previous_value: goal.current_value,
          new_value: goal.target_value,
          note: '목표 완료'
        });
      
      if (logError) {
        console.warn('완료 로그 기록 실패:', logError);
        // 로그 실패는 치명적이지 않으므로 계속 진행
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('=== V2.0 GOAL COMPLETION SUCCESS ===');
        console.log('Updated goal:', updatedGoal);
      }

      return updatedGoal;

    } catch (err) {
      console.error('=== V2.0 GOAL COMPLETION ERROR ===');
      console.error('Error:', err);
      throw err;
    }
  }

  // 목표의 진행 기록 조회
  static async getGoalProgress(goalId: string): Promise<GoalProgress[]> {
    const { data, error } = await supabase
      .from('goal_progress_logs')
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
      .from('user_goals')
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
      .from('user_goals')
      .select(`
        *,
        goal_categories(*)
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