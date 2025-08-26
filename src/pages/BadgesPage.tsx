import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  EmojiEvents as AllBadgesIcon,
  Star as MyBadgesIcon,
  Filter as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useChallenges } from '../hooks/useChallenges';
import BadgeCard from '../components/badges/BadgeCard';
import { Badge, UserBadge } from '../types';

type TabValue = 'all' | 'my';
type FilterTier = 'all' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type FilterRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
type SortBy = 'name' | 'tier' | 'rarity' | 'earned_date';

const BadgesPage: React.FC = () => {
  const {
    badges,
    userBadges,
    loading,
    error,
    toggleActiveBadge,
    clearError
  } = useChallenges();

  const [currentTab, setCurrentTab] = useState<TabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [sortBy, setSortBy] = useState<SortBy>('tier');

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  // 배지 활성화 토글 핸들러
  const handleToggleActiveBadge = async (badgeId: string, isActive: boolean) => {
    try {
      await toggleActiveBadge(badgeId, isActive);
    } catch (error) {
      console.error('배지 설정 실패:', error);
    }
  };

  // 배지 필터링 및 정렬
  const getFilteredAndSortedBadges = () => {
    let filteredBadges: (Badge & { userBadge?: UserBadge })[] = [];

    if (currentTab === 'all') {
      // 모든 배지 + 사용자 소유 정보
      filteredBadges = badges.map(badge => ({
        ...badge,
        userBadge: userBadges.find(ub => ub.badge_id === badge.id)
      }));
    } else {
      // 사용자가 소유한 배지만
      filteredBadges = userBadges
        .map(ub => ({
          ...ub.badges!,
          userBadge: ub
        }))
        .filter(item => item.id); // badges가 없는 경우 필터링
    }

    // 검색 필터
    if (searchQuery) {
      filteredBadges = filteredBadges.filter(badge =>
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 티어 필터
    if (filterTier !== 'all') {
      filteredBadges = filteredBadges.filter(badge => badge.tier === filterTier);
    }

    // 희귀도 필터
    if (filterRarity !== 'all') {
      filteredBadges = filteredBadges.filter(badge => badge.rarity === filterRarity);
    }

    // 정렬
    filteredBadges.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'tier':
          const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
          return tierOrder[a.tier] - tierOrder[b.tier];
        case 'rarity':
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        case 'earned_date':
          if (currentTab === 'my') {
            const dateA = a.userBadge?.earned_at ? new Date(a.userBadge.earned_at).getTime() : 0;
            const dateB = b.userBadge?.earned_at ? new Date(b.userBadge.earned_at).getTime() : 0;
            return dateB - dateA; // 최신순
          }
          return 0;
        default:
          return 0;
      }
    });

    return filteredBadges;
  };

  const filteredBadges = getFilteredAndSortedBadges();

  // 통계 정보
  const ownedBadgesCount = userBadges.length;
  const totalBadgesCount = badges.length;
  const completionRate = totalBadgesCount > 0 ? (ownedBadgesCount / totalBadgesCount) * 100 : 0;

  const tierStats = {
    bronze: userBadges.filter(ub => ub.badges?.tier === 'bronze').length,
    silver: userBadges.filter(ub => ub.badges?.tier === 'silver').length,
    gold: userBadges.filter(ub => ub.badges?.tier === 'gold').length,
    platinum: userBadges.filter(ub => ub.badges?.tier === 'platinum').length,
    diamond: userBadges.filter(ub => ub.badges?.tier === 'diamond').length,
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          배지 컬렉션
        </Typography>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                수집 현황
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h3" color="primary">
                  {ownedBadgesCount}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  / {totalBadgesCount}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                전체 배지의 {completionRate.toFixed(1)}% 수집 완료
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                티어별 현황
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(tierStats).map(([tier, count]) => (
                  <Grid item xs key={tier}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 메뉴 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            icon={<AllBadgesIcon />} 
            label={`모든 배지 (${totalBadgesCount})`} 
            value="all" 
            iconPosition="start"
          />
          <Tab 
            icon={<MyBadgesIcon />} 
            label={`내 배지 (${ownedBadgesCount})`} 
            value="my" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 필터 및 검색 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="배지 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>티어 필터</InputLabel>
            <Select
              value={filterTier}
              label="티어 필터"
              onChange={(e) => setFilterTier(e.target.value as FilterTier)}
            >
              <MenuItem value="all">모든 티어</MenuItem>
              <MenuItem value="bronze">브론즈</MenuItem>
              <MenuItem value="silver">실버</MenuItem>
              <MenuItem value="gold">골드</MenuItem>
              <MenuItem value="platinum">플래티넘</MenuItem>
              <MenuItem value="diamond">다이아몬드</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>희귀도 필터</InputLabel>
            <Select
              value={filterRarity}
              label="희귀도 필터"
              onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
            >
              <MenuItem value="all">모든 희귀도</MenuItem>
              <MenuItem value="common">일반</MenuItem>
              <MenuItem value="rare">희귀</MenuItem>
              <MenuItem value="epic">영웅</MenuItem>
              <MenuItem value="legendary">전설</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>정렬</InputLabel>
            <Select
              value={sortBy}
              label="정렬"
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <MenuItem value="tier">티어순</MenuItem>
              <MenuItem value="rarity">희귀도순</MenuItem>
              <MenuItem value="name">이름순</MenuItem>
              {currentTab === 'my' && (
                <MenuItem value="earned_date">획득일순</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 배지 목록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>로딩 중...</Typography>
        </Box>
      ) : filteredBadges.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {currentTab === 'my' 
              ? '아직 획득한 배지가 없습니다' 
              : '조건에 맞는 배지가 없습니다'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {currentTab === 'my' 
              ? '도전과제를 완료하여 배지를 획득해보세요!' 
              : '다른 조건으로 검색해보세요.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredBadges.map((badge) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
              <BadgeCard
                badge={badge}
                userBadge={badge.userBadge}
                onToggleActive={handleToggleActiveBadge}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default BadgesPage;