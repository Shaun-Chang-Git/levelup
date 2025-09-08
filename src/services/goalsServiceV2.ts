// 🏗️ Goals Service v2.0 - 재설계된 데이터베이스용
// 새로운 테이블: user_goals, user_profiles, goal_progress_logs

import { supabase } from './supabase';

export interface GoalV2 {
  id: string;
  user_id: string;
  category_id: number;
  title: string;
  description?: string;
  target_value?: number;
  current_value: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  reward_points: number;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileV2 {
  id: string;
  email?: string;
  display_name?: string;
  total_points: number;
  current_level: number;
  created_at: string;
  updated_at: string;
}

export class GoalsServiceV2 {
  // 목표 목록 조회
  static async getGoals(userId: string, categoryId?: number, status?: string): Promise<GoalV2[]> {
    console.log('=== GOALS SERVICE V2: LOADING GOALS ===');
    console.log('User ID:', userId);
    console.log('Category ID:', categoryId);
    console.log('Status:', status);

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

    console.log(`Goals loaded successfully: ${data?.length || 0} goals`);
    return data || [];
  }

  // 목표 생성
  static async createGoal(goalData: Partial<GoalV2>): Promise<GoalV2> {
    console.log('=== CREATING GOAL V2 ===');
    console.log('Goal data:', goalData);

    const { data, error } = await supabase
      .from('user_goals')
      .insert([goalData])
      .select()
      .single();

    if (error) {
      console.error('Goal creation error:', error);
      throw error;
    }

    console.log('Goal created successfully:', data);
    return data;
  }

  // 목표 완료 (단순한 클라이언트 사이드)
  static async completeGoal(goalId: string): Promise<any> {
    console.log('=== GOAL COMPLETION V2 START ===');
    console.log('Goal ID:', goalId);
    
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

      // 3. 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // 4. 포인트 및 레벨 계산
      const newTotalPoints = (profile?.total_points || 0) + (goal.reward_points || 0);
      const newLevel = Math.max(Math.floor(newTotalPoints / 1000) + 1, profile?.current_level || 1);

      // 5. 프로필 업데이트
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

      console.log('=== GOAL COMPLETION V2 SUCCESS ===');
      console.log('Result:', result);

      return result;

    } catch (err) {
      console.error('=== GOAL COMPLETION V2 ERROR ===');
      console.error('Error:', err);
      throw err;
    }
  }

  // 목표 진행률 업데이트
  static async updateGoalProgress(goalId: string, progressAmount: number, notes?: string): Promise<any> {
    console.log('=== UPDATE GOAL PROGRESS V2 START ===');
    console.log('Goal ID:', goalId);
    console.log('Progress Amount:', progressAmount);

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

      // 4. 진행 기록 추가
      const { error: logError } = await supabase
        .from('goal_progress_logs')
        .insert({
          goal_id: goalId,
          user_id: user.id,
          progress_amount: progressAmount,
          notes: notes
        });

      if (logError) throw logError;

      // 5. 진행률 계산
      const progressPercentage = goal.target_value ? (clampedValue / goal.target_value) * 100 : 0;

      const result = {
        success: true,
        current_value: clampedValue,
        target_value: goal.target_value,
        progress_percentage: progressPercentage,
        is_completed: goal.target_value ? clampedValue >= goal.target_value : false
      };

      console.log('=== PROGRESS UPDATE V2 SUCCESS ===');
      console.log('Result:', result);

      return result;

    } catch (err) {
      console.error('=== PROGRESS UPDATE V2 ERROR ===');
      console.error('Error:', err);
      throw err;
    }
  }

  // 사용자 프로필 조회
  static async getUserProfile(userId: string): Promise<UserProfileV2 | null> {
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
  static async upsertUserProfile(profileData: Partial<UserProfileV2>): Promise<UserProfileV2> {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}