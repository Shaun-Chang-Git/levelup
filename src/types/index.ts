// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  level: number;
  experience: number;
  createdAt: string;
  updatedAt: string;
}

// 사용자 프로필 타입 (v2.0 user_profiles 테이블)
export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  total_points: number;
  current_level: number;
  created_at: string;
  updated_at: string;
}

// 카테고리 관련 타입 (v2.0 호환)
export interface Category {
  id: number; // v2.0에서 SERIAL PRIMARY KEY
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean; // v2.0 추가 필드
  createdAt?: string; // v2.0에서 생성일 없음
  updatedAt?: string; // v2.0에서 수정일 없음
}

// 목표 관련 타입 (v2.0 호환)
export interface Goal {
  id: string;
  user_id: string;
  category_id: number; // v2.0에서 INTEGER로 변경
  title: string;
  description?: string;
  target_value?: number; // v2.0에서 nullable
  current_value: number;
  unit?: string; // v2.0에서 제거됨
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  target_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  reward_points: number;
  streak_count?: number; // v2.0에서 제거됨
  
  // 반복 목표 관련 필드
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: number[]; // 요일 또는 일자 배열
  recurrence_interval?: number; // 간격 (매 N일/주/월)
  habit_streak?: number; // 현재 연속 달성 일수
  longest_streak?: number; // 최고 연속 달성 일수  
  last_completed_date?: string; // 마지막 완료 날짜
  next_due_date?: string; // 다음 수행 예정 날짜
  
  // Join된 관련 데이터
  categories?: Category;
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum GoalDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

// 목표 진행상황 관련 타입
export interface GoalProgress {
  id: string;
  goalId: string;
  userId: string;
  progressValue: number;
  note?: string;
  createdAt: string;
}

// 업적 관련 타입
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  experienceReward: number;
  rarity: AchievementRarity;
  createdAt: string;
}

export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

// 사용자 업적 관련 타입
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// 통계 관련 타입
export interface Statistics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  totalExperience: number;
  currentLevel: number;
  categoriesStats: CategoryStats[];
  recentActivity: Goal[];
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
}

// 목표 템플릿 관련 타입
export interface GoalTemplate {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  target_value?: number;
  unit?: string;
  duration_days?: number;
  tags?: string[];
  is_public: boolean;
  creator_id?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
  categories?: Category; // Join된 카테고리 정보
}

// 템플릿 검색/필터 옵션
export interface TemplateSearchOptions {
  category_id?: string;
  difficulty?: string;
  tags?: string[];
  search_query?: string;
  sort_by?: 'usage_count' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

// 습관 완료 기록 타입
export interface HabitCompletion {
  id: string;
  goal_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
  notes?: string;
  completion_value: number;
  streak_day: number;
}

// 습관 통계 타입
export interface HabitStatistics {
  id: string;
  goal_id: string;
  user_id: string;
  week_start_date: string;
  month_start_date: string;
  completed_days: number;
  total_possible_days: number;
  completion_rate: number;
  current_streak: number;
  created_at: string;
  updated_at: string;
}

// 습관 리마인더 타입
export interface HabitReminder {
  id: string;
  goal_id: string;
  user_id: string;
  reminder_time: string;
  days_of_week?: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 반복 목표 생성 옵션
export interface RecurringGoalOptions {
  is_recurring: boolean;
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: number[];
  recurrence_interval?: number;
}

// 습관 완료 결과 타입
export interface HabitCompletionResult {
  success: boolean;
  points_earned: number;
  current_streak: number;
  is_streak_milestone: boolean;
  completion_date: string;
}

// 도전과제 관련 타입
export interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal';
  category_id?: string;
  target_type: 'goal_completion' | 'habit_streak' | 'points_earned' | 'level_reached' | 
              'category_goals' | 'consecutive_days' | 'total_goals' | 'difficulty_goals';
  target_value: number;
  target_condition?: Record<string, any>;
  reward_points: number;
  reward_badge_id?: string;
  reward_title?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  status: 'draft' | 'active' | 'ended' | 'archived';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  is_featured: boolean;
  max_participants?: number;
  icon_emoji: string;
  background_color: string;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

// 사용자 도전과제 참여 타입
export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  current_progress: number;
  target_progress: number;
  progress_percentage: number;
  started_at: string;
  deadline?: string;
  completed_at?: string;
  reward_claimed: boolean;
  reward_claimed_at?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  challenges?: Challenge;
}

// 배지 타입
export interface Badge {
  id: string;
  name: string;
  description?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  unlock_type: 'goal_count' | 'streak_days' | 'points_total' | 'level_reached' | 
               'category_master' | 'challenge_winner' | 'special_event' | 'manual';
  unlock_condition: Record<string, any>;
  icon_emoji: string;
  color: string;
  bonus_points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 사용자 배지 소유 타입
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  earned_through?: string;
  earned_from_id?: string;
  is_active: boolean;
  display_order: number;
  notes?: string;
  created_at: string;
  badges?: Badge;
}

// 도전과제 완료 이력 타입
export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  user_challenge_id: string;
  completed_at: string;
  completion_time_days: number;
  final_progress: number;
  completion_rank?: number;
  total_participants?: number;
  points_earned: number;
  badge_earned?: string;
  created_at: string;
}

// 리더보드 타입
export interface Leaderboard {
  id: string;
  name: string;
  description?: string;
  type: 'total_points' | 'level_ranking' | 'goal_completions' | 'streak_days' |
        'challenge_completions' | 'category_points' | 'weekly_points' | 'monthly_points';
  category_id?: string;
  time_period?: 'all_time' | 'yearly' | 'monthly' | 'weekly' | 'daily';
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  max_entries: number;
  update_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  icon_emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// 리더보드 엔트리 타입
export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank_position: number;
  score: number;
  previous_rank?: number;
  rank_change: number;
  additional_stats?: Record<string, any>;
  last_updated: string;
  user_profiles?: {
    display_name?: string;
    avatar_url?: string;
    level: number;
  };
}

// 도전과제 참여 옵션 타입
export interface ChallengeJoinOptions {
  auto_join_daily?: boolean;
  auto_join_weekly?: boolean;
  notifications_enabled?: boolean;
}

// 도전과제 진행률 업데이트 결과 타입
export interface ChallengeProgressResult {
  success: boolean;
  current_progress: number;
  target_progress: number;
  completed: boolean;
  points_earned?: number;
  badge_earned?: Badge;
}

// 배지 획득 결과 타입
export interface BadgeEarnedResult {
  badges_earned: Badge[];
  total_bonus_points: number;
}

// 도전과제 통계 타입
export interface ChallengeStats {
  total_challenges: number;
  active_challenges: number;
  completed_challenges: number;
  failed_challenges: number;
  completion_rate: number;
  total_points_from_challenges: number;
  badges_earned_from_challenges: number;
  current_rank_in_leaderboards: LeaderboardEntry[];
}

// ==========================================
// 소셜 기능 관련 타입들
// ==========================================

// 사용자 팔로우 관계 타입
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'active' | 'blocked' | 'muted';
  is_mutual: boolean;
  created_at: string;
  updated_at: string;
  follower_profile?: UserProfile;
  following_profile?: UserProfile;
  friend_profile?: UserProfile;
}

// 사용자 프로필 정보 (소셜 기능용)
export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  level: number;
  total_points: number;
}

// 팔로우 상태 타입
export interface FollowStatus {
  isFollowing: boolean;
  isFollower: boolean;
  isMutual: boolean;
}

// 목표 공유 설정 타입
export interface GoalShare {
  id: string;
  goal_id: string;
  user_id: string;
  share_type: 'public' | 'friends' | 'followers' | 'private';
  allow_comments: boolean;
  allow_reactions: boolean;
  show_progress: boolean;
  share_message?: string;
  shared_at: string;
  updated_at: string;
  goal?: Goal;
  user_profile?: UserProfile;
}

// 목표 공유 옵션 타입
export interface GoalShareOptions {
  allowComments?: boolean;
  allowReactions?: boolean;
  showProgress?: boolean;
  shareMessage?: string;
}

// 그룹 도전과제 타입
export interface GroupChallenge {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  max_members: number;
  join_type: 'open' | 'invite_only' | 'request';
  base_challenge_id?: string;
  target_type: string;
  target_value: number;
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  reward_points: number;
  winner_reward_multiplier: number;
  icon_emoji: string;
  background_color: string;
  created_at: string;
  updated_at: string;
  creator_profile?: UserProfile;
  members_count?: number;
}

// 그룹 도전과제 멤버 타입
export interface GroupChallengeMember {
  id: string;
  group_challenge_id: string;
  user_id: string;
  status: 'pending' | 'active' | 'completed' | 'left' | 'kicked';
  current_progress: number;
  target_progress: number;
  progress_percentage: number;
  current_rank?: number;
  final_rank?: number;
  joined_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  member_profile?: UserProfile;
  group_challenge?: GroupChallenge;
}

// 그룹 도전과제 생성 데이터 타입
export interface GroupChallengeCreateData {
  title: string;
  description: string;
  targetType: string;
  targetValue: number;
  maxMembers?: number;
  joinType?: 'open' | 'invite_only' | 'request';
  endDate?: string;
  rewardPoints?: number;
  baseChallengeId?: string;
}

// 활동 피드 타입
export interface ActivityFeed {
  id: string;
  user_id: string;
  activity_type: 'goal_created' | 'goal_completed' | 'goal_shared' | 'habit_streak' |
                  'challenge_joined' | 'challenge_completed' | 'badge_earned' | 'level_up' |
                  'friend_added' | 'group_challenge_created' | 'group_challenge_won';
  title: string;
  description?: string;
  related_goal_id?: string;
  related_challenge_id?: string;
  related_group_challenge_id?: string;
  related_badge_id?: string;
  metadata?: Record<string, any>;
  visibility: 'public' | 'friends' | 'followers' | 'private';
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profile?: UserProfile;
  related_goal?: Goal;
  related_badge?: Badge;
  related_challenge?: Challenge;
}

// 활동 반응 타입
export interface ActivityReaction {
  id: string;
  activity_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'support' | 'celebrate' | 'wow' | 'motivate';
  created_at: string;
  user_profile?: UserProfile;
}

// 활동 댓글 타입
export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  replies?: ActivityComment[];
}

// 알림 타입
export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'goal_deadline' | 'habit_reminder' | 'challenge_invitation' |
        'group_challenge_update' | 'activity_reaction' | 'activity_comment' |
        'badge_earned' | 'level_up' | 'streak_milestone';
  title: string;
  message: string;
  related_user_id?: string;
  related_goal_id?: string;
  related_challenge_id?: string;
  related_activity_id?: string;
  is_read: boolean;
  is_pushed: boolean;
  scheduled_for?: string;
  created_at: string;
  read_at?: string;
  related_user?: UserProfile;
}

// 알림 설정 타입
export interface NotificationSettings {
  id: string;
  user_id: string;
  friend_requests: boolean;
  goal_deadlines: boolean;
  habit_reminders: boolean;
  challenge_invitations: boolean;
  activity_reactions: boolean;
  activity_comments: boolean;
  achievements: boolean;
  push_enabled: boolean;
  push_token?: string;
  email_enabled: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  created_at: string;
  updated_at: string;
}

// 사용자 검색 결과 타입
export interface UserSearchResult {
  id: string;
  display_name?: string;
  avatar_url?: string;
  level: number;
  total_points: number;
}

// 친구 목록 조회 결과 타입
export interface FriendListItem {
  id: string;
  following_id?: string;
  follower_id?: string;
  is_mutual: boolean;
  created_at: string;
  friend_profile?: UserProfile;
  following_profile?: UserProfile;
  follower_profile?: UserProfile;
}

// 소셜 통계 타입
export interface SocialStats {
  following_count: number;
  followers_count: number;
  friends_count: number;
  shared_goals_count: number;
  group_challenges_created: number;
  group_challenges_joined: number;
  activity_likes_received: number;
  activity_comments_received: number;
}

// 활동 피드 필터 옵션 타입
export interface ActivityFeedFilter {
  activity_type?: string[];
  visibility?: 'public' | 'friends' | 'followers';
  user_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}