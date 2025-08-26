import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChallengesService } from '../services/challengesService';
import { 
  Challenge, 
  UserChallenge, 
  Badge,
  UserBadge,
  Leaderboard,
  LeaderboardEntry,
  ChallengeStats,
  ChallengeProgressResult,
  BadgeEarnedResult 
} from '../types';

export const useChallenges = () => {
  const { user } = useAuth();

  // 상태 관리
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [todaysChallenges, setTodaysChallenges] = useState<UserChallenge[]>([]);
  const [featuredChallenges, setFeaturedChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 데이터 로딩 함수들
  // ==========================================

  /**
   * 모든 활성 도전과제 로드
   */
  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ChallengesService.getAllChallenges();
      setChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '도전과제 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 사용자의 도전과제 참여 목록 로드
   */
  const loadUserChallenges = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await ChallengesService.getUserChallenges(user.id);
      setUserChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 도전과제 로딩 실패');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * 오늘의 도전과제 로드
   */
  const loadTodaysChallenges = useCallback(async () => {
    if (!user) return;

    try {
      const data = await ChallengesService.getTodaysChallenges(user.id);
      setTodaysChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오늘의 도전과제 로딩 실패');
    }
  }, [user]);

  /**
   * 추천 도전과제 로드
   */
  const loadFeaturedChallenges = useCallback(async () => {
    try {
      const data = await ChallengesService.getFeaturedChallenges();
      setFeaturedChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '추천 도전과제 로딩 실패');
    }
  }, []);

  /**
   * 배지 목록 로드
   */
  const loadBadges = useCallback(async () => {
    try {
      const allBadges = await ChallengesService.getAllBadges();
      setBadges(allBadges);

      if (user) {
        const userBadgeList = await ChallengesService.getUserBadges(user.id);
        setUserBadges(userBadgeList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '배지 로딩 실패');
    }
  }, [user]);

  /**
   * 리더보드 로드
   */
  const loadLeaderboards = useCallback(async () => {
    try {
      const data = await ChallengesService.getAllLeaderboards();
      setLeaderboards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '리더보드 로딩 실패');
    }
  }, []);

  /**
   * 도전과제 통계 로드
   */
  const loadChallengeStats = useCallback(async () => {
    if (!user) return;

    try {
      const stats = await ChallengesService.getChallengeStats(user.id);
      setChallengeStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '통계 로딩 실패');
    }
  }, [user]);

  // ==========================================
  // 도전과제 관리 함수들
  // ==========================================

  /**
   * 도전과제 참여
   */
  const joinChallenge = useCallback(async (challengeId: string): Promise<UserChallenge> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const userChallenge = await ChallengesService.joinChallenge(user.id, challengeId);
      
      // 상태 업데이트
      setUserChallenges(prev => [userChallenge, ...prev]);
      
      // 오늘의 도전과제 업데이트 (일일 도전과제인 경우)
      if (userChallenge.challenges?.type === 'daily') {
        setTodaysChallenges(prev => [userChallenge, ...prev]);
      }

      return userChallenge;
    } catch (err) {
      setError(err instanceof Error ? err.message : '도전과제 참여 실패');
      throw err;
    }
  }, [user]);

  /**
   * 자동 일일/주간 도전과제 참여
   */
  const autoJoinPeriodicChallenges = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      const joinedCount = await ChallengesService.autoJoinPeriodicChallenges(user.id);
      
      if (joinedCount > 0) {
        // 사용자 도전과제 목록 새로고침
        await loadUserChallenges();
        await loadTodaysChallenges();
      }

      return joinedCount;
    } catch (err) {
      setError(err instanceof Error ? err.message : '자동 참여 실패');
      return 0;
    }
  }, [user, loadUserChallenges, loadTodaysChallenges]);

  /**
   * 도전과제 포기
   */
  const abandonChallenge = useCallback(async (challengeId: string): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await ChallengesService.abandonChallenge(user.id, challengeId);
      
      // 상태에서 해당 도전과제 제거 또는 상태 변경
      setUserChallenges(prev => 
        prev.map(uc => 
          uc.challenge_id === challengeId 
            ? { ...uc, status: 'abandoned' as const }
            : uc
        )
      );

      setTodaysChallenges(prev => 
        prev.filter(tc => tc.challenge_id !== challengeId)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : '도전과제 포기 실패');
      throw err;
    }
  }, [user]);

  /**
   * 도전과제 진행률 업데이트
   */
  const updateChallengeProgress = useCallback(async (
    challengeId: string, 
    progressIncrement: number = 1
  ): Promise<ChallengeProgressResult> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const result = await ChallengesService.updateChallengeProgress(
        user.id, 
        challengeId, 
        progressIncrement
      );

      if (result.success) {
        // 상태 업데이트
        const updateChallenge = (uc: UserChallenge) => {
          if (uc.challenge_id === challengeId) {
            return {
              ...uc,
              current_progress: result.current_progress,
              progress_percentage: ChallengesService.calculateProgressPercentage(
                result.current_progress, 
                result.target_progress
              ),
              status: result.completed ? 'completed' as const : uc.status
            };
          }
          return uc;
        };

        setUserChallenges(prev => prev.map(updateChallenge));
        setTodaysChallenges(prev => prev.map(updateChallenge));

        // 완료된 경우 통계 새로고침
        if (result.completed) {
          await loadChallengeStats();
        }
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '진행률 업데이트 실패');
      throw err;
    }
  }, [user, loadChallengeStats]);

  /**
   * 도전과제 보상 수령
   */
  const claimChallengeReward = useCallback(async (challengeId: string): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await ChallengesService.claimChallengeReward(user.id, challengeId);

      // 상태 업데이트
      const updateRewardClaim = (uc: UserChallenge) => {
        if (uc.challenge_id === challengeId) {
          return {
            ...uc,
            reward_claimed: true,
            reward_claimed_at: new Date().toISOString()
          };
        }
        return uc;
      };

      setUserChallenges(prev => prev.map(updateRewardClaim));
      setTodaysChallenges(prev => prev.map(updateRewardClaim));

    } catch (err) {
      setError(err instanceof Error ? err.message : '보상 수령 실패');
      throw err;
    }
  }, [user]);

  // ==========================================
  // 배지 관리 함수들
  // ==========================================

  /**
   * 활성 배지 토글
   */
  const toggleActiveBadge = useCallback(async (badgeId: string, isActive: boolean): Promise<void> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      await ChallengesService.toggleActiveBadge(user.id, badgeId, isActive);

      // 상태 업데이트
      setUserBadges(prev => 
        prev.map(ub => ({
          ...ub,
          is_active: ub.badge_id === badgeId ? isActive : (isActive ? false : ub.is_active)
        }))
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : '배지 설정 실패');
      throw err;
    }
  }, [user]);

  /**
   * 배지 획득 체크
   */
  const checkAndAwardBadges = useCallback(async (): Promise<BadgeEarnedResult> => {
    if (!user) {
      return { badges_earned: [], total_bonus_points: 0 };
    }

    try {
      const result = await ChallengesService.checkAndAwardBadges(user.id);
      
      if (result.badges_earned.length > 0) {
        // 사용자 배지 목록 새로고침
        await loadBadges();
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '배지 체크 실패');
      return { badges_earned: [], total_bonus_points: 0 };
    }
  }, [user, loadBadges]);

  // ==========================================
  // 리더보드 함수들
  // ==========================================

  /**
   * 리더보드 엔트리 조회
   */
  const getLeaderboardEntries = useCallback(async (leaderboardId: string, limit: number = 50): Promise<LeaderboardEntry[]> => {
    try {
      return await ChallengesService.getLeaderboardEntries(leaderboardId, limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : '리더보드 조회 실패');
      return [];
    }
  }, []);

  /**
   * 사용자 리더보드 순위 조회
   */
  const getUserLeaderboardRank = useCallback(async (leaderboardId: string): Promise<LeaderboardEntry | null> => {
    if (!user) return null;

    try {
      return await ChallengesService.getUserLeaderboardRank(user.id, leaderboardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '순위 조회 실패');
      return null;
    }
  }, [user]);

  // ==========================================
  // 유틸리티 함수들
  // ==========================================

  /**
   * 타입별 도전과제 필터링
   */
  const getChallengesByType = useCallback((type: Challenge['type']): Challenge[] => {
    return challenges.filter(challenge => challenge.type === type);
  }, [challenges]);

  /**
   * 사용자의 활성 도전과제 필터링
   */
  const getActiveChallenges = useCallback((): UserChallenge[] => {
    return userChallenges.filter(uc => uc.status === 'active');
  }, [userChallenges]);

  /**
   * 완료된 도전과제 필터링
   */
  const getCompletedChallenges = useCallback((): UserChallenge[] => {
    return userChallenges.filter(uc => uc.status === 'completed');
  }, [userChallenges]);

  /**
   * 보상 미수령 완료 도전과제 필터링
   */
  const getUnclaimedRewards = useCallback((): UserChallenge[] => {
    return userChallenges.filter(uc => 
      uc.status === 'completed' && !uc.reward_claimed
    );
  }, [userChallenges]);

  /**
   * 에러 상태 클리어
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==========================================
  // 초기 데이터 로딩
  // ==========================================

  useEffect(() => {
    loadChallenges();
    loadFeaturedChallenges();
    loadBadges();
    loadLeaderboards();
  }, [loadChallenges, loadFeaturedChallenges, loadBadges, loadLeaderboards]);

  useEffect(() => {
    if (user) {
      loadUserChallenges();
      loadTodaysChallenges();
      loadChallengeStats();
      // 페이지 로드 시 자동 참여
      autoJoinPeriodicChallenges();
    }
  }, [user, loadUserChallenges, loadTodaysChallenges, loadChallengeStats, autoJoinPeriodicChallenges]);

  return {
    // 상태
    challenges,
    userChallenges,
    todaysChallenges,
    featuredChallenges,
    badges,
    userBadges,
    leaderboards,
    challengeStats,
    loading,
    error,

    // 도전과제 관리
    joinChallenge,
    abandonChallenge,
    updateChallengeProgress,
    claimChallengeReward,
    autoJoinPeriodicChallenges,

    // 배지 관리
    toggleActiveBadge,
    checkAndAwardBadges,

    // 리더보드
    getLeaderboardEntries,
    getUserLeaderboardRank,

    // 유틸리티
    getChallengesByType,
    getActiveChallenges,
    getCompletedChallenges,
    getUnclaimedRewards,
    clearError,

    // 데이터 새로고침
    loadChallenges,
    loadUserChallenges,
    loadTodaysChallenges,
    loadFeaturedChallenges,
    loadBadges,
    loadLeaderboards,
    loadChallengeStats
  };
};

export default useChallenges;