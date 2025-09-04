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

  // 목표 진행률 업데이트 (Supabase 함수 호출)
  static async updateProgress(goalId: string, progressAmount: number, note?: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating progress:', goalId, progressAmount);
    }
    
    // 새로운 함수 시도
    let { data, error } = await supabase
      .rpc('update_goal_progress_v2', {
        p_goal_id: goalId,
        p_progress_amount: progressAmount,
        p_note: note || null,
      });

    // 폴백
    if (error && error.message.includes('function update_goal_progress_v2')) {
      const fallbackResult = await supabase
        .rpc('update_goal_progress', {
          p_goal_id: goalId,
          p_progress_amount: progressAmount,
          p_note: note || null,
        });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Update progress error:', error);
      throw new Error(`진행률 업데이트 실패: ${error.message}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Progress updated successfully:', data);
    }
    return data;
  }

  // 목표 완료 처리 (JavaScript에서 직접 처리)
  static async completeGoal(goalId: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== GOAL COMPLETION DEBUG ===');
      console.log('Goal ID:', goalId);
      console.log('Goal ID type:', typeof goalId);
      console.log('Processing goal completion directly in JavaScript...');
    }
    
    try {
      // 1. 현재 사용자 확인
      console.log('Step 1: Getting authenticated user...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        throw new Error('Not authenticated');
      }
      console.log('User authenticated:', user.id);

      // 2. 목표 정보 조회 - 단계별 디버깅
      console.log('Step 2: Querying goal data...');
      console.log('Query params - goalId:', goalId, 'userId:', user.id);
      
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('id, user_id, title, status, reward_points')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single();

      console.log('Goal query result:');
      console.log('- Data:', goalData);
      console.log('- Error:', goalError);

      if (goalError) {
        console.error('Goal query failed with error:', goalError);
        throw new Error(`Goal query failed: ${goalError.message}`);
      }
      
      if (!goalData) {
        throw new Error('Goal not found or unauthorized');
      }

      console.log('Goal found:', goalData.title);

      if (goalData.status === 'completed') {
        throw new Error('Goal already completed');
      }

      // 3. 목표 완료 상태 업데이트 (RLS가 user_id를 자동으로 확인하므로 제거)
      console.log('Step 3: Updating goal status...');
      const { error: updateGoalError } = await supabase
        .from('goals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      console.log('Goal update result - Error:', updateGoalError);

      if (updateGoalError) {
        console.error('Goal update failed with error:', updateGoalError);
        throw new Error(`Failed to update goal: ${updateGoalError.message}`);
      }

      console.log('Goal updated successfully');

      // 4. 사용자 프로필 조회
      console.log('Step 4: Querying user profile...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_points, level')
        .eq('id', user.id)
        .single();

      console.log('Profile query result:');
      console.log('- Data:', profileData);
      console.log('- Error:', profileError);

      if (profileError) {
        console.error('Profile query failed with error:', profileError);
        throw new Error(`Failed to get user profile: ${profileError.message}`);
      }

      if (!profileData) {
        throw new Error('User profile not found');
      }

      // 5. 포인트 및 레벨 계산
      console.log('Step 5: Calculating points and level...');
      const newTotalPoints = profileData.total_points + goalData.reward_points;
      const newLevel = Math.floor(newTotalPoints / 1000) + 1;
      const levelUp = newLevel > profileData.level;
      
      console.log('Calculations:');
      console.log('- Current points:', profileData.total_points);
      console.log('- Reward points:', goalData.reward_points);
      console.log('- New total points:', newTotalPoints);
      console.log('- Current level:', profileData.level);
      console.log('- New level:', newLevel);
      console.log('- Level up:', levelUp);

      // 6. 프로필 업데이트
      console.log('Step 6: Updating user profile...');
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      console.log('Profile update result - Error:', updateProfileError);

      if (updateProfileError) {
        throw new Error(`Failed to update profile: ${updateProfileError.message}`);
      }

      const result = {
        success: true,
        goal_title: goalData.title,
        points_earned: goalData.reward_points,
        total_points: newTotalPoints,
        current_level: newLevel,
        level_up: levelUp
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('=== GOAL COMPLETION SUCCESS ===');
        console.log('Result:', result);
      }

      return result;

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