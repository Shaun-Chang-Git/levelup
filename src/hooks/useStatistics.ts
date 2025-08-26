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
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const stats = await StatisticsService.getDashboardStats(user.id);
      setDashboardStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '대시보드 통계 로드 실패');
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
    if (user) {
      loadDashboardStats();
      loadMonthlyStats();
      loadWeeklyProgressData();
      loadCategoryData();
    }
  }, [user]);

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