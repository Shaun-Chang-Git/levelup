-- LevelUp 애플리케이션 데이터베이스 스키마
-- 실행 순서: Supabase Dashboard > SQL Editor에서 실행

-- 1. 카테고리 테이블 (목표 분류용)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- 아이콘 이름 (예: 'book', 'fitness', 'career')
  color VARCHAR(7) DEFAULT '#3B82F6', -- HEX 색상 코드
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 프로필 확장 테이블 (auth.users를 확장)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 목표 테이블
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  target_value INTEGER, -- 목표 수치 (예: 10권, 30일)
  current_value INTEGER DEFAULT 0, -- 현재 진행 수치
  unit VARCHAR(20), -- 단위 (예: '권', '일', '회')
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_points INTEGER DEFAULT 0, -- 완료 시 획득 포인트
  streak_count INTEGER DEFAULT 0, -- 연속 달성 일수
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 목표 진행 기록 테이블
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  progress_value INTEGER NOT NULL, -- 해당 날짜의 진행량
  progress_date DATE DEFAULT CURRENT_DATE,
  notes TEXT, -- 진행 상황 메모
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 업적/뱃지 테이블
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR(50), -- 업적 아이콘
  badge_color VARCHAR(7) DEFAULT '#FFD700', -- 뱃지 색상
  condition_type VARCHAR(30) NOT NULL, -- 'goal_complete', 'streak', 'total_points' 등
  condition_value INTEGER, -- 달성 조건 값
  reward_points INTEGER DEFAULT 0, -- 업적 달성 시 포인트
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 사용자 업적 달성 기록 테이블
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id) -- 중복 달성 방지
);

-- 7. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 8. 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 업데이트 트리거 설정
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 10. 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 사용자 가입 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 실행 완료 메시지
SELECT 'LevelUp 데이터베이스 스키마 생성 완료!' as message;