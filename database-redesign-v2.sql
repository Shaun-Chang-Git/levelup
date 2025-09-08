-- 🏗️ LevelUp 데이터베이스 완전 재설계 v2.0
-- 설계 철학: 단순성 > 자동화, 일관성 > 기능성, 확장성 > 완성도

-- ========================================
-- 1. 기존 복잡한 구조 완전 제거
-- ========================================

-- 모든 기존 테이블 제거 (데이터 백업 필요시 주의!)
-- DROP TABLE IF EXISTS ... (필요시 개별적으로 실행)

-- ========================================
-- 2. 핵심 6개 테이블 재생성
-- ========================================

-- 사용자 프로필 (단순화)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카테고리 (단순화)
CREATE TABLE goal_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 목표 (핵심 테이블)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES goal_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  reward_points INTEGER DEFAULT 100,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 진행 기록 (단순화)
CREATE TABLE goal_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_amount INTEGER NOT NULL,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업적 정의 (단순화)
CREATE TABLE achievement_definitions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  badge_icon TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 사용자 업적 (단순화)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ========================================
-- 3. 필수 인덱스 (성능 최적화)
-- ========================================

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);
CREATE INDEX idx_user_goals_category ON user_goals(category_id);
CREATE INDEX idx_goal_progress_goal_id ON goal_progress_logs(goal_id);
CREATE INDEX idx_goal_progress_user_id ON goal_progress_logs(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- ========================================
-- 4. 기본 데이터 삽입
-- ========================================

INSERT INTO goal_categories (name, icon, color) VALUES
('학습', '📚', 'blue'),
('건강', '💪', 'green'),
('취미', '🎨', 'purple'),
('업무', '💼', 'orange'),
('관계', '👥', 'pink'),
('자기계발', '🌟', 'yellow');

INSERT INTO achievement_definitions (title, description, condition_type, condition_value, points_reward) VALUES
('첫걸음', '첫 번째 목표를 완료하세요', 'total_goals', 1, 50),
('꾸준함', '10개의 목표를 완료하세요', 'total_goals', 10, 200),
('마스터', '50개의 목표를 완료하세요', 'total_goals', 50, 500),
('포인트 헌터', '1000 포인트를 달성하세요', 'total_points', 1000, 100),
('레벨업', '레벨 5에 도달하세요', 'user_level', 5, 300);

-- ========================================
-- 5. 단순한 RLS 정책 (최소한만)
-- ========================================

-- user_profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- user_goals RLS  
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);

-- goal_progress_logs RLS
ALTER TABLE goal_progress_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_progress" ON goal_progress_logs
  FOR ALL USING (auth.uid() = user_id);

-- user_achievements RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

-- 읽기 전용 테이블들
ALTER TABLE goal_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON goal_categories
  FOR SELECT USING (true);

ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_public_read" ON achievement_definitions
  FOR SELECT USING (is_active = true);

-- ========================================
-- 6. 권한 부여
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goal_progress_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO authenticated;
GRANT SELECT ON goal_categories TO authenticated;
GRANT SELECT ON achievement_definitions TO authenticated;

-- 시퀀스 권한
GRANT USAGE ON SEQUENCE goal_categories_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE achievement_definitions_id_seq TO authenticated;

-- ========================================
-- 7. 업데이트 타임스탬프 트리거 (안전한 트리거만)
-- ========================================

-- 단순한 updated_at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- user_profiles 트리거
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_goals 트리거  
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT '🏗️ 데이터베이스 v2.0 재설계 완료!' as result;
SELECT '📊 핵심 6개 테이블, 최소한의 RLS, 트리거 없음' as summary;