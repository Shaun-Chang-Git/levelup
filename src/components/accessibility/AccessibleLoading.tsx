import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
} from '@mui/material';

interface AccessibleLoadingProps {
  /** 로딩 상태 */
  loading: boolean;
  /** 로딩 메시지 */
  message?: string;
  /** 진행률 (0-100) */
  progress?: number;
  /** 로딩 타입 */
  variant?: 'circular' | 'linear' | 'skeleton';
  /** 로딩 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 스켈레톤 라인 수 */
  lines?: number;
  /** 스켈레톤 높이 */
  height?: number;
  /** 전체 화면 로딩 여부 */
  fullScreen?: boolean;
  /** 자식 컴포넌트 */
  children?: React.ReactNode;
}

const AccessibleLoading: React.FC<AccessibleLoadingProps> = ({
  loading,
  message = '로딩 중...',
  progress,
  variant = 'circular',
  size = 'medium',
  lines = 3,
  height = 40,
  fullScreen = false,
  children,
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 40;
    }
  };

  const LoadingContent = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
              id="loading-description"
            >
              {message}
              {progress !== undefined && ` (${Math.round(progress)}%)`}
            </Typography>
            <LinearProgress
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
              aria-describedby="loading-description"
              aria-label={`진행률: ${progress !== undefined ? `${Math.round(progress)}%` : '진행 중'}`}
            />
          </Box>
        );

      case 'skeleton':
        return (
          <Box>
            {Array.from({ length: lines }).map((_, index) => (
              <Skeleton
                key={index}
                variant="text"
                height={height}
                sx={{ mb: 1 }}
                aria-label={`콘텐츠 로딩 중, ${index + 1}번째 항목`}
              />
            ))}
          </Box>
        );

      default: // circular
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress
              size={getSizeValue()}
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
              aria-label={`로딩 진행률: ${progress !== undefined ? `${Math.round(progress)}%` : '진행 중'}`}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              id="loading-message"
            >
              {message}
              {progress !== undefined && ` (${Math.round(progress)}%)`}
            </Typography>
          </Box>
        );
    }
  };

  if (!loading) {
    return <>{children}</>;
  }

  const loadingComponent = (
    <Box
      role="status"
      aria-live="polite"
      aria-label={message}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }),
        ...(variant === 'skeleton' && {
          width: '100%',
          alignItems: 'stretch',
          justifyContent: 'stretch',
        }),
      }}
    >
      <LoadingContent />
    </Box>
  );

  // 스켈레톤은 별도 처리
  if (variant === 'skeleton') {
    return loadingComponent;
  }

  // 전체 화면 로딩
  if (fullScreen) {
    return loadingComponent;
  }

  // 일반 로딩 (자식과 함께 표시)
  return (
    <Box sx={{ position: 'relative' }}>
      {children && (
        <Box
          sx={{
            opacity: loading ? 0.3 : 1,
            pointerEvents: loading ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
          }}
          aria-hidden={loading}
        >
          {children}
        </Box>
      )}
      {loading && (
        <Box
          sx={{
            position: children ? 'absolute' : 'static',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: children ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
            backdropFilter: children ? 'blur(2px)' : 'none',
            borderRadius: 1,
          }}
        >
          <LoadingContent />
        </Box>
      )}
    </Box>
  );
};

/**
 * 간단한 로딩 스피너 (접근성 포함)
 */
export const AccessibleSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  message?: string;
}> = ({ size = 'medium', message = '로딩 중...' }) => {
  return (
    <AccessibleLoading
      loading={true}
      variant="circular"
      size={size}
      message={message}
    />
  );
};

/**
 * 진행률 표시 로딩 (접근성 포함)
 */
export const AccessibleProgress: React.FC<{
  progress: number;
  message?: string;
  variant?: 'linear' | 'circular';
}> = ({ progress, message = '진행 중...', variant = 'linear' }) => {
  return (
    <AccessibleLoading
      loading={true}
      variant={variant}
      progress={progress}
      message={message}
    />
  );
};

/**
 * 스켈레톤 로딩 (접근성 포함)
 */
export const AccessibleSkeleton: React.FC<{
  lines?: number;
  height?: number;
}> = ({ lines = 3, height = 40 }) => {
  return (
    <AccessibleLoading
      loading={true}
      variant="skeleton"
      lines={lines}
      height={height}
    />
  );
};

export default AccessibleLoading;