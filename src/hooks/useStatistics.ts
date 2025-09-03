import { useState, useEffect } from 'react';
import { StatisticsService } from '../services/statisticsService';
import { useAuth } from '../contexts/AuthContext';

export const useStatistics = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [weeklyProgressData, setWeeklyProgressData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 대시보드 통계 로드
  const loadDashboardStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('=== LOADING DASHBOARD STATS ===');
      console.log('User ID:', user.id);
      
      const stats = await StatisticsService.getDashboardStats(user.id);
      console.log('Dashboard stats loaded successfully');
      setDashboardStats(stats);
    } catch (err) {
      console.error('=== DASHBOARD STATS ERROR ===');
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : '대시보드 통계 로드 실패';
      setError(errorMessage);
      // 에러 시에도 빈 객체로 설정하여 로딩 상태 해제
      setDashboardStats({});
    } finally {
      setLoading(false);
    }
  };

  // 월간 통계 로드
  const loadMonthlyStats = async () => {
    if (!user) return;

    try {
      const stats = await StatisticsService.getMonthlyStats(user.id);
      setMonthlyStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '월간 통계 로드 실패');
      setMonthlyStats({});
    }
  };

  // 주간 진행률 데이터 로드
  const loadWeeklyProgressData = async () => {
    if (!user) return;

    try {
      const data = await StatisticsService.getWeeklyProgressData(user.id);
      setWeeklyProgressData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '주간 데이터 로드 실패');
      setWeeklyProgressData([]);
    }
  };

  // 카테고리 통계 로드
  const loadCategoryData = async () => {
    if (!user) return;

    try {
      const data = await StatisticsService.getCategoryCompletionData(user.id);
      setCategoryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 데이터 로드 실패');
      setCategoryData([]);
    }
  };

  // 모든 통계 데이터 새로고침
  const refreshAllStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadDashboardStats(),
        loadMonthlyStats(),
        loadWeeklyProgressData(),
        loadCategoryData(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 데이터 새로고침 실패');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    console.log('=== useStatistics useEffect triggered ===');
    console.log('User:', user ? user.id : 'No user');
    
    if (user) {
      loadDashboardStats();
      loadMonthlyStats();
      loadWeeklyProgressData();
      loadCategoryData();
    }
  }, [user?.id]); // user.id만 의존성으로 사용

  return {
    dashboardStats,
    monthlyStats,
    weeklyProgressData,
    categoryData,
    loading,
    error,
    loadDashboardStats,
    loadMonthlyStats,
    loadWeeklyProgressData,
    loadCategoryData,
    refreshAllStats,
    clearError: () => setError(null),
  };
};