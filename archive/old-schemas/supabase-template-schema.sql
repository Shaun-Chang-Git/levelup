-- 목표 템플릿 시스템 스키마 추가
-- 기존 supabase-schema.sql 실행 후 추가로 실행

-- 1. 목표 템플릿 테이블
CREATE TABLE IF NOT EXISTS goal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')) DEFAULT 'medium',
  target_value INTEGER, -- 기본 목표 수치
  unit VARCHAR(20), -- 단위 (예: '권', '일', '회')
  duration_days INTEGER, -- 기본 목표 기간 (일)
  tags TEXT[], -- 검색용 태그들
  is_public BOOLEAN DEFAULT TRUE, -- 공개/비공개 (시스템 기본 템플릿)
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- 템플릿 생성자 (NULL이면 시스템 템플릿)
  usage_count INTEGER DEFAULT 0, -- 사용 횟수 (인기 템플릿 순서용)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자별 템플릿 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS user_template_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES goal_templates(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, template_id) -- 중복 즐겨찾기 방지
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_goal_templates_category_id ON goal_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_goal_templates_creator_id ON goal_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_goal_templates_usage_count ON goal_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_template_favorites_user_id ON user_template_favorites(user_id);

-- 4. 템플릿 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_goal_templates_updated_at 
  BEFORE UPDATE ON goal_templates 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. 템플릿 사용 시 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE goal_templates 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- 실행 완료 메시지
SELECT '목표 템플릿 시스템 스키마 생성 완료!' as message;