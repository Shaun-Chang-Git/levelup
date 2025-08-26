import React, { useState } from 'react';
import './AuthForm.css';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToSignUp: () => void;
  loading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onLogin, 
  onSwitchToSignUp, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await onLogin(formData.email, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
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
        <h2>🎯 로그인</h2>
        <p>LevelUp에서 학습 여정을 계속하세요!</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-content">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="email">이메일</label>
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
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            disabled={loading}
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="auth-switch">
          <p>
            계정이 없으신가요?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToSignUp}
              disabled={loading}
            >
              회원가입
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;