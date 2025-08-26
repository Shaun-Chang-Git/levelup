import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  Box,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  TrendingFlat as NoChangeIcon,
  EmojiEvents as TrophyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { LeaderboardEntry, Leaderboard } from '../../types';

interface LeaderboardTableProps {
  leaderboard: Leaderboard;
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onViewUser?: (userId: string) => void;
  loading?: boolean;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboard,
  entries,
  currentUserId,
  onViewUser,
  loading = false
}) => {
  // 순위별 색상 및 아이콘
  const getRankStyle = (position: number) => {
    switch (position) {
      case 1:
        return {
          color: '#FFD700',
          icon: '🥇',
          backgroundColor: 'rgba(255, 215, 0, 0.1)'
        };
      case 2:
        return {
          color: '#C0C0C0',
          icon: '🥈',
          backgroundColor: 'rgba(192, 192, 192, 0.1)'
        };
      case 3:
        return {
          color: '#CD7F32',
          icon: '🥉',
          backgroundColor: 'rgba(205, 127, 50, 0.1)'
        };
      default:
        return {
          color: '#666',
          icon: position.toString(),
          backgroundColor: 'transparent'
        };
    }
  };

  // 변화량 아이콘
  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <UpIcon sx={{ color: '#4CAF50', fontSize: '1rem' }} />;
    } else if (change < 0) {
      return <DownIcon sx={{ color: '#F44336', fontSize: '1rem' }} />;
    } else {
      return <NoChangeIcon sx={{ color: '#757575', fontSize: '1rem' }} />;
    }
  };

  // 변화량 텍스트
  const getRankChangeText = (change: number) => {
    if (change > 0) {
      return `+${change}`;
    } else if (change < 0) {
      return change.toString();
    } else {
      return '0';
    }
  };

  // 점수 포맷팅
  const formatScore = (score: number, type: Leaderboard['type']) => {
    switch (type) {
      case 'total_points':
      case 'weekly_points':
      case 'monthly_points':
        return score.toLocaleString() + ' 포인트';
      case 'level_ranking':
        return '레벨 ' + score;
      case 'goal_completions':
        return score + '개 완료';
      case 'streak_days':
        return score + '일 연속';
      case 'challenge_completions':
        return score + '개 완료';
      default:
        return score.toString();
    }
  };

  // 사용자 이름 표시
  const getUserDisplayName = (entry: LeaderboardEntry) => {
    return entry.user_profiles?.display_name || `사용자 ${entry.user_id.slice(0, 8)}`;
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            <TableCell width="80px">
              <Typography variant="subtitle2" fontWeight="bold">
                순위
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="bold">
                사용자
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                점수
              </Typography>
            </TableCell>
            <TableCell align="center" width="100px">
              <Typography variant="subtitle2" fontWeight="bold">
                변화
              </Typography>
            </TableCell>
            <TableCell align="center" width="80px">
              <Typography variant="subtitle2" fontWeight="bold">
                액션
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">로딩 중...</Typography>
              </TableCell>
            </TableRow>
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">순위 데이터가 없습니다</Typography>
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, index) => {
              const rankStyle = getRankStyle(entry.rank_position);
              const isCurrentUser = entry.user_id === currentUserId;
              
              return (
                <TableRow
                  key={entry.id}
                  sx={{
                    backgroundColor: isCurrentUser 
                      ? 'primary.light' 
                      : rankStyle.backgroundColor,
                    '&:hover': {
                      backgroundColor: isCurrentUser 
                        ? 'primary.light' 
                        : 'grey.50',
                    },
                    ...(isCurrentUser && {
                      border: 2,
                      borderColor: 'primary.main',
                    })
                  }}
                >
                  {/* 순위 */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: rankStyle.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: entry.rank_position <= 3 ? '1.2rem' : '0.9rem',
                          fontWeight: 'bold',
                          color: entry.rank_position <= 3 ? 'white' : 'white',
                        }}
                      >
                        {entry.rank_position <= 3 ? rankStyle.icon : entry.rank_position}
                      </Box>
                      {isCurrentUser && (
                        <Chip
                          label="나"
                          size="small"
                          color="primary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* 사용자 정보 */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={entry.user_profiles?.avatar_url}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: isCurrentUser ? 'primary.main' : 'grey.400'
                        }}
                      >
                        {getUserDisplayName(entry)[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={isCurrentUser ? "bold" : "normal"}>
                          {getUserDisplayName(entry)}
                        </Typography>
                        {entry.user_profiles?.level && (
                          <Typography variant="caption" color="text.secondary">
                            레벨 {entry.user_profiles.level}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* 점수 */}
                  <TableCell align="right">
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      color={entry.rank_position <= 3 ? rankStyle.color : 'text.primary'}
                    >
                      {formatScore(entry.score, leaderboard.type)}
                    </Typography>
                  </TableCell>

                  {/* 순위 변화 */}
                  <TableCell align="center">
                    {entry.previous_rank ? (
                      <Tooltip title={`이전 순위: ${entry.previous_rank}위`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getRankChangeIcon(entry.rank_change)}
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={
                              entry.rank_change > 0 ? '#4CAF50' :
                              entry.rank_change < 0 ? '#F44336' :
                              'text.secondary'
                            }
                          >
                            {getRankChangeText(entry.rank_change)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        신규
                      </Typography>
                    )}
                  </TableCell>

                  {/* 액션 */}
                  <TableCell align="center">
                    <Tooltip title="프로필 보기">
                      <IconButton
                        size="small"
                        onClick={() => onViewUser?.(entry.user_id)}
                        disabled={!onViewUser}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* 리더보드 정보 */}
      <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          마지막 업데이트: {new Date(leaderboard.updated_at).toLocaleString('ko-KR')}
        </Typography>
      </Box>
    </TableContainer>
  );
};

export default LeaderboardTable;