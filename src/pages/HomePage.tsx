import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* 헤로 섹션 */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            LevelUp
          </Typography>
          <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
            게임처럼 재미있게 목표를 달성하세요 🎮
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            포인트를 모으고, 업적을 달성하며, 레벨업을 통해 성장하는 즐거움을 경험해보세요
          </Typography>
          
          {!user ? (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => navigate('/login')}
                sx={{ px: 4 }}
              >
                로그인
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/signup')}
                sx={{ px: 4 }}
              >
                회원가입
              </Button>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/dashboard')}
              sx={{ px: 4 }}
            >
              대시보드로 이동
            </Button>
          )}
        </Box>

        {/* 기능 소개 */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 2 }}>🎯</Typography>
                <Typography variant="h6" gutterBottom>
                  목표 관리
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  카테고리별로 목표를 설정하고 진행률을 추적하세요. 
                  학습, 건강, 취미 등 8개 카테고리로 체계적으로 관리할 수 있습니다.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 2 }}>🏆</Typography>
                <Typography variant="h6" gutterBottom>
                  업적 시스템
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  목표 달성 시 포인트를 획득하고 다양한 업적을 잠금 해제하세요. 
                  연속 달성, 카테고리별 전문가 등 16가지 업적이 기다립니다.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 2 }}>📈</Typography>
                <Typography variant="h6" gutterBottom>
                  레벨업 시스템
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  포인트를 모아 레벨을 올리고 성장을 시각적으로 확인하세요. 
                  게임처럼 재미있는 경험을 통해 동기부여를 받을 수 있습니다.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA 섹션 */}
        {!user && (
          <Box sx={{ textAlign: 'center', mt: 8, p: 4, backgroundColor: 'primary.main', borderRadius: 2, color: 'white' }}>
            <Typography variant="h4" gutterBottom>
              지금 시작해보세요!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              무료로 가입하고 첫 번째 목표를 설정해보세요
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/signup')}
              sx={{ 
                backgroundColor: 'white', 
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100'
                }
              }}
            >
              무료로 시작하기
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;