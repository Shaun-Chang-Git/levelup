import { useState, useEffect, useCallback } from 'react';
import { socialService } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import type { 
  UserFollow, 
  GoalShare, 
  GroupChallenge,
  GroupChallengeMember,
  ActivityFeed,
  ActivityComment,
  Notification,
  NotificationSettings,
  UserSearchResult,
  FriendListItem,
  FollowStatus,
  GroupChallengeCreateData,
  GoalShareOptions,
  SocialStats
} from '../types';

// 친구 시스템 훅
export const useFriends = () => {
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [following, setFollowing] = useState<FriendListItem[]>([]);
  const [followers, setFollowers] = useState<FriendListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getFriends(userId);
      setFriends(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '친구 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFollowing = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getFollowing(userId);
      setFollowing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '팔로잉 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFollowers = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getFollowers(userId);
      setFollowers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '팔로워 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const followUser = useCallback(async (userId: string) => {
    try {
      await socialService.followUser(userId);
      // 팔로잉 목록 새로고침
      await fetchFollowing();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '팔로우에 실패했습니다.');
      return false;
    }
  }, [fetchFollowing]);

  const unfollowUser = useCallback(async (userId: string) => {
    try {
      await socialService.unfollowUser(userId);
      // 팔로잉 목록 새로고침
      await fetchFollowing();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '언팔로우에 실패했습니다.');
      return false;
    }
  }, [fetchFollowing]);

  const getFollowStatus = useCallback(async (userId: string): Promise<FollowStatus> => {
    try {
      return await socialService.getFollowStatus(userId);
    } catch (err) {
      console.error('팔로우 상태 확인 실패:', err);
      return { isFollowing: false, isFollower: false, isMutual: false };
    }
  }, []);

  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    try {
      if (!query.trim()) return [];
      return await socialService.searchUsers(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 검색에 실패했습니다.');
      return [];
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    following,
    followers,
    loading,
    error,
    fetchFriends,
    fetchFollowing,
    fetchFollowers,
    followUser,
    unfollowUser,
    getFollowStatus,
    searchUsers
  };
};

// 목표 공유 훅
export const useGoalSharing = () => {
  const [sharedGoals, setSharedGoals] = useState<GoalShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedGoals = useCallback(async (shareType?: string, userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getSharedGoals(shareType, userId);
      setSharedGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '공유된 목표를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const shareGoal = useCallback(async (
    goalId: string, 
    shareType: 'public' | 'friends' | 'followers' | 'private',
    options?: GoalShareOptions
  ) => {
    try {
      await socialService.shareGoal(goalId, shareType, options);
      await fetchSharedGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '목표 공유에 실패했습니다.');
      return false;
    }
  }, [fetchSharedGoals]);

  const unshareGoal = useCallback(async (goalId: string) => {
    try {
      await socialService.unshareGoal(goalId);
      await fetchSharedGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '목표 공유 해제에 실패했습니다.');
      return false;
    }
  }, [fetchSharedGoals]);

  useEffect(() => {
    fetchSharedGoals();
  }, [fetchSharedGoals]);

  return {
    sharedGoals,
    loading,
    error,
    fetchSharedGoals,
    shareGoal,
    unshareGoal
  };
};

// 그룹 도전과제 훅
export const useGroupChallenges = () => {
  const [groupChallenges, setGroupChallenges] = useState<GroupChallenge[]>([]);
  const [myGroupChallenges, setMyGroupChallenges] = useState<GroupChallengeMember[]>([]);
  const [challengeMembers, setChallengeMembers] = useState<GroupChallengeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupChallenges = useCallback(async (status?: string, userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getGroupChallenges(status, userId);
      setGroupChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 도전과제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyGroupChallenges = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getMyGroupChallenges(status);
      setMyGroupChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '내 그룹 도전과제를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChallengeMembers = useCallback(async (groupChallengeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getGroupChallengeMembers(groupChallengeId);
      setChallengeMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '도전과제 멤버를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroupChallenge = useCallback(async (challengeData: GroupChallengeCreateData) => {
    try {
      const data = await socialService.createGroupChallenge(challengeData);
      await fetchGroupChallenges();
      await fetchMyGroupChallenges();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 도전과제 생성에 실패했습니다.');
      return null;
    }
  }, [fetchGroupChallenges, fetchMyGroupChallenges]);

  const joinGroupChallenge = useCallback(async (groupChallengeId: string) => {
    try {
      await socialService.joinGroupChallenge(groupChallengeId);
      await fetchMyGroupChallenges();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 도전과제 참가에 실패했습니다.');
      return false;
    }
  }, [fetchMyGroupChallenges]);

  const updateProgress = useCallback(async (groupChallengeId: string, progressIncrement = 1) => {
    try {
      await socialService.updateGroupChallengeProgress(groupChallengeId, progressIncrement);
      await fetchMyGroupChallenges();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '진행률 업데이트에 실패했습니다.');
      return false;
    }
  }, [fetchMyGroupChallenges]);

  useEffect(() => {
    fetchGroupChallenges();
    fetchMyGroupChallenges();
  }, [fetchGroupChallenges, fetchMyGroupChallenges]);

  return {
    groupChallenges,
    myGroupChallenges,
    challengeMembers,
    loading,
    error,
    fetchGroupChallenges,
    fetchMyGroupChallenges,
    fetchChallengeMembers,
    createGroupChallenge,
    joinGroupChallenge,
    updateProgress
  };
};

// 활동 피드 훅
export const useActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityFeed[]>([]);
  const [comments, setComments] = useState<{ [key: string]: ActivityComment[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivityFeed = useCallback(async (limit = 20, offset = 0, userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = userId 
        ? await socialService.getUserActivityFeed(userId, limit, offset)
        : await socialService.getActivityFeed(limit, offset);
      
      if (offset === 0) {
        setActivities(data);
      } else {
        setActivities(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : '활동 피드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreActivities = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchActivityFeed(20, activities.length);
  }, [fetchActivityFeed, activities.length, hasMore, loading]);

  const reactToActivity = useCallback(async (
    activityId: string, 
    reactionType: 'like' | 'love' | 'support' | 'celebrate' | 'wow' | 'motivate'
  ) => {
    try {
      await socialService.reactToActivity(activityId, reactionType);
      
      // 로컬 상태 업데이트
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, likes_count: activity.likes_count + 1 }
            : activity
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '반응 추가에 실패했습니다.');
      return false;
    }
  }, []);

  const removeReaction = useCallback(async (activityId: string) => {
    try {
      await socialService.removeReactionFromActivity(activityId);
      
      // 로컬 상태 업데이트
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, likes_count: Math.max(0, activity.likes_count - 1) }
            : activity
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '반응 제거에 실패했습니다.');
      return false;
    }
  }, []);

  const fetchComments = useCallback(async (activityId: string) => {
    try {
      const data = await socialService.getActivityComments(activityId);
      setComments(prev => ({ ...prev, [activityId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글을 불러오는데 실패했습니다.');
    }
  }, []);

  const addComment = useCallback(async (
    activityId: string, 
    content: string, 
    parentCommentId?: string
  ) => {
    try {
      const newComment = await socialService.commentOnActivity(activityId, content, parentCommentId);
      
      // 로컬 상태 업데이트
      setComments(prev => ({
        ...prev,
        [activityId]: [...(prev[activityId] || []), newComment]
      }));
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, comments_count: activity.comments_count + 1 }
            : activity
        )
      );
      
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 추가에 실패했습니다.');
      return null;
    }
  }, []);

  useEffect(() => {
    fetchActivityFeed();
  }, [fetchActivityFeed]);

  return {
    activities,
    comments,
    loading,
    error,
    hasMore,
    fetchActivityFeed,
    loadMoreActivities,
    reactToActivity,
    removeReaction,
    fetchComments,
    addComment
  };
};

// 알림 시스템 훅
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (limit = 20, unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getNotifications(limit, unreadOnly);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      // 개발 모드에서만 경고 메시지 출력
      if (process.env.NODE_ENV === 'development') {
        console.warn('User not authenticated, skipping unread count fetch');
      }
      return;
    }
    
    try {
      const count = await socialService.getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('읽지 않은 알림 개수 조회 실패:', err);
    }
  }, [user?.id]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await socialService.getNotificationSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림 설정을 불러오는데 실패했습니다.');
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await socialService.markNotificationAsRead(notificationId);
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      await fetchUnreadCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림 읽음 처리에 실패했습니다.');
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await socialService.markAllNotificationsAsRead();
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '모든 알림 읽음 처리에 실패했습니다.');
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const data = await socialService.updateNotificationSettings(newSettings);
      setSettings(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림 설정 업데이트에 실패했습니다.');
      return false;
    }
  }, []);

  // 주기적으로 읽지 않은 알림 개수 확인 (5분마다)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, [fetchNotifications, fetchSettings]);

  return {
    notifications,
    unreadCount,
    settings,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    fetchSettings,
    markAsRead,
    markAllAsRead,
    updateSettings
  };
};

// 소셜 통계 훅
export const useSocialStats = () => {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // 각 통계를 병렬로 조회
      const [
        friendsData,
        followingData,
        followersData,
        sharedGoalsData,
        // 그룹 도전과제 데이터는 추후 구현
      ] = await Promise.all([
        socialService.getFriends(userId),
        socialService.getFollowing(userId),
        socialService.getFollowers(userId),
        socialService.getSharedGoals(undefined, userId),
      ]);

      const socialStats: SocialStats = {
        following_count: followingData.length,
        followers_count: followersData.length,
        friends_count: friendsData.length,
        shared_goals_count: sharedGoalsData.length,
        group_challenges_created: 0, // 추후 구현
        group_challenges_joined: 0, // 추후 구현
        activity_likes_received: 0, // 추후 구현
        activity_comments_received: 0, // 추후 구현
      };

      setStats(socialStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '소셜 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};