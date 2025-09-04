import { useState, useEffect, useCallback } from 'react';
import { Goal, Category } from '../types';
import { GoalsService } from '../services/goalsService';
import { useAuth } from '../contexts/AuthContext';

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      const categoriesData = await GoalsService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 로드 실패');
    }
  };

  // 목표 로드 (useCallback으로 메모이제이션)
  const loadGoals = useCallback(async (categoryId?: string, status?: string) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('=== LOADING GOALS ===');
      console.log('User ID:', user.id);
      console.log('Category ID:', categoryId);
      console.log('Status:', status);
      
      const goalsData = await GoalsService.getUserGoals(user.id, categoryId, status);
      console.log('Goals loaded successfully:', goalsData.length, 'goals');
      setGoals(goalsData);
    } catch (err) {
      console.error('=== GOALS LOADING ERROR ===');
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : '목표 로드 실패';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      // 에러 시에도 빈 배열로 설정하여 UI가 멈추지 않도록 함
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 목표 생성
  const createGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('로그인이 필요합니다');

    try {
      setLoading(true);
      const newGoal = await GoalsService.createGoal({
        ...goalData,
        user_id: user.id,
        reward_points: GoalsService.calculateRewardPoints(goalData.difficulty),
      });
      
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '목표 생성 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 목표 수정
  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      setLoading(true);
      const updatedGoal = await GoalsService.updateGoal(goalId, updates);
      
      setGoals(prev => 
        prev.map(goal => goal.id === goalId ? updatedGoal : goal)
      );
      return updatedGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '목표 수정 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 목표 삭제
  const deleteGoal = async (goalId: string) => {
    try {
      setLoading(true);
      await GoalsService.deleteGoal(goalId);
      
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '목표 삭제 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 진행률 업데이트
  const updateProgress = async (goalId: string, progressAmount: number, note?: string) => {
    try {
      setLoading(true);
      const result = await GoalsService.updateProgress(goalId, progressAmount, note);
      
      // 목표 목록 다시 로드 (진행률 반영)
      await loadGoals();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '진행률 업데이트 실패';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 목표 완료
  const completeGoal = async (goalId: string) => {
    try {
      setLoading(true);
      console.log('=== useGoals completeGoal START ===');
      console.log('Goal ID:', goalId);
      
      const result = await GoalsService.completeGoal(goalId);
      console.log('=== completeGoal SERVICE RESULT ===');
      console.log('Result:', result);
      console.log('Result type:', typeof result);
      
      // 목표 목록 다시 로드 (완료 상태 반영)
      console.log('Reloading goals after completion...');
      await loadGoals();
      console.log('Goals reloaded successfully');
      
      return result;
    } catch (err) {
      console.error('=== GOAL COMPLETION ERROR IN HOOK ===');
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : '목표 완료 실패';
      setError(errorMessage);
      
      // 에러 발생 시에도 로딩 상태 즉시 해제
      setLoading(false);
      throw new Error(errorMessage);
    } finally {
      // 항상 로딩 상태 해제 (에러 발생 시에도)
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    console.log('=== useGoals useEffect triggered ===');
    console.log('User:', user ? user.id : 'No user');
    
    loadCategories();
    if (user) {
      loadGoals();
    }
  }, [user, loadGoals]);

  return {
    goals,
    categories,
    loading,
    error,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    completeGoal,
    clearError: () => setError(null),
  };
};