import { supabase } from './supabase';
import type { 
  UserFollow, 
  GoalShare, 
  GroupChallenge, 
  GroupChallengeMember,
  ActivityFeed, 
  ActivityReaction, 
  ActivityComment,
  Notification,
  NotificationSettings
} from '../types';

// ==========================================
// 친구 시스템 관련 함수들
// ==========================================

export const socialService = {
  // 사용자 팔로우
  async followUser(followingId: string) {
    const { data, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: supabase.auth.getUser().then(({ data }) => data.user?.id),
        following_id: followingId,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 사용자 언팔로우
  async unfollowUser(followingId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .match({
        follower_id: user.user.id,
        following_id: followingId
      });

    if (error) throw error;
  },

  // 팔로잉 목록 조회
  async getFollowing(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not found');

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        following_id,
        is_mutual,
        created_at,
        following_profile:profiles!user_follows_following_id_fkey (
          id,
          display_name,
          avatar_url,
          level,
          total_points
        )
      `)
      .eq('follower_id', targetUserId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 팔로워 목록 조회
  async getFollowers(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not found');

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        follower_id,
        is_mutual,
        created_at,
        follower_profile:profiles!user_follows_follower_id_fkey (
          id,
          display_name,
          avatar_url,
          level,
          total_points
        )
      `)
      .eq('following_id', targetUserId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 친구 목록 조회 (상호 팔로우)
  async getFriends(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not found');

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        following_id,
        created_at,
        friend_profile:profiles!user_follows_following_id_fkey (
          id,
          display_name,
          avatar_url,
          level,
          total_points
        )
      `)
      .eq('follower_id', targetUserId)
      .eq('is_mutual', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 팔로우 상태 확인
  async getFollowStatus(targetUserId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { isFollowing: false, isFollower: false, isMutual: false };

    const [followingResult, followerResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('is_mutual')
        .match({
          follower_id: user.user.id,
          following_id: targetUserId,
          status: 'active'
        })
        .single(),
      
      supabase
        .from('user_follows')
        .select('is_mutual')
        .match({
          follower_id: targetUserId,
          following_id: user.user.id,
          status: 'active'
        })
        .single()
    ]);

    const isFollowing = !followingResult.error;
    const isFollower = !followerResult.error;
    const isMutual = isFollowing && isFollower;

    return { isFollowing, isFollower, isMutual };
  },

  // 사용자 검색
  async searchUsers(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, level, total_points')
      .or(`display_name.ilike.%${query}%, email.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // ==========================================
  // 목표 공유 시스템
  // ==========================================

  // 목표 공유 설정
  async shareGoal(goalId: string, shareType: 'public' | 'friends' | 'followers' | 'private', options?: {
    allowComments?: boolean;
    allowReactions?: boolean;
    showProgress?: boolean;
    shareMessage?: string;
  }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('goal_shares')
      .upsert({
        goal_id: goalId,
        user_id: user.user.id,
        share_type: shareType,
        allow_comments: options?.allowComments ?? true,
        allow_reactions: options?.allowReactions ?? true,
        show_progress: options?.showProgress ?? true,
        share_message: options?.shareMessage
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 공유된 목표 목록 조회
  async getSharedGoals(shareType?: string, userId?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let query = supabase
      .from('goal_shares')
      .select(`
        id,
        goal_id,
        user_id,
        share_type,
        allow_comments,
        allow_reactions,
        show_progress,
        share_message,
        shared_at,
        goal:goals (
          id,
          title,
          description,
          difficulty,
          status,
          current_value,
          target_value,
          unit,
          target_date,
          category:categories (name, icon, color)
        ),
        user_profile:profiles!goal_shares_user_id_fkey (
          id,
          display_name,
          avatar_url,
          level
        )
      `);

    if (shareType) {
      query = query.eq('share_type', shareType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    query = query.order('shared_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // 목표 공유 해제
  async unshareGoal(goalId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('goal_shares')
      .delete()
      .match({
        goal_id: goalId,
        user_id: user.user.id
      });

    if (error) throw error;
  },

  // ==========================================
  // 그룹 도전과제 시스템
  // ==========================================

  // 그룹 도전과제 생성
  async createGroupChallenge(challengeData: {
    title: string;
    description: string;
    targetType: string;
    targetValue: number;
    maxMembers?: number;
    joinType?: 'open' | 'invite_only' | 'request';
    endDate?: string;
    rewardPoints?: number;
    baseChallengeId?: string;
  }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('group_challenges')
      .insert({
        creator_id: user.user.id,
        title: challengeData.title,
        description: challengeData.description,
        target_type: challengeData.targetType,
        target_value: challengeData.targetValue,
        max_members: challengeData.maxMembers || 10,
        join_type: challengeData.joinType || 'open',
        end_date: challengeData.endDate,
        reward_points: challengeData.rewardPoints || 0,
        base_challenge_id: challengeData.baseChallengeId,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // 생성자를 자동으로 멤버로 추가
    await this.joinGroupChallenge(data.id);

    return data;
  },

  // 그룹 도전과제 참가
  async joinGroupChallenge(groupChallengeId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // 그룹 도전과제 정보 조회
    const { data: challenge, error: challengeError } = await supabase
      .from('group_challenges')
      .select('target_value')
      .eq('id', groupChallengeId)
      .single();

    if (challengeError) throw challengeError;

    const { data, error } = await supabase
      .from('group_challenge_members')
      .insert({
        group_challenge_id: groupChallengeId,
        user_id: user.user.id,
        target_progress: challenge.target_value,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 그룹 도전과제 목록 조회
  async getGroupChallenges(status?: string, userId?: string) {
    let query = supabase
      .from('group_challenges')
      .select(`
        id,
        creator_id,
        title,
        description,
        max_members,
        join_type,
        target_type,
        target_value,
        start_date,
        end_date,
        status,
        reward_points,
        icon_emoji,
        background_color,
        created_at,
        creator_profile:profiles!group_challenges_creator_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        members_count:group_challenge_members(count)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('creator_id', userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // 그룹 도전과제 멤버 목록 조회
  async getGroupChallengeMembers(groupChallengeId: string) {
    const { data, error } = await supabase
      .from('group_challenge_members')
      .select(`
        id,
        user_id,
        current_progress,
        target_progress,
        progress_percentage,
        current_rank,
        status,
        joined_at,
        member_profile:profiles!group_challenge_members_user_id_fkey (
          id,
          display_name,
          avatar_url,
          level
        )
      `)
      .eq('group_challenge_id', groupChallengeId)
      .order('current_progress', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 내 참여 그룹 도전과제 목록
  async getMyGroupChallenges(status?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let query = supabase
      .from('group_challenge_members')
      .select(`
        id,
        current_progress,
        target_progress,
        progress_percentage,
        current_rank,
        status,
        joined_at,
        group_challenge:group_challenges (
          id,
          title,
          description,
          target_type,
          target_value,
          end_date,
          status,
          reward_points,
          icon_emoji,
          background_color
        )
      `)
      .eq('user_id', user.user.id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('joined_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // 그룹 도전과제 진행률 업데이트
  async updateGroupChallengeProgress(groupChallengeId: string, progressIncrement = 1) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('update_group_challenge_progress', {
      p_user_id: user.user.id,
      p_group_challenge_id: groupChallengeId,
      p_progress_increment: progressIncrement
    });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // 활동 피드 시스템
  // ==========================================

  // 활동 피드 조회
  async getActivityFeed(limit = 20, offset = 0) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        id,
        user_id,
        activity_type,
        title,
        description,
        visibility,
        likes_count,
        comments_count,
        metadata,
        created_at,
        user_profile:profiles!activity_feed_user_id_fkey (
          id,
          display_name,
          avatar_url,
          level
        ),
        related_goal:goals (
          id,
          title,
          difficulty,
          status
        ),
        related_badge:badges (
          id,
          name,
          tier,
          icon_emoji,
          color
        )
      `)
      .or(`visibility.eq.public,user_id.eq.${user.user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  // 특정 사용자의 활동 피드 조회
  async getUserActivityFeed(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        id,
        user_id,
        activity_type,
        title,
        description,
        visibility,
        likes_count,
        comments_count,
        metadata,
        created_at,
        user_profile:profiles!activity_feed_user_id_fkey (
          id,
          display_name,
          avatar_url,
          level
        ),
        related_goal:goals (
          id,
          title,
          difficulty,
          status
        ),
        related_badge:badges (
          id,
          name,
          tier,
          icon_emoji,
          color
        )
      `)
      .eq('user_id', userId)
      .neq('visibility', 'private')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  // 활동에 반응하기 (좋아요 등)
  async reactToActivity(activityId: string, reactionType: 'like' | 'love' | 'support' | 'celebrate' | 'wow' | 'motivate') {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activity_reactions')
      .upsert({
        activity_id: activityId,
        user_id: user.user.id,
        reaction_type: reactionType
      })
      .select()
      .single();

    if (error) throw error;

    // likes_count 업데이트
    await supabase
      .from('activity_feed')
      .update({
        likes_count: supabase.raw('likes_count + 1')
      })
      .eq('id', activityId);

    return data;
  },

  // 활동 반응 취소
  async removeReactionFromActivity(activityId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('activity_reactions')
      .delete()
      .match({
        activity_id: activityId,
        user_id: user.user.id
      });

    if (error) throw error;

    // likes_count 업데이트
    await supabase
      .from('activity_feed')
      .update({
        likes_count: supabase.raw('GREATEST(likes_count - 1, 0)')
      })
      .eq('id', activityId);
  },

  // 활동에 댓글 달기
  async commentOnActivity(activityId: string, content: string, parentCommentId?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: user.user.id,
        content,
        parent_comment_id: parentCommentId
      })
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        user_profile:profiles!activity_comments_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // comments_count 업데이트
    await supabase
      .from('activity_feed')
      .update({
        comments_count: supabase.raw('comments_count + 1')
      })
      .eq('id', activityId);

    return data;
  },

  // 활동 댓글 목록 조회
  async getActivityComments(activityId: string) {
    const { data, error } = await supabase
      .from('activity_comments')
      .select(`
        id,
        content,
        parent_comment_id,
        created_at,
        user_profile:profiles!activity_comments_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('activity_id', activityId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // 알림 시스템
  // ==========================================

  // 알림 목록 조회
  async getNotifications(limit = 20, unreadOnly = false) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        is_read,
        created_at
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // 알림 읽음 처리
  async markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // 모든 알림 읽음 처리
  async markAllNotificationsAsRead() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  // 읽지 않은 알림 개수 조회
  async getUnreadNotificationCount(userId?: string) {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');
      currentUserId = session.user.id;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', currentUserId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // 알림 설정 조회
  async getNotificationSettings() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      // 설정이 없으면 기본값으로 생성
      return this.createDefaultNotificationSettings();
    }

    return data;
  },

  // 기본 알림 설정 생성
  async createDefaultNotificationSettings() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_settings')
      .insert({
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 알림 설정 업데이트
  async updateNotificationSettings(settings: Partial<NotificationSettings>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_settings')
      .update(settings)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default socialService;