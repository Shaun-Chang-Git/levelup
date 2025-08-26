import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { GoalTemplate, Category } from '../../types';
import { useTemplates } from '../../hooks/useTemplates';

interface TemplateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GoalTemplate) => void;
  categories: Category[];
}

type TabValue = 'popular' | 'latest' | 'favorites' | 'search';

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  open,
  onClose,
  onSelectTemplate,
  categories,
}) => {
  const {
    templates,
    popularTemplates,
    favoriteTemplates,
    loading,
    error,
    loadTemplates,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearError,
  } = useTemplates();

  const [currentTab, setCurrentTab] = useState<TabValue>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>({});

  // 즐겨찾기 상태 로드
  useEffect(() => {
    const loadFavoriteStates = async () => {
      const allTemplates = [...popularTemplates, ...templates, ...favoriteTemplates];
      const states: Record<string, boolean> = {};
      
      for (const template of allTemplates) {
        states[template.id] = await isFavorite(template.id);
      }
      
      setFavoriteStates(states);
    };

    if (open) {
      loadFavoriteStates();
    }
  }, [open, popularTemplates, templates, favoriteTemplates, isFavorite]);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
    
    if (newValue === 'search') {
      handleSearch();
    }
  };

  // 검색 실행
  const handleSearch = async () => {
    const searchOptions = {
      search_query: searchQuery || undefined,
      category_id: selectedCategory || undefined,
      difficulty: selectedDifficulty || undefined,
      sort_by: 'usage_count' as const,
      sort_order: 'desc' as const,
    };

    await loadTemplates(searchOptions);
  };

  // 즐겨찾기 토글
  const handleToggleFavorite = async (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const isCurrentlyFavorite = favoriteStates[templateId];
      
      if (isCurrentlyFavorite) {
        await removeFromFavorites(templateId);
      } else {
        await addToFavorites(templateId);
      }
      
      // 상태 즉시 업데이트
      setFavoriteStates(prev => ({
        ...prev,
        [templateId]: !isCurrentlyFavorite,
      }));
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
    }
  };

  // 템플릿 선택
  const handleSelectTemplate = (template: GoalTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  // 현재 탭에 맞는 템플릿 목록 가져오기
  const getCurrentTemplates = (): GoalTemplate[] => {
    switch (currentTab) {
      case 'popular':
        return popularTemplates;
      case 'latest':
        return popularTemplates; // 최신 템플릿은 인기 템플릿과 동일하게 표시
      case 'favorites':
        return favoriteTemplates;
      case 'search':
        return templates;
      default:
        return [];
    }
  };

  // 난이도별 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#2196F3';
    }
  };

  // 난이도별 한글 텍스트
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      case 'expert': return '전문가';
      default: return difficulty;
    }
  };

  const currentTemplates = getCurrentTemplates();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">목표 템플릿 선택</Typography>
          <Typography variant="body2" color="text.secondary">
            미리 만들어진 템플릿으로 빠르게 목표를 설정하세요
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 탭 메뉴 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              icon={<TrendingUpIcon />} 
              label="인기 템플릿" 
              value="popular" 
              iconPosition="start"
            />
            <Tab 
              icon={<ScheduleIcon />} 
              label="최신 템플릿" 
              value="latest" 
              iconPosition="start"
            />
            <Tab 
              icon={<FavoriteIcon />} 
              label="즐겨찾기" 
              value="favorites" 
              iconPosition="start"
            />
            <Tab 
              icon={<SearchIcon />} 
              label="검색" 
              value="search" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 검색 탭의 필터들 */}
        {currentTab === 'search' && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="템플릿 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="카테고리"
                  >
                    <MenuItem value="">전체</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>난이도</InputLabel>
                  <Select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    label="난이도"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="easy">쉬움</MenuItem>
                    <MenuItem value="medium">보통</MenuItem>
                    <MenuItem value="hard">어려움</MenuItem>
                    <MenuItem value="expert">전문가</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1}>
                <Button variant="contained" onClick={handleSearch} disabled={loading}>
                  검색
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 템플릿 목록 */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>로딩 중...</Typography>
          </Box>
        ) : currentTemplates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {currentTab === 'favorites' ? '즐겨찾기한 템플릿이 없습니다' : '템플릿이 없습니다'}
            </Typography>
            <Typography color="text.secondary">
              {currentTab === 'search' ? '다른 검색어를 시도해보세요' : ''}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {currentTemplates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardContent sx={{ flex: 1 }}>
                    {/* 제목과 즐겨찾기 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                        {template.title}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleToggleFavorite(template.id, e)}
                      >
                        {favoriteStates[template.id] ? (
                          <StarIcon color="warning" />
                        ) : (
                          <StarBorderIcon />
                        )}
                      </IconButton>
                    </Box>

                    {/* 설명 */}
                    {template.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                    )}

                    {/* 카테고리와 난이도 */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {template.categories && (
                        <Chip
                          label={template.categories.name}
                          size="small"
                          sx={{ 
                            backgroundColor: template.categories.color + '20', 
                            color: template.categories.color 
                          }}
                        />
                      )}
                      <Chip
                        label={getDifficultyText(template.difficulty)}
                        size="small"
                        sx={{ 
                          backgroundColor: getDifficultyColor(template.difficulty) + '20', 
                          color: getDifficultyColor(template.difficulty) 
                        }}
                      />
                    </Box>

                    {/* 목표 정보 */}
                    <Box sx={{ mb: 1 }}>
                      {template.target_value && (
                        <Typography variant="body2" color="text.secondary">
                          📊 목표: {template.target_value} {template.unit}
                        </Typography>
                      )}
                      {template.duration_days && (
                        <Typography variant="body2" color="text.secondary">
                          ⏰ 기간: {template.duration_days}일
                        </Typography>
                      )}
                    </Box>

                    {/* 태그들 */}
                    {template.tags && template.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {template.tags.slice(0, 3).map((tag, index) => (
                          <Chip
                            key={index}
                            label={`#${tag}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        ))}
                        {template.tags.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{template.tags.length - 3}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      🔥 {template.usage_count}명이 사용
                    </Typography>
                    <Button size="small" variant="contained">
                      선택하기
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>취소</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelectionModal;