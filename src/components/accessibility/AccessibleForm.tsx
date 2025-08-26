import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  Typography,
  TextFieldProps,
} from '@mui/material';
import { createValidationMessage, announceToScreenReader } from '../../utils/accessibility';

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface AccessibleTextFieldProps extends Omit<TextFieldProps, 'error' | 'helperText'> {
  /** 필드 라벨 (필수) */
  label: string;
  /** 필드 설명 */
  description?: string;
  /** 유효성 검사 규칙 */
  validationRules?: ValidationRule[];
  /** 실시간 유효성 검사 여부 */
  validateOnChange?: boolean;
  /** 필수 필드 여부 */
  isRequired?: boolean;
  /** 자동완성 타입 */
  autoComplete?: string;
  /** 입력 형식 힌트 */
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  /** 에러 메시지 */
  errorMessage?: string;
  /** 성공 메시지 */
  successMessage?: string;
}

export const AccessibleTextField: React.FC<AccessibleTextFieldProps> = ({
  label,
  description,
  validationRules = [],
  validateOnChange = false,
  isRequired = false,
  autoComplete,
  inputMode,
  errorMessage,
  successMessage,
  value,
  onChange,
  onBlur,
  ...props
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const fieldId = props.id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const successId = `${fieldId}-success`;

  // 유효성 검사 실행
  const validateField = (fieldValue: string) => {
    if (isRequired && !fieldValue.trim()) {
      setError('필수 입력 항목입니다.');
      setIsValid(false);
      return false;
    }

    for (const rule of validationRules) {
      if (!rule.validate(fieldValue)) {
        setError(rule.message);
        setIsValid(false);
        return false;
      }
    }

    setError('');
    setIsValid(true);
    return true;
  };

  // 값 변경 시 유효성 검사
  useEffect(() => {
    if (touched && validateOnChange && typeof value === 'string') {
      validateField(value);
    }
  }, [value, touched, validateOnChange]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
    
    if (validateOnChange && touched) {
      validateField(event.target.value);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    validateField(event.target.value);
    
    if (onBlur) {
      onBlur(event);
    }

    // 스크린 리더에 유효성 검사 결과 알림
    if (error) {
      announceToScreenReader(`${label}: ${error}`, 'assertive');
    } else if (successMessage && isValid) {
      announceToScreenReader(`${label}: ${successMessage}`, 'polite');
    }
  };

  const hasError = touched && (!!error || !!errorMessage);
  const hasSuccess = touched && !hasError && (!!successMessage || (isValid && value));

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        {...props}
        id={fieldId}
        label={isRequired ? `${label} *` : label}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={hasError}
        fullWidth
        autoComplete={autoComplete}
        inputProps={{
          ...props.inputProps,
          inputMode,
          'aria-describedby': [
            description ? descriptionId : '',
            hasError ? errorId : '',
            hasSuccess ? successId : '',
          ].filter(Boolean).join(' ') || undefined,
          'aria-required': isRequired,
          'aria-invalid': hasError,
        }}
        sx={{
          ...props.sx,
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: hasError ? 'error.main' : hasSuccess ? 'success.main' : 'primary.main',
              borderWidth: 2,
            },
          },
        }}
      />

      {/* 필드 설명 */}
      {description && (
        <FormHelperText id={descriptionId} sx={{ mt: 0.5 }}>
          {description}
        </FormHelperText>
      )}

      {/* 에러 메시지 */}
      {hasError && (
        <FormHelperText
          id={errorId}
          error
          sx={{ 
            mt: 0.5,
            fontWeight: 500,
          }}
          role="alert"
          aria-live="polite"
        >
          {error || errorMessage}
        </FormHelperText>
      )}

      {/* 성공 메시지 */}
      {hasSuccess && successMessage && (
        <FormHelperText
          id={successId}
          sx={{ 
            mt: 0.5,
            color: 'success.main',
            fontWeight: 500,
          }}
          aria-live="polite"
        >
          {successMessage}
        </FormHelperText>
      )}
    </Box>
  );
};

interface AccessibleFormProps {
  /** 폼 제목 */
  title?: string;
  /** 폼 설명 */
  description?: string;
  /** 제출 핸들러 */
  onSubmit?: (event: React.FormEvent) => void;
  /** 폼 유효성 검사 에러 */
  formError?: string;
  /** 폼 성공 메시지 */
  formSuccess?: string;
  /** 로딩 상태 */
  loading?: boolean;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  title,
  description,
  onSubmit,
  formError,
  formSuccess,
  loading = false,
  children,
}) => {
  const formId = 'accessible-form';
  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const errorId = `${formId}-error`;
  const successId = `${formId}-success`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (onSubmit && !loading) {
      onSubmit(event);
    }
  };

  // 폼 상태 변경 시 스크린 리더에 알림
  useEffect(() => {
    if (formError) {
      announceToScreenReader(`폼 에러: ${formError}`, 'assertive');
    }
  }, [formError]);

  useEffect(() => {
    if (formSuccess) {
      announceToScreenReader(`폼 성공: ${formSuccess}`, 'polite');
    }
  }, [formSuccess]);

  return (
    <Box
      component="form"
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={[
        description ? descriptionId : '',
        formError ? errorId : '',
        formSuccess ? successId : '',
      ].filter(Boolean).join(' ') || undefined}
      sx={{
        width: '100%',
        maxWidth: 'sm',
        mx: 'auto',
      }}
    >
      {/* 폼 제목 */}
      {title && (
        <Typography
          id={titleId}
          variant="h4"
          component="h1"
          sx={{ mb: 2, fontWeight: 600 }}
        >
          {title}
        </Typography>
      )}

      {/* 폼 설명 */}
      {description && (
        <Typography
          id={descriptionId}
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {description}
        </Typography>
      )}

      {/* 전체 폼 에러 */}
      {formError && (
        <Alert
          severity="error"
          id={errorId}
          role="alert"
          aria-live="polite"
          sx={{ mb: 3 }}
        >
          {formError}
        </Alert>
      )}

      {/* 전체 폼 성공 메시지 */}
      {formSuccess && (
        <Alert
          severity="success"
          id={successId}
          role="status"
          aria-live="polite"
          sx={{ mb: 3 }}
        >
          {formSuccess}
        </Alert>
      )}

      {/* 폼 필드들 */}
      <fieldset
        disabled={loading}
        style={{
          border: 'none',
          padding: 0,
          margin: 0,
          minWidth: 0,
        }}
      >
        {loading && (
          <Box
            role="status"
            aria-live="polite"
            aria-label="폼 처리 중"
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              처리 중...
            </Typography>
          </Box>
        )}
        {children}
      </fieldset>
    </Box>
  );
};

/**
 * 일반적인 유효성 검사 규칙들
 */
export const validationRules = {
  email: {
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: '올바른 이메일 주소를 입력해주세요.',
  },
  password: {
    validate: (value: string) => value.length >= 8,
    message: '비밀번호는 8자 이상이어야 합니다.',
  },
  strongPassword: {
    validate: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
    message: '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.',
  },
  phone: {
    validate: (value: string) => /^[0-9]{10,11}$/.test(value.replace(/[^0-9]/g, '')),
    message: '올바른 전화번호를 입력해주세요.',
  },
  required: {
    validate: (value: string) => value.trim().length > 0,
    message: '필수 입력 항목입니다.',
  },
  minLength: (min: number) => ({
    validate: (value: string) => value.trim().length >= min,
    message: `최소 ${min}자 이상 입력해주세요.`,
  }),
  maxLength: (max: number) => ({
    validate: (value: string) => value.trim().length <= max,
    message: `최대 ${max}자까지 입력 가능합니다.`,
  }),
};

export default AccessibleForm;