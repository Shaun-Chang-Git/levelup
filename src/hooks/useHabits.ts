import { useState, useEffect, useCallback } from 'react';
import { Goal, HabitCompletion, HabitCompletionResult, RecurringGoalOptions } from '../types';
import { HabitsService } from '../services/habitsService';
import { useAuth } from '../contexts/AuthContext';

interface UseHabitsReturn {
  // 상태
  habits: Goal[];
  todaysHabits: Goal[];
  loading: boolean;
  error: string | null;
  
  // 통계
  habitStats: {
    total_habits: number;
    active_habits: number;
    completed_today: number;
    average_completion_rate: number;
    longest_streak: number;
    total_completions: number;
  } | null;
  
  // 액션
  loadHabits: () => Promise<void>;
  loadTodaysHabits: () => Promise<void>;
  loadHabitStats: () => Promise<void>;
  createHabit: (habitData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & RecurringGoalOptions) => Promise<Goal>;
  updateHabit: (habitId: string, updates: Partial<Goal & RecurringGoalOptions>) => Promise<Goal>;
  completeHabit: (habitId: string, completionDate?: string, notes?: string, value?: number) => Promise<HabitCompletionResult>;
  undoHabitCompletion: (habitId: string, completionDate?: string) => Promise<any>;
  isHabitCompleted: (habitId: string, date: string) => Promise<boolean>;
  getHabitCompletions: (habitId: string, startDate?: string, endDate?: string) => Promise<HabitCompletion[]>;
  getHabitCompletionRate: (habitId: string, days?: number) => Promise<number>;
  getMonthlyCalendar: (habitId: string, year: number, month: number) => Promise<{ [date: string]: HabitCompletion }>;
  clearError: () => void;
}

export const useHabits = (): UseHabitsReturn => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Goal[]>([]);
  const [todaysHabits, setTodaysHabits] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [habitStats, setHabitStats] = useState<{
    total_habits: number;
    active_habits: number;
    completed_today: number;
    average_completion_rate: number;
    longest_streak: number;
    total_completions: number;
  } | null>(null);

  // 모든 습관 조회
  const loadHabits = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await HabitsService.getUserHabits(user.id);
      setHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '습관 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 오늘의 습관 조회
  const loadTodaysHabits = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await HabitsService.getTodaysHabits(user.id);
      setTodaysHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오늘의 습관 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 습관 통계 조회
  const loadHabitStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const stats = await HabitsService.getUserHabitStats(user.id);
      setHabitStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '습관 통계 로딩 실패');
    }
  }, [user?.id]);

  // 새 습관 생성
  const createHabit = useCallback(async (
    habitData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> & RecurringGoalOptions
  ): Promise<Goal> => {
    if (!user?.id) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      setError(null);
      const newHabit = await HabitsService.createRecurringGoal(user.id, habitData);
      
      // 목록 새로고침
      await Promise.all([loadHabits(), loadTodaysHabits(), loadHabitStats()]);
      
      return newHabit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '습관 생성 실패';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, loadHabits, loadTodaysHabits, loadHabitStats]);

  // 습관 수정
  const updateHabit = useCallback(async (
    habitId: string, 
    updates: Partial<Goal & RecurringGoalOptions>
  ): Promise<Goal> => {
    try {
      setError(null);
      const updatedHabit = await HabitsService.updateHabit(habitId, updates);
      
      // 목록 새로고침
      await Promise.all([loadHabits(), loadTodaysHabits()]);
      
      return updatedHabit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '습관 수정 실패';
      setError(errorMessage);
      throw err;
    }
  }, [loadHabits, loadTodaysHabits]);

  // 습관 완료
  const completeHabit = useCallback(async (
    habitId: string,
    completionDate?: string,
    notes?: string,
    value?: number
  ): Promise<HabitCompletionResult> => {
    try {
      setError(null);
      const result = await HabitsService.completeHabit(habitId, completionDate, notes, value);
      
      // 목록 새로고침
      await Promise.all([loadHabits(), loadTodaysHabits(), loadHabitStats()]);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '습관 완료 처리 실패';
      setError(errorMessage);
      throw err;
    }
  }, [loadHabits, loadTodaysHabits, loadHabitStats]);

  // 습관 완료 취소
  const undoHabitCompletion = useCallback(async (
    habitId: string,
    completionDate?: string
  ): Promise<any> => {
    try {
      setError(null);
      const result = await HabitsService.undoHabitCompletion(habitId, completionDate);
      
      // 목록 새로고침
      await Promise.all([loadHabits(), loadTodaysHabits(), loadHabitStats()]);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '습관 완료 취소 실패';
      setError(errorMessage);
      throw err;
    }
  }, [loadHabits, loadTodaysHabits, loadHabitStats]);

  // 습관 완료 상태 확인
  const isHabitCompleted = useCallback(async (habitId: string, date: string): Promise<boolean> => {
    try {
      return await HabitsService.isHabitCompleted(habitId, date);
    } catch (err) {
      console.error('습관 완료 상태 확인 실패:', err);
      return false;
    }
  }, []);

  // 습관 완료 기록 조회
  const getHabitCompletions = useCallback(async (
    habitId: string,
    startDate?: string,
    endDate?: string
  ): Promise<HabitCompletion[]> => {
    try {
      return await HabitsService.getHabitCompletions(habitId, startDate, endDate);
    } catch (err) {
      console.error('습관 완료 기록 조회 실패:', err);
      return [];
    }
  }, []);

  // 습관 완료율 조회
  const getHabitCompletionRate = useCallback(async (
    habitId: string,
    days: number = 30
  ): Promise<number> => {
    try {
      return await HabitsService.getHabitCompletionRate(habitId, days);
    } catch (err) {
      console.error('습관 완료율 조회 실패:', err);
      return 0;
    }
  }, []);

  // 월간 캘린더 데이터 조회
  const getMonthlyCalendar = useCallback(async (
    habitId: string,
    year: number,
    month: number
  ): Promise<{ [date: string]: HabitCompletion }> => {
    try {
      return await HabitsService.getMonthlyHabitCalendar(habitId, year, month);
    } catch (err) {
      console.error('월간 캘린더 조회 실패:', err);
      return {};
    }
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 사용자 로그인 시 초기 데이터 로드
  useEffect(() => {
    if (user?.id) {
      Promise.all([
        loadHabits(),
        loadTodaysHabits(),
        loadHabitStats(),
      ]);
    }
  }, [user?.id, loadHabits, loadTodaysHabits, loadHabitStats]);

  return {
    habits,
    todaysHabits,
    loading,
    error,
    habitStats,
    loadHabits,
    loadTodaysHabits,
    loadHabitStats,
    createHabit,
    updateHabit,
    completeHabit,
    undoHabitCompletion,
    isHabitCompleted,
    getHabitCompletions,
    getHabitCompletionRate,
    getMonthlyCalendar,
    clearError,
  };
};