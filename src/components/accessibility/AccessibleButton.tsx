import React, { forwardRef } from 'react';
import {
  Button,
  IconButton,
  Fab,
  ButtonProps,
  IconButtonProps,
  FabProps,
  Tooltip,
  CircularProgress,
  Box,
} from '@mui/material';
import { isEnterOrSpace, announceToScreenReader } from '../../utils/accessibility';

interface AccessibleButtonBaseProps {
  /** 접근성 라벨 */
  ariaLabel?: string;
  /** 접근성 설명 */
  ariaDescribedBy?: string;
  /** 버튼이 눌린 상태인지 (토글 버튼용) */
  pressed?: boolean;
  /** 확장된 상태인지 (드롭다운 등) */
  expanded?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 메시지 */
  loadingMessage?: string;
  /** 성공 시 알림 메시지 */
  successMessage?: string;
  /** 실패 시 알림 메시지 */
  errorMessage?: string;
  /** 툴팁 텍스트 */
  tooltip?: string;
  /** 툴팁 위치 */
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  /** 키보드 이벤트 핸들러 */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** 클릭 이벤트 핸들러 */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void | Promise<void>;
}

interface AccessibleButtonProps extends Omit<ButtonProps, 'onClick'>, AccessibleButtonBaseProps {}

interface AccessibleIconButtonProps extends Omit<IconButtonProps, 'onClick'>, AccessibleButtonBaseProps {}

interface AccessibleFabProps extends Omit<FabProps, 'onClick'>, AccessibleButtonBaseProps {}

/**
 * 접근성이 향상된 일반 버튼
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  ariaLabel,
  ariaDescribedBy,
  pressed,
  expanded,
  loading = false,
  loadingMessage = '로딩 중...',
  successMessage,
  errorMessage,
  tooltip,
  tooltipPlacement = 'top',
  onKeyDown,
  onClick,
  children,
  disabled,
  ...props
}, ref) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    if (onClick) {
      setIsProcessing(true);
      try {
        await onClick(event);
        if (successMessage) {
          announceToScreenReader(successMessage, 'polite');
        }
      } catch (error) {
        if (errorMessage) {
          announceToScreenReader(errorMessage, 'assertive');
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(event);
    }
    
    // 스페이스바나 엔터 키로 버튼 활성화
    if (isEnterOrSpace(event) && !disabled && !loading && !isProcessing) {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  const isDisabled = disabled || loading || isProcessing;
  const currentLoadingState = loading || isProcessing;

  const buttonElement = (
    <Button
      ref={ref}
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-busy={currentLoadingState}
      sx={{
        position: 'relative',
        ...props.sx,
      }}
    >
      {currentLoadingState && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <CircularProgress
            size={16}
            color="inherit"
            aria-label={loadingMessage}
          />
        </Box>
      )}
      <Box
        sx={{
          visibility: currentLoadingState ? 'hidden' : 'visible',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {children}
      </Box>
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip
        title={tooltip}
        placement={tooltipPlacement}
        enterDelay={500}
        leaveDelay={200}
      >
        <span>
          {buttonElement}
        </span>
      </Tooltip>
    );
  }

  return buttonElement;
});

/**
 * 접근성이 향상된 아이콘 버튼
 */
export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(({
  ariaLabel,
  ariaDescribedBy,
  pressed,
  expanded,
  loading = false,
  loadingMessage = '로딩 중...',
  successMessage,
  errorMessage,
  tooltip,
  tooltipPlacement = 'top',
  onKeyDown,
  onClick,
  children,
  disabled,
  ...props
}, ref) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    if (onClick) {
      setIsProcessing(true);
      try {
        await onClick(event);
        if (successMessage) {
          announceToScreenReader(successMessage, 'polite');
        }
      } catch (error) {
        if (errorMessage) {
          announceToScreenReader(errorMessage, 'assertive');
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(event);
    }
    
    if (isEnterOrSpace(event) && !disabled && !loading && !isProcessing) {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  const isDisabled = disabled || loading || isProcessing;
  const currentLoadingState = loading || isProcessing;

  const buttonElement = (
    <IconButton
      ref={ref}
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-busy={currentLoadingState}
      sx={{
        position: 'relative',
        ...props.sx,
      }}
    >
      {currentLoadingState ? (
        <CircularProgress
          size={20}
          color="inherit"
          aria-label={loadingMessage}
        />
      ) : (
        children
      )}
    </IconButton>
  );

  if (tooltip || ariaLabel) {
    return (
      <Tooltip
        title={tooltip || ariaLabel}
        placement={tooltipPlacement}
        enterDelay={500}
        leaveDelay={200}
      >
        <span>
          {buttonElement}
        </span>
      </Tooltip>
    );
  }

  return buttonElement;
});

/**
 * 접근성이 향상된 플로팅 액션 버튼
 */
export const AccessibleFab = forwardRef<HTMLButtonElement, AccessibleFabProps>(({
  ariaLabel,
  ariaDescribedBy,
  pressed,
  expanded,
  loading = false,
  loadingMessage = '로딩 중...',
  successMessage,
  errorMessage,
  tooltip,
  tooltipPlacement = 'top',
  onKeyDown,
  onClick,
  children,
  disabled,
  ...props
}, ref) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    if (onClick) {
      setIsProcessing(true);
      try {
        await onClick(event);
        if (successMessage) {
          announceToScreenReader(successMessage, 'polite');
        }
      } catch (error) {
        if (errorMessage) {
          announceToScreenReader(errorMessage, 'assertive');
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(event);
    }
    
    if (isEnterOrSpace(event) && !disabled && !loading && !isProcessing) {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  const isDisabled = disabled || loading || isProcessing;
  const currentLoadingState = loading || isProcessing;

  const buttonElement = (
    <Fab
      ref={ref}
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-busy={currentLoadingState}
      sx={{
        position: 'relative',
        ...props.sx,
      }}
    >
      {currentLoadingState ? (
        <CircularProgress
          size={24}
          color="inherit"
          aria-label={loadingMessage}
        />
      ) : (
        children
      )}
    </Fab>
  );

  if (tooltip || ariaLabel) {
    return (
      <Tooltip
        title={tooltip || ariaLabel}
        placement={tooltipPlacement}
        enterDelay={500}
        leaveDelay={200}
      >
        <span>
          {buttonElement}
        </span>
      </Tooltip>
    );
  }

  return buttonElement;
});

// 컴포넌트 이름 설정
AccessibleButton.displayName = 'AccessibleButton';
AccessibleIconButton.displayName = 'AccessibleIconButton';
AccessibleFab.displayName = 'AccessibleFab';

export default AccessibleButton;