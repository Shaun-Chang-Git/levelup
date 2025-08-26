import { supabase } from './supabase';
import { 
  Challenge, 
  UserChallenge, 
  Badge,
  UserBadge,
  ChallengeCompletion,
  Leaderboard,
  LeaderboardEntry,
  ChallengeProgressResult,
  BadgeEarnedResult,
  ChallengeStats,
  ChallengeJoinOptions
} from '../types';

export class ChallengesService {
  // ==========================================
  // 도전과제 관리
  // ==========================================

  /**
   * 모든 활성 도전과제 조회
   */
  static async getAllChallenges(): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .eq('status', 'active')
      .order('type', { ascending: true })
      .order('difficulty', { ascending: true });

    if (error) {
      console.error('도전과제 조회 오류:', error);
      throw new Error(`도전과제를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 타입별 도전과제 조회
   */
  static async getChallengesByType(type: Challenge['type']): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .eq('status', 'active')
      .eq('type', type)
      .order('difficulty', { ascending: true });

    if (error) {
      console.error('타입별 도전과제 조회 오류:', error);
      throw new Error(`도전과제를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 추천 도전과제 조회 (인기, 추천 등)
   */
  static async getFeaturedChallenges(): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('reward_points', { ascending: false })
      .limit(6);

    if (error) {
      console.error('추천 도전과제 조회 오류:', error);
      throw new Error(`추천 도전과제를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================
  // 사용자 도전과제 참여 관리
  // ==========================================

  /**
   * 사용자의 도전과제 참여 목록 조회
   */
  static async getUserChallenges(userId: string, status?: UserChallenge['status']): Promise<UserChallenge[]> {
    let query = supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (
          id,
          title,
          description,
          type,
          difficulty,
          reward_points,
          icon_emoji,
          background_color,
          categories (
            id,
            name,
            color
          )
        )
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('사용자 도전과제 조회 오류:', error);
      throw new Error(`도전과제 참여 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 오늘의 도전과제 조회
   */
  static async getTodaysChallenges(userId: string): Promise<UserChallenge[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (
          id,
          title,
          description,
          type,
          difficulty,
          reward_points,
          icon_emoji,
          background_color
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('deadline', today)
      .in('challenges.type', ['daily'])
      .order('deadline', { ascending: true });

    if (error) {
      console.error('오늘의 도전과제 조회 오류:', error);
      throw new Error(`오늘의 도전과제를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 도전과제 참여
   */
  static async joinChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    const { data, error } = await supabase.rpc('join_challenge', {
      p_user_id: userId,
      p_challenge_id: challengeId
    });

    if (error) {
      console.error('도전과제 참여 오류:', error);
      throw new Error(`도전과제 참여 중 오류가 발생했습니다: ${error.message}`);
    }

    if (!data) {
      throw new Error('이미 참여한 도전과제이거나 참여할 수 없는 상태입니다.');
    }

    // 참여한 도전과제 정보 반환
    const userChallenge = await this.getUserChallenge(userId, challengeId);
    if (!userChallenge) {
      throw new Error('도전과제 참여 정보를 찾을 수 없습니다.');
    }

    return userChallenge;
  }

  /**
   * 특정 사용자 도전과제 조회
   */
  static async getUserChallenge(userId: string, challengeId: string): Promise<UserChallenge | null> {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (
          id,
          title,
          description,
          type,
          difficulty,
          reward_points,
          icon_emoji,
          background_color
        )
      `)
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('사용자 도전과제 조회 오류:', error);
      throw new Error(`도전과제 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data;
  }

  /**
   * 자동 일일/주간 도전과제 참여
   */
  static async autoJoinPeriodicChallenges(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('auto_join_periodic_challenges', {
      p_user_id: userId
    });

    if (error) {
      console.error('자동 도전과제 참여 오류:', error);
      throw new Error(`자동 도전과제 참여 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || 0;
  }

  /**
   * 도전과제 포기
   */
  static async abandonChallenge(userId: string, challengeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_challenges')
      .update({ 
        status: 'abandoned',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('status', 'active');

    if (error) {
      console.error('도전과제 포기 오류:', error);
      throw new Error(`도전과제 포기 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  // ==========================================
  // 도전과제 진행률 관리
  // ==========================================

  /**
   * 도전과제 진행률 업데이트
   */
  static async updateChallengeProgress(
    userId: string, 
    challengeId: string, 
    progressIncrement: number = 1
  ): Promise<ChallengeProgressResult> {
    const { data, error } = await supabase.rpc('update_challenge_progress', {
      p_user_id: userId,
      p_challenge_id: challengeId,
      p_progress_increment: progressIncrement
    });

    if (error) {
      console.error('도전과제 진행률 업데이트 오류:', error);
      throw new Error(`도전과제 진행률 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }

    if (!data) {
      return {
        success: false,
        current_progress: 0,
        target_progress: 0,
        completed: false
      };
    }

    // 업데이트된 사용자 도전과제 정보 조회
    const userChallenge = await this.getUserChallenge(userId, challengeId);
    if (!userChallenge) {
      throw new Error('도전과제 정보를 찾을 수 없습니다.');
    }

    return {
      success: true,
      current_progress: userChallenge.current_progress,
      target_progress: userChallenge.target_progress,
      completed: userChallenge.status === 'completed',
      points_earned: userChallenge.status === 'completed' ? userChallenge.challenges?.reward_points : undefined
    };
  }

  /**
   * 도전과제 보상 수령
   */
  static async claimChallengeReward(userId: string, challengeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_challenges')
      .update({ 
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .eq('status', 'completed')
      .eq('reward_claimed', false);

    if (error) {
      console.error('도전과제 보상 수령 오류:', error);
      throw new Error(`도전과제 보상 수령 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  // ==========================================
  // 배지 관리
  // ==========================================

  /**
   * 모든 배지 조회
   */
  static async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_hidden', false)
      .order('sort_order', { ascending: true })
      .order('tier', { ascending: true });

    if (error) {
      console.error('배지 조회 오류:', error);
      throw new Error(`배지 목록을 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 사용자의 배지 조회
   */
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (
          id,
          name,
          description,
          tier,
          icon_emoji,
          color,
          bonus_points,
          rarity
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('사용자 배지 조회 오류:', error);
      throw new Error(`사용자 배지를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 활성 배지 설정/해제
   */
  static async toggleActiveBadge(userId: string, badgeId: string, isActive: boolean): Promise<void> {
    if (isActive) {
      // 다른 배지들 비활성화
      await supabase
        .from('user_badges')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);
    }

    const { error } = await supabase
      .from('user_badges')
      .update({ is_active: isActive })
      .eq('user_id', userId)
      .eq('badge_id', badgeId);

    if (error) {
      console.error('배지 활성화 오류:', error);
      throw new Error(`배지 설정 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 배지 획득 체크 (수동 호출)
   */
  static async checkAndAwardBadges(userId: string): Promise<BadgeEarnedResult> {
    const { data, error } = await supabase.rpc('check_and_award_badges', {
      p_user_id: userId
    });

    if (error) {
      console.error('배지 획득 체크 오류:', error);
      throw new Error(`배지 획득 체크 중 오류가 발생했습니다: ${error.message}`);
    }

    const awardedCount = data || 0;

    if (awardedCount > 0) {
      // 새로 획득한 배지 조회
      const userBadges = await this.getUserBadges(userId);
      const recentBadges = userBadges
        .slice(0, awardedCount)
        .map(ub => ub.badges!)
        .filter(Boolean);

      const totalBonusPoints = recentBadges.reduce((sum, badge) => sum + badge.bonus_points, 0);

      return {
        badges_earned: recentBadges,
        total_bonus_points: totalBonusPoints
      };
    }

    return {
      badges_earned: [],
      total_bonus_points: 0
    };
  }

  // ==========================================
  // 리더보드 관리
  // ==========================================

  /**
   * 모든 리더보드 조회
   */
  static async getAllLeaderboards(): Promise<Leaderboard[]> {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('리더보드 조회 오류:', error);
      throw new Error(`리더보드를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 특정 리더보드 엔트리 조회
   */
  static async getLeaderboardEntries(leaderboardId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user_profiles (
          id,
          display_name,
          avatar_url,
          level
        )
      `)
      .eq('leaderboard_id', leaderboardId)
      .order('rank_position', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('리더보드 엔트리 조회 오류:', error);
      throw new Error(`리더보드 순위를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 사용자의 리더보드 순위 조회
   */
  static async getUserLeaderboardRank(userId: string, leaderboardId: string): Promise<LeaderboardEntry | null> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user_profiles (
          id,
          display_name,
          avatar_url,
          level
        )
      `)
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('사용자 리더보드 순위 조회 오류:', error);
      throw new Error(`리더보드 순위를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data;
  }

  /**
   * 리더보드 업데이트 (관리자 기능)
   */
  static async updateLeaderboard(leaderboardId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_leaderboard', {
      p_leaderboard_id: leaderboardId
    });

    if (error) {
      console.error('리더보드 업데이트 오류:', error);
      throw new Error(`리더보드 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || false;
  }

  // ==========================================
  // 통계 및 대시보드
  // ==========================================

  /**
   * 사용자의 도전과제 통계 조회
   */
  static async getChallengeStats(userId: string): Promise<ChallengeStats> {
    try {
      // 기본 통계
      const { data: userChallenges, error: challengesError } = await supabase
        .from('user_challenges')
        .select('status, challenges(reward_points)')
        .eq('user_id', userId);

      if (challengesError) {
        throw challengesError;
      }

      const totalChallenges = userChallenges?.length || 0;
      const activeChallenges = userChallenges?.filter(uc => uc.status === 'active').length || 0;
      const completedChallenges = userChallenges?.filter(uc => uc.status === 'completed').length || 0;
      const failedChallenges = userChallenges?.filter(uc => uc.status === 'failed').length || 0;
      const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

      // 도전과제로 획득한 총 포인트
      const totalPointsFromChallenges = userChallenges
        ?.filter(uc => uc.status === 'completed')
        .reduce((sum, uc) => sum + (uc.challenges?.reward_points || 0), 0) || 0;

      // 도전과제로 획득한 배지 수
      const { data: badgesFromChallenges, error: badgesError } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('earned_through', 'challenge');

      if (badgesError) {
        throw badgesError;
      }

      const badgesEarnedFromChallenges = badgesFromChallenges?.length || 0;

      // 현재 리더보드 순위
      const leaderboards = await this.getAllLeaderboards();
      const currentRankInLeaderboards: LeaderboardEntry[] = [];

      for (const leaderboard of leaderboards.slice(0, 3)) { // 상위 3개 리더보드만
        const rank = await this.getUserLeaderboardRank(userId, leaderboard.id);
        if (rank) {
          currentRankInLeaderboards.push(rank);
        }
      }

      return {
        total_challenges: totalChallenges,
        active_challenges: activeChallenges,
        completed_challenges: completedChallenges,
        failed_challenges: failedChallenges,
        completion_rate: Math.round(completionRate * 100) / 100,
        total_points_from_challenges: totalPointsFromChallenges,
        badges_earned_from_challenges: badgesEarnedFromChallenges,
        current_rank_in_leaderboards: currentRankInLeaderboards
      };

    } catch (error) {
      console.error('도전과제 통계 조회 오류:', error);
      throw new Error(`도전과제 통계를 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 도전과제 완료 이력 조회
   */
  static async getChallengeCompletions(userId: string, limit: number = 20): Promise<ChallengeCompletion[]> {
    const { data, error } = await supabase
      .from('challenge_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('도전과제 완료 이력 조회 오류:', error);
      throw new Error(`완료 이력을 불러오는 중 오류가 발생했습니다: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================
  // 유틸리티 함수
  // ==========================================

  /**
   * 도전과제 난이도별 색상 반환
   */
  static getDifficultyColor(difficulty: Challenge['difficulty']): string {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#2196F3';
    }
  }

  /**
   * 배지 티어별 색상 반환
   */
  static getBadgeTierColor(tier: Badge['tier']): string {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      case 'diamond': return '#B9F2FF';
      default: return '#757575';
    }
  }

  /**
   * 진행률 백분율 계산
   */
  static calculateProgressPercentage(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  }

  /**
   * 남은 시간 계산 (문자열 반환)
   */
  static getTimeRemaining(deadline: string): string {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return '기한 만료';
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}일 ${hours}시간 남음`;
    } else if (hours > 0) {
      return `${hours}시간 남음`;
    } else {
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}분 남음`;
    }
  }
}

export default ChallengesService;