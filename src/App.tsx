import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider as CustomThemeProvider, useThemeMode } from './contexts/ThemeContext';
import { createAppTheme } from './styles/theme';
import { useResponsive } from './hooks/useResponsive';
import Header from './components/layout/Header';
import BottomNavigation, { BottomNavigationSpacer } from './components/layout/BottomNavigation';
import PWAManager from './components/pwa/PWAManager';
import SkipNavigation, { MainContent, NavigationContent } from './components/accessibility/SkipNavigation';
import {
  SuspenseWrapper,
  LazyDashboardPage,
  LazyGoalsPage,
  LazyHabitsPage,
  LazyAchievementsPage,
  LazyChallengesPage,
  LazyBadgesPage,
  LazyLeaderboardPage,
  LazySocialPage,
  preloadRouteComponents,
} from './components/performance/LazyComponents';

// 중요한 페이지들은 즉시 로드
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { GoalsV2Page } from './pages/GoalsV2Page';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

// 앱 레이아웃 컴포넌트
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const location = useLocation();
  
  const showBottomNav = Boolean(user && isMobile);
  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SkipNavigation />
      <NavigationContent>
        <Header />
      </NavigationContent>
      <MainContent>
        <Box 
          sx={{ 
            flexGrow: 1,
            pt: isPublicPage ? 0 : { xs: 1, sm: 2 },
            pb: showBottomNav ? 1 : 0,
          }}
        >
          {children}
          <BottomNavigationSpacer show={showBottomNav} />
        </Box>
      </MainContent>
      <BottomNavigation show={showBottomNav} />
      <PWAManager />
    </Box>
  );
};

// 테마 적용 컴포넌트
const ThemedApp: React.FC = () => {
  const { mode } = useThemeMode();
  const theme = createAppTheme(mode);
  
  // 성능 모니터링 및 라우트 프리로딩 초기화
  React.useEffect(() => {
    // 성능 모니터링 시작
    import('./utils/performance').then(({ startPerformanceMonitoring }) => {
      startPerformanceMonitoring();
    });
    
    // 라우트 컴포넌트 프리로딩
    preloadRouteComponents();
    
    // 개발 모드에서 UX 검증 실행
    if (process.env.NODE_ENV === 'development') {
      import('./utils/uxValidation').then(({ runUXValidationInDev }) => {
        runUXValidationInDev();
      });
    }
  }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppLayout>
              <Routes>
                {/* 공개 라우트 */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                
                {/* 보호된 라우트 */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyDashboardPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/goals" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyGoalsPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/goals-v2" 
                  element={
                    <ProtectedRoute>
                      <GoalsV2Page />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/habits" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyHabitsPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/achievements" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyAchievementsPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/challenges" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyChallengesPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/badges" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyBadgesPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leaderboard" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazyLeaderboardPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/social" 
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <LazySocialPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  } 
                />
                
                {/* 기본 리디렉션 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <CustomThemeProvider>
      <ThemedApp />
    </CustomThemeProvider>
  );
}

export default App;