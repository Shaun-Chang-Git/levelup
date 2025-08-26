import { supabase } from './supabase';
import { Goal, HabitCompletion, HabitStatistics, HabitReminder, HabitCompletionResult, RecurringGoalOptions } from '../types';

export class HabitsService {
  // 반복 목표 생성
  static async createRecurringGoal(
    userId: string, 
    goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & RecurringGoalOptions
  ): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert([{
        ...goalData,
        user_id: userId,
        is_recurring: true,
        habit_streak: 0,
        longest_streak: 0,
      }])
      .select(`
        *,
        categories(*)
      `)
      .single();

    if (error) {
      throw new Error(`반복 목표 생성 실패: ${error.message}`);
    }

    // 다음 수행 예정일 설정
    await this.updateNextDueDate(data.id);

    return data;
  }

  // 사용자의 모든 습관(반복 목표) 조회
  static async getUserHabits(userId: string, status?: string): Promise<Goal[]> {
    let query = supabase
      .from('goals')
      .select(`
        *,
        categories(*)
      `)
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`습관 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 오늘 수행할 습관 목록 조회
  static async getTodaysHabits(userId: string): Promise<Goal[]> {
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay(); // 1-7 (월-일)

    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        categories(*)
      `)
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .eq('status', 'active')
      .or(`
        recurrence_type.eq.daily,
        and(recurrence_type.eq.weekly,recurrence_days.cs.{${dayOfWeek}}),
        and(recurrence_type.eq.monthly,recurrence_days.cs.{${new Date().getDate()}})
      `);

    if (error) {
      throw new Error(`오늘의 습관 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 습관 완료 처리
  static async completeHabit(
    goalId: string,
    completionDate: string = new Date().toISOString().split('T')[0],
    notes?: string,
    completionValue: number = 1
  ): Promise<HabitCompletionResult> {
    const { data, error } = await supabase
      .rpc('complete_habit', {
        p_goal_id: goalId,
        p_completion_date: completionDate,
        p_notes: notes,
        p_completion_value: completionValue,
      });

    if (error) {
      throw new Error(`습관 완료 처리 실패: ${error.message}`);
    }

    return data;
  }

  // 습관 완료 취소
  static async undoHabitCompletion(
    goalId: string,
    completionDate: string = new Date().toISOString().split('T')[0]
  ): Promise<any> {
    const { data, error } = await supabase
      .rpc('undo_habit_completion', {
        p_goal_id: goalId,
        p_completion_date: completionDate,
      });

    if (error) {
      throw new Error(`습관 완료 취소 실패: ${error.message}`);
    }

    return data;
  }

  // 습관 완료 기록 조회
  static async getHabitCompletions(
    goalId: string,
    startDate?: string,
    endDate?: string
  ): Promise<HabitCompletion[]> {
    let query = supabase
      .from('habit_completions')
      .select('*')
      .eq('goal_id', goalId)
      .order('completion_date', { ascending: false });

    if (startDate) {
      query = query.gte('completion_date', startDate);
    }

    if (endDate) {
      query = query.lte('completion_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`습관 완료 기록 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 특정 날짜에 습관이 완료되었는지 확인
  static async isHabitCompleted(goalId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('goal_id', goalId)
      .eq('completion_date', date)
      .maybeSingle();

    if (error) {
      throw new Error(`습관 완료 상태 확인 실패: ${error.message}`);
    }

    return !!data;
  }

  // 습관 완료율 계산 (최근 N일)
  static async getHabitCompletionRate(goalId: string, days: number = 30): Promise<number> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 해당 기간의 완료 기록 수
    const { data: completions, error: completionError } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('goal_id', goalId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate);

    if (completionError) {
      throw new Error(`완료율 계산 실패: ${completionError.message}`);
    }

    // 목표 정보 조회 (반복 유형 확인)
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('recurrence_type, recurrence_days, recurrence_interval')
      .eq('id', goalId)
      .single();

    if (goalError) {
      throw new Error(`목표 정보 조회 실패: ${goalError.message}`);
    }

    // 실제 수행 가능한 날짜 수 계산
    let possibleDays = days;
    
    if (goal.recurrence_type === 'weekly' && goal.recurrence_days) {
      // 주간 반복의 경우 실제 수행 가능한 날짜만 계산
      possibleDays = Math.floor(days / 7) * goal.recurrence_days.length;
      possibleDays += Math.min(days % 7, goal.recurrence_days.length);
    }

    const completionCount = completions?.length || 0;
    return possibleDays > 0 ? Math.round((completionCount / possibleDays) * 100) : 0;
  }

  // 습관의 연속 달성 통계 조회
  static async getHabitStreakStats(goalId: string): Promise<{
    current_streak: number;
    longest_streak: number;
    total_completions: number;
  }> {
    const { data, error } = await supabase
      .from('goals')
      .select('habit_streak, longest_streak, current_value')
      .eq('id', goalId)
      .single();

    if (error) {
      throw new Error(`연속 달성 통계 조회 실패: ${error.message}`);
    }

    return {
      current_streak: data.habit_streak || 0,
      longest_streak: data.longest_streak || 0,
      total_completions: data.current_value || 0,
    };
  }

  // 월간 습관 캘린더 데이터 조회
  static async getMonthlyHabitCalendar(goalId: string, year: number, month: number): Promise<{
    [date: string]: HabitCompletion;
  }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 해당 월의 마지막 날

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('goal_id', goalId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate)
      .order('completion_date');

    if (error) {
      throw new Error(`월간 캘린더 데이터 조회 실패: ${error.message}`);
    }

    // 날짜별로 매핑
    const calendar: { [date: string]: HabitCompletion } = {};
    data?.forEach(completion => {
      calendar[completion.completion_date] = completion;
    });

    return calendar;
  }

  // 습관 리마인더 설정
  static async setHabitReminder(
    goalId: string,
    userId: string,
    reminderTime: string,
    daysOfWeek: number[]
  ): Promise<HabitReminder> {
    // 기존 리마인더 제거
    await supabase
      .from('habit_reminders')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    // 새 리마인더 생성
    const { data, error } = await supabase
      .from('habit_reminders')
      .insert([{
        goal_id: goalId,
        user_id: userId,
        reminder_time: reminderTime,
        days_of_week: daysOfWeek,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`리마인더 설정 실패: ${error.message}`);
    }

    return data;
  }

  // 습관 리마인더 조회
  static async getHabitReminders(userId: string): Promise<HabitReminder[]> {
    const { data, error } = await supabase
      .from('habit_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`리마인더 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // 다음 수행 예정일 업데이트 (내부 함수)
  private static async updateNextDueDate(goalId: string): Promise<void> {
    const { error } = await supabase
      .rpc('update_next_due_date', { p_goal_id: goalId });

    if (error) {
      throw new Error(`다음 수행일 업데이트 실패: ${error.message}`);
    }
  }

  // 습관 수정 (반복 설정 포함)
  static async updateHabit(
    goalId: string, 
    updates: Partial<Goal & RecurringGoalOptions>
  ): Promise<Goal> {
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
      throw new Error(`습관 수정 실패: ${error.message}`);
    }

    // 반복 설정이 변경된 경우 다음 수행일 재계산
    if (updates.recurrence_type || updates.recurrence_days || updates.recurrence_interval) {
      await this.updateNextDueDate(goalId);
    }

    return data;
  }

  // 사용자의 전체 습관 통계
  static async getUserHabitStats(userId: string): Promise<{
    total_habits: number;
    active_habits: number;
    completed_today: number;
    average_completion_rate: number;
    longest_streak: number;
    total_completions: number;
  }> {
    // 전체 습관 수
    const { data: totalHabits, error: totalError } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('is_recurring', true);

    if (totalError) {
      throw new Error(`습관 통계 조회 실패: ${totalError.message}`);
    }

    // 활성 습관 수
    const { data: activeHabits, error: activeError } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .eq('status', 'active');

    if (activeError) {
      throw new Error(`활성 습관 조회 실패: ${activeError.message}`);
    }

    // 오늘 완료한 습관 수
    const today = new Date().toISOString().split('T')[0];
    const { data: todayCompletions, error: todayError } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('completion_date', today);

    if (todayError) {
      throw new Error(`오늘 완료 현황 조회 실패: ${todayError.message}`);
    }

    // 최고 연속 달성과 총 완료 횟수
    const { data: streakStats, error: streakError } = await supabase
      .from('goals')
      .select('longest_streak, current_value')
      .eq('user_id', userId)
      .eq('is_recurring', true);

    if (streakError) {
      throw new Error(`연속 달성 통계 조회 실패: ${streakError.message}`);
    }

    const longestStreak = Math.max(...(streakStats?.map(s => s.longest_streak) || [0]));
    const totalCompletions = streakStats?.reduce((sum, s) => sum + (s.current_value || 0), 0) || 0;

    return {
      total_habits: totalHabits?.length || 0,
      active_habits: activeHabits?.length || 0,
      completed_today: todayCompletions?.length || 0,
      average_completion_rate: 0, // 추후 구현
      longest_streak: longestStreak,
      total_completions: totalCompletions,
    };
  }
}