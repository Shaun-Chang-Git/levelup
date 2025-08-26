import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Fab,
  Badge,
  IconButton
} from '@mui/material';
import {
  People,
  Public,
  Notifications,
  Search,
  Add,
  NotificationsActive
} from '@mui/icons-material';
import { useFriends, useActivityFeed, useNotifications } from '../hooks/useSocial';
import FriendCard from '../components/social/FriendCard';
import ActivityFeedCard from '../components/social/ActivityFeedCard';
import type { UserSearchResult, FollowStatus } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-tabpanel-${index}`}
      aria-labelledby={`social-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SocialPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [followStatuses, setFollowStatuses] = useState<{ [key: string]: FollowStatus }>({});
  const [searchLoading, setSearchLoading] = useState(false);

  const {
    friends,
    following,
    followers,
    loading: friendsLoading,
    error: friendsError,
    followUser,
    unfollowUser,
    getFollowStatus,
    searchUsers
  } = useFriends();

  const {
    activities,
    comments,
    loading: feedLoading,
    error: feedError,
    hasMore,
    loadMoreActivities,
    reactToActivity,
    removeReaction,
    fetchComments,
    addComment
  } = useActivityFeed();

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await searchUsers(query);
      setSearchResults(results);

      // 검색 결과에 대한 팔로우 상태 확인
      const statuses: { [key: string]: FollowStatus } = {};
      for (const user of results) {
        const status = await getFollowStatus(user.id);
        statuses[user.id] = status;
      }
      setFollowStatuses(statuses);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    const success = await followUser(userId);
    if (success) {
      // 검색 결과 팔로우 상태 업데이트
      setFollowStatuses(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isFollowing: true }
      }));
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    const success = await unfollowUser(userId);
    if (success) {
      // 검색 결과 팔로우 상태 업데이트
      setFollowStatuses(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isFollowing: false, isMutual: false }
      }));
    }
  };

  const handleActivityReaction = async (activityId: string, reactionType: 'like' | 'love' | 'support' | 'celebrate' | 'wow' | 'motivate') => {
    await reactToActivity(activityId, reactionType);
  };

  const handleRemoveReaction = async (activityId: string) => {
    await removeReaction(activityId);
  };

  const handleAddComment = async (activityId: string, content: string, parentCommentId?: string) => {
    await addComment(activityId, content, parentCommentId);
  };

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // 검색어 변경 시 디바운스된 검색 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (friendsError || feedError || notificationsError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {friendsError || feedError || notificationsError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="소셜 탭">
            <Tab 
              icon={<Public />} 
              label="피드" 
              iconPosition="start"
            />
            <Tab 
              icon={<People />} 
              label="친구" 
              iconPosition="start"
            />
            <Tab 
              icon={
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              } 
              label="알림" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 피드 탭 */}
        <TabPanel value={currentTab} index={0}>
          <Typography variant="h5" gutterBottom>
            🌟 활동 피드
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            친구들의 최근 활동을 확인해보세요
          </Typography>

          {feedLoading && activities.length === 0 ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activities.map((activity) => (
                <ActivityFeedCard
                  key={activity.id}
                  activity={activity}
                  comments={comments[activity.id] || []}
                  onReact={(reactionType) => handleActivityReaction(activity.id, reactionType)}
                  onRemoveReaction={() => handleRemoveReaction(activity.id)}
                  onComment={(content, parentId) => handleAddComment(activity.id, content, parentId)}
                  canInteract={true}
                />
              ))}

              {hasMore && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Fab
                    color="primary"
                    onClick={loadMoreActivities}
                    disabled={feedLoading}
                  >
                    {feedLoading ? <CircularProgress size={24} /> : <Add />}
                  </Fab>
                </Box>
              )}

              {activities.length === 0 && !feedLoading && (
                <Box textAlign="center" py={8}>
                  <Typography variant="h6" color="text.secondary">
                    활동 피드가 비어있습니다
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    친구를 추가하여 그들의 활동을 확인해보세요!
                  </Typography>
                </Box>
              )}
            </>
          )}
        </TabPanel>

        {/* 친구 탭 */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h5" gutterBottom>
            👥 친구 관리
          </Typography>

          {/* 사용자 검색 */}
          <TextField
            fullWidth
            placeholder="사용자 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searchLoading ? <CircularProgress size={20} /> : <Search />}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                검색 결과
              </Typography>
              {searchResults.map((user) => (
                <FriendCard
                  key={user.id}
                  user={user}
                  followStatus={followStatuses[user.id]}
                  onFollow={() => handleFollowUser(user.id)}
                  onUnfollow={() => handleUnfollowUser(user.id)}
                  variant="search"
                />
              ))}
            </Box>
          )}

          {/* 친구 목록 */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              친구 ({friends.length})
            </Typography>
            {friendsLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : friends.length > 0 ? (
              friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  user={friend.friend_profile!}
                  onUnfollow={() => handleUnfollowUser(friend.following_id!)}
                  variant="friend"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                아직 친구가 없습니다. 위에서 사용자를 검색해보세요!
              </Typography>
            )}
          </Box>

          {/* 팔로잉 */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              팔로잉 ({following.length})
            </Typography>
            {following.length > 0 ? (
              following.map((follow) => (
                <FriendCard
                  key={follow.id}
                  user={follow.following_profile!}
                  onUnfollow={() => handleUnfollowUser(follow.following_id!)}
                  variant="following"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                팔로우한 사용자가 없습니다.
              </Typography>
            )}
          </Box>

          {/* 팔로워 */}
          <Box>
            <Typography variant="h6" gutterBottom>
              팔로워 ({followers.length})
            </Typography>
            {followers.length > 0 ? (
              followers.map((follower) => (
                <FriendCard
                  key={follower.id}
                  user={follower.follower_profile!}
                  followStatus={followStatuses[follower.follower_id!]}
                  onFollow={() => handleFollowUser(follower.follower_id!)}
                  variant="follower"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                팔로워가 없습니다.
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* 알림 탭 */}
        <TabPanel value={currentTab} index={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5">
              🔔 알림
            </Typography>
            {unreadCount > 0 && (
              <IconButton onClick={markAllAsRead} color="primary">
                <NotificationsActive />
              </IconButton>
            )}
          </Box>

          {notificationsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <Paper
                key={notification.id}
                sx={{
                  p: 2,
                  mb: 1,
                  bgcolor: notification.is_read ? 'background.paper' : 'primary.light',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 2 }
                }}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <Box display="flex" alignItems="flex-start" gap={2}>
                  {notification.related_user?.avatar_url ? (
                    <Avatar src={notification.related_user.avatar_url} />
                  ) : (
                    <Avatar>
                      {notification.related_user?.display_name?.[0]?.toUpperCase() || '📢'}
                    </Avatar>
                  )}
                  <Box flex={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  {!notification.is_read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: 'primary.main',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                </Box>
              </Paper>
            ))
          ) : (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary">
                알림이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                새로운 알림이 도착하면 여기에 표시됩니다.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SocialPage;