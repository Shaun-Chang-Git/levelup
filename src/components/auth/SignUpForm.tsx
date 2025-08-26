import React, { useState } from 'react';
import './AuthForm.css';

interface SignUpFormProps {
  onSignUp: (email: string, password: string, fullName?: string) => Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ 
  onSignUp, 
  onSwitchToLogin, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      await onSignUp(formData.email, formData.password, formData.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="auth-form">
      <div className="auth-form-header">
        <h2>🚀 회원가입</h2>
        <p>LevelUp과 함께 학습 여정을 시작하세요!</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="fullName">이름 (선택사항)</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="이름을 입력하세요"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">이메일 *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호 *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요 (최소 6자)"
            disabled={loading}
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인 *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            disabled={loading}
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>

        <div className="auth-switch">
          <p>
            이미 계정이 있으신가요?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              로그인
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;