import { useState, useEffect } from 'react';
import { Achievement, UserAchievement } from '../types';
import { AchievementsService } from '../services/achievementsService';
import { useAuth } from '../contexts/AuthContext';

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 업적 진행률 로드
  const loadAchievementProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const progressData = await AchievementsService.getUserAchievementProgress(user.id);
      setAchievements(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업적 데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 달성 업적 로드
  const loadUserAchievements = async () => {
    if (!user) return;

    try {
      const userAchievementsData = await AchievementsService.getUserAchievements(user.id);
      setUserAchievements(userAchievementsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '달성 업적 로드 실패');
    }
  };

  // 업적 체크 및 수여
  const checkAchievements = async () => {
    if (!user) return null;

    try {
      const result = await AchievementsService.checkAndAwardAchievements(user.id);
      
      // 새로운 업적이 달성되었다면 데이터 다시 로드
      if (result?.newly_earned_count > 0) {
        await loadAchievementProgress();
        await loadUserAchievements();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '업적 체크 실패');
      return null;
    }
  };

  // 업적 통계 계산
  const getAchievementStats = () => {
    const total = achievements.length;
    const earned = achievements.filter(a => a.isEarned).length;
    const totalPoints = achievements
      .filter(a => a.isEarned)
      .reduce((sum, a) => sum + (a.reward_points || 0), 0);

    return {
      total,
      earned,
      percentage: total > 0 ? Math.round((earned / total) * 100) : 0,
      totalPoints,
    };
  };

  // 카테고리별 업적 분류
  const getAchievementsByCategory = () => {
    const categories = {
      progress: achievements.filter(a => 
        a.condition_type === 'goal_complete' || a.condition_type === 'total_points'
      ),
      streak: achievements.filter(a => a.condition_type === 'streak'),
      category: achievements.filter(a => a.condition_type === 'category_goals'),
      special: achievements.filter(a => 
        !['goal_complete', 'total_points', 'streak', 'category_goals'].includes(a.condition_type)
      ),
    };

    return categories;
  };

  // 최근 달성한 업적 (상위 5개)
  const getRecentAchievements = () => {
    return userAchievements
      .filter(ua => ua.achievements)
      .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 5);
  };

  // 거의 달성 가능한 업적 (진행률 70% 이상)
  const getAlmostAchievableAchievements = () => {
    return achievements
      .filter(a => !a.isEarned && a.progress >= 70)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      loadAchievementProgress();
      loadUserAchievements();
    }
  }, [user]);

  return {
    achievements,
    userAchievements,
    loading,
    error,
    loadAchievementProgress,
    loadUserAchievements,
    checkAchievements,
    getAchievementStats,
    getAchievementsByCategory,
    getRecentAchievements,
    getAlmostAchievableAchievements,
    clearError: () => setError(null),
  };
};