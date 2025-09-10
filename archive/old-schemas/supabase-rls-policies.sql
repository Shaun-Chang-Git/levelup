-- LevelUp 애플리케이션 RLS (Row Level Security) 정책 설정
-- 실행 순서: supabase-schema.sql 실행 후 이 파일을 실행

-- 1. RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 2. 프로필 테이블 RLS 정책
-- 사용자는 자신의 프로필만 읽기/수정 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. 목표 테이블 RLS 정책
-- 사용자는 자신의 목표만 CRUD 가능
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- 4. 목표 진행 기록 테이블 RLS 정책
-- 사용자는 자신의 진행 기록만 CRUD 가능
CREATE POLICY "Users can view own progress" ON goal_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON goal_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON goal_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON goal_progress
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 사용자 업적 테이블 RLS 정책
-- 사용자는 자신의 업적만 조회 가능, 삽입은 시스템에서만
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- 업적 달성은 서버 사이드 함수에서만 처리 (보안)
CREATE POLICY "Service role can insert achievements" ON user_achievements
  FOR INSERT WITH CHECK (true); -- 서비스 롤에서만 실행

-- 6. 카테고리 테이블 RLS 정책
-- 모든 사용자가 카테고리 읽기 가능, 수정은 관리자만
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- 관리자만 카테고리 CUD 가능 (추후 admin 롤 추가 시)
CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 7. 업적 정보 테이블 RLS 정책
-- 모든 사용자가 업적 정보 읽기 가능
CREATE POLICY "Anyone can view achievements info" ON achievements
  FOR SELECT USING (is_active = true);

-- 관리자만 업적 정보 CUD 가능
CREATE POLICY "Only admins can modify achievements" ON achievements
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 8. 목표 완료 시 포인트 업데이트 함수
CREATE OR REPLACE FUNCTION complete_goal(goal_id UUID)
RETURNS JSON AS $$
DECLARE
  goal_record goals%ROWTYPE;
  user_profile profiles%ROWTYPE;
  result JSON;
BEGIN
  -- 목표 정보 조회
  SELECT * INTO goal_record FROM goals 
  WHERE id = goal_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Goal not found"}';
  END IF;
  
  -- 이미 완료된 목표인지 확인
  IF goal_record.status = 'completed' THEN
    RETURN '{"success": false, "error": "Goal already completed"}';
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET status = 'completed', 
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = goal_id;
  
  -- 사용자 포인트 업데이트
  UPDATE profiles 
  SET total_points = total_points + goal_record.reward_points,
      updated_at = NOW()
  WHERE id = auth.uid();
  
  -- 레벨업 체크 (1000포인트당 1레벨)
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  
  IF user_profile.total_points >= user_profile.level * 1000 THEN
    UPDATE profiles 
    SET level = level + 1,
        updated_at = NOW()
    WHERE id = auth.uid();
  END IF;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'points_earned', goal_record.reward_points,
    'total_points', user_profile.total_points + goal_record.reward_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 목표 진행률 업데이트 함수
CREATE OR REPLACE FUNCTION update_goal_progress(
  goal_id UUID, 
  progress_amount INTEGER,
  note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  goal_record goals%ROWTYPE;
  new_current_value INTEGER;
  progress_percentage NUMERIC;
  result JSON;
BEGIN
  -- 목표 정보 조회
  SELECT * INTO goal_record FROM goals 
  WHERE id = goal_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Goal not found"}';
  END IF;
  
  -- 새로운 진행값 계산
  new_current_value := goal_record.current_value + progress_amount;
  
  -- 목표값 초과 방지
  IF goal_record.target_value IS NOT NULL AND new_current_value > goal_record.target_value THEN
    new_current_value := goal_record.target_value;
  END IF;
  
  -- 목표 진행률 업데이트
  UPDATE goals 
  SET current_value = new_current_value,
      updated_at = NOW()
  WHERE id = goal_id;
  
  -- 진행 기록 추가
  INSERT INTO goal_progress (goal_id, user_id, progress_value, notes)
  VALUES (goal_id, auth.uid(), progress_amount, note);
  
  -- 진행률 계산
  IF goal_record.target_value > 0 THEN
    progress_percentage := (new_current_value::NUMERIC / goal_record.target_value::NUMERIC) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- 목표 완료 체크
  IF goal_record.target_value IS NOT NULL AND new_current_value >= goal_record.target_value THEN
    -- 자동으로 목표 완료 처리
    PERFORM complete_goal(goal_id);
  END IF;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'current_value', new_current_value,
    'target_value', goal_record.target_value,
    'progress_percentage', progress_percentage,
    'is_completed', new_current_value >= COALESCE(goal_record.target_value, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 실행 완료 메시지
SELECT 'RLS 정책 및 보안 함수 설정 완료!' as message;