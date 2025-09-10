// 🔄 통합 Goals Service - v2.0 스키마 완전 호환
// 기존 GoalsService와 GoalsServiceV2를 통합한 최종 버전

import { supabase } from './supabase';
import { Goal, Category } from '../types';

export class GoalsService {
  // 카테고리 조회 (v2.0 스키마)
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('goal_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`카테고리 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 사용자의 모든 목표 조회 (v2.0 스키마)
  static async getUserGoals(userId: string, categoryId?: number, status?: string): Promise<Goal[]> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== UNIFIED GOALS SERVICE: GET USER GOALS ===');
      console.log('User ID:', userId);
      console.log('Category ID:', categoryId);
      console.log('Status:', status);
    }
    
    try {
      let query = supabase
        .from('user_goals')
        .select('*')
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
        console.error('Goal loading error:', error);
        throw error;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`Goals loaded successfully: ${data?.length || 0} goals`);
      }

      return data || [];
      
    } catch (error) {
      console.error('getUserGoals error:', error);
      throw error;
    }
  }

  // 목표 생성 (v2.0 스키마)
  static async createGoal(goalData: Partial<Goal>): Promise<Goal> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== UNIFIED GOALS SERVICE: CREATE GOAL ===');
      console.log('Goal data:', goalData);
    }

    const { data, error } = await supabase
      .from('user_goals')
      .insert([goalData])
      .select()
      .single();

    if (error) {
      console.error('Goal creation error:', error);
      throw error;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Goal created successfully:', data);
    }
    return data;
  }

  // 목표 수정 (v2.0 스키마)
  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('사용자 인증이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // 목표 완료 (v2.0 간소화 버전)
  static async completeGoal(goalId: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== UNIFIED GOALS SERVICE: COMPLETE GOAL ===');
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

      if (goalError) throw goalError;
      if (!goal) throw new Error('목표를 찾을 수 없습니다.');
      if (goal.status === 'completed') throw new Error('이미 완료된 목표입니다.');

      // 2. 목표 완료 처리
      const { error: updateError } = await supabase
        .from('user_goals')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 3. 프로필 조회 및 포인트 업데이트
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const newTotalPoints = (profile?.total_points || 0) + (goal.reward_points || 0);
      const newLevel = Math.max(Math.floor(newTotalPoints / 1000) + 1, profile?.current_level || 1);

      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          total_points: newTotalPoints,
          current_level: newLevel
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      const result = {
        success: true,
        goal_title: goal.title,
        points_earned: goal.reward_points,
        total_points: newTotalPoints,
        level: newLevel,
        level_up: newLevel > (profile?.current_level || 1)
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

  // 목표 진행률 업데이트 (v2.0 스키마)
  static async updateGoalProgress(goalId: string, progressAmount: number, notes?: string): Promise<any> {
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

      if (goalError) throw goalError;
      if (!goal) throw new Error('목표를 찾을 수 없습니다.');

      // 2. 새로운 진행값 계산
      const newCurrentValue = goal.current_value + progressAmount;
      const clampedValue = goal.target_value ? Math.min(newCurrentValue, goal.target_value) : newCurrentValue;

      // 3. 목표 진행률 업데이트
      const { error: updateError } = await supabase
        .from('user_goals')
        .update({
          current_value: clampedValue
        })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 4. 진행 기록 추가 (선택적)
      if (notes) {
        const { error: logError } = await supabase
          .from('goal_progress_logs')
          .insert({
            goal_id: goalId,
            user_id: user.id,
            progress_amount: progressAmount,
            notes: notes
          });

        if (logError) {
          console.warn('Progress log creation failed:', logError);
          // 진행 기록 실패는 전체 작업을 실패시키지 않음
        }
      }

      // 5. 진행률 계산
      const progressPercentage = goal.target_value ? (clampedValue / goal.target_value) * 100 : 0;

      const result = {
        success: true,
        current_value: clampedValue,
        target_value: goal.target_value,
        progress_percentage: progressPercentage,
        is_completed: goal.target_value ? clampedValue >= goal.target_value : false
      };

      return result;

    } catch (err) {
      console.error('=== PROGRESS UPDATE ERROR ===');
      console.error('Error:', err);
      throw err;
    }
  }

  // 목표 삭제
  static async deleteGoal(goalId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('사용자 인증이 필요합니다.');
    }

    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  }

  // 사용자 프로필 조회
  static async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // 사용자 프로필 생성/업데이트
  static async upsertUserProfile(profileData: any): Promise<any> {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 난이도별 보상 포인트 계산
  static calculateRewardPoints(difficulty: string): number {
    const pointsMap = {
      'easy': 50,
      'medium': 100,
      'hard': 200
    };
    return pointsMap[difficulty as keyof typeof pointsMap] || 100;
  }
}

export default GoalsService;