import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 로딩 중일 때 스피너 표시
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          로그인 상태를 확인하는 중...
        </Typography>
      </Box>
    );
  }

  // 로그인되지 않은 사용자는 로그인 페이지로 리디렉션
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 로그인된 사용자는 컨텐츠 표시
  return <>{children}</>;
};

export default ProtectedRoute;