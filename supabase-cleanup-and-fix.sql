-- LevelUp 애플리케이션 RLS 정책 정리 및 수정
-- 기존 정책 충돌 문제 해결

-- ========================================
-- 1단계: 모든 기존 정책과 함수 완전 삭제
-- ========================================

-- 기존 정책들 강제 삭제 (IF EXISTS 사용)
DROP POLICY IF EXISTS "profile_select_policy" ON profiles;
DROP POLICY IF EXISTS "profile_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profile_update_policy" ON profiles;

DROP POLICY IF EXISTS "goals_select_policy" ON goals;
DROP POLICY IF EXISTS "goals_insert_policy" ON goals;
DROP POLICY IF EXISTS "goals_update_policy" ON goals;
DROP POLICY IF EXISTS "goals_delete_policy" ON goals;

DROP POLICY IF EXISTS "simple_goals_select" ON goals;
DROP POLICY IF EXISTS "simple_goals_insert" ON goals;
DROP POLICY IF EXISTS "simple_goals_update" ON goals;
DROP POLICY IF EXISTS "simple_goals_delete" ON goals;

DROP POLICY IF EXISTS "goal_progress_select_policy" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_insert_policy" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_update_policy" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_delete_policy" ON goal_progress;

DROP POLICY IF EXISTS "user_achievements_select_policy" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_insert_policy" ON user_achievements;

DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "achievements_select_policy" ON achievements;

-- 이전 정책들도 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;  
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

DROP POLICY IF EXISTS "Users can view own progress" ON goal_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON goal_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON goal_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON goal_progress;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Service role can insert achievements" ON user_achievements;

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;

DROP POLICY IF EXISTS "Anyone can view achievements info" ON achievements;
DROP POLICY IF EXISTS "Only admins can modify achievements" ON achievements;

-- 모든 기존 함수들 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID);
DROP FUNCTION IF EXISTS update_goal_progress(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS simple_complete_goal(TEXT);
DROP FUNCTION IF EXISTS mark_goal_as_completed(UUID);
DROP FUNCTION IF EXISTS complete_goal_fixed(UUID);
DROP FUNCTION IF EXISTS update_goal_progress_fixed(UUID, INTEGER, TEXT);

-- ========================================
-- 2단계: 새로운 RLS 정책 생성
-- ========================================

-- 프로필 테이블 RLS 정책
CREATE POLICY "profile_select_policy" ON profiles
  FOR SELECT USING (auth.uid() = profiles.id);

CREATE POLICY "profile_insert_policy" ON profiles  
  FOR INSERT WITH CHECK (auth.uid() = profiles.id);

CREATE POLICY "profile_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = profiles.id);

-- 목표 테이블 RLS 정책
CREATE POLICY "goals_select_policy" ON goals
  FOR SELECT USING (auth.uid() = goals.user_id);

CREATE POLICY "goals_insert_policy" ON goals
  FOR INSERT WITH CHECK (auth.uid() = goals.user_id);

CREATE POLICY "goals_update_policy" ON goals  
  FOR UPDATE USING (auth.uid() = goals.user_id);

CREATE POLICY "goals_delete_policy" ON goals
  FOR DELETE USING (auth.uid() = goals.user_id);

-- 목표 진행 기록 테이블 RLS 정책
CREATE POLICY "goal_progress_select_policy" ON goal_progress
  FOR SELECT USING (auth.uid() = goal_progress.user_id);

CREATE POLICY "goal_progress_insert_policy" ON goal_progress
  FOR INSERT WITH CHECK (auth.uid() = goal_progress.user_id);

CREATE POLICY "goal_progress_update_policy" ON goal_progress
  FOR UPDATE USING (auth.uid() = goal_progress.user_id);

CREATE POLICY "goal_progress_delete_policy" ON goal_progress
  FOR DELETE USING (auth.uid() = goal_progress.user_id);

-- 사용자 업적 테이블 RLS 정책  
CREATE POLICY "user_achievements_select_policy" ON user_achievements
  FOR SELECT USING (auth.uid() = user_achievements.user_id);

CREATE POLICY "user_achievements_insert_policy" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_achievements.user_id);

-- 카테고리 테이블 RLS 정책 (읽기 전용)
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (true);

-- 업적 정보 테이블 RLS 정책 (읽기 전용)
CREATE POLICY "achievements_select_policy" ON achievements
  FOR SELECT USING (achievements.is_active = true);

-- ========================================
-- 3단계: 새로운 보안 함수 생성
-- ========================================

-- 목표 완료 함수 (완전히 명확한 테이블.컬럼 참조)
CREATE OR REPLACE FUNCTION complete_goal_fixed(p_goal_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_goal_record RECORD;
  v_user_record RECORD;
  v_new_total_points INTEGER;
  v_new_level INTEGER;
BEGIN
  -- 현재 사용자 ID
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (명시적 테이블 참조)
  SELECT 
    g.id, g.user_id, g.title, g.status, g.reward_points
  INTO v_goal_record
  FROM goals g
  WHERE g.id = p_goal_id AND g.user_id = v_current_user_id;
  
  IF v_goal_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  IF v_goal_record.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Goal already completed');
  END IF;
  
  -- 목표 완료 처리 (명시적 조건)
  UPDATE goals 
  SET status = 'completed', 
      completed_at = NOW(), 
      updated_at = NOW()
  WHERE id = p_goal_id AND user_id = v_current_user_id;
  
  -- 사용자 프로필 조회
  SELECT p.total_points, p.level
  INTO v_user_record
  FROM profiles p
  WHERE p.id = v_current_user_id;
  
  -- 포인트 및 레벨 계산
  v_new_total_points := v_user_record.total_points + v_goal_record.reward_points;
  v_new_level := v_user_record.level;
  
  -- 레벨업 체크 (1000포인트마다 1레벨)
  IF v_new_total_points >= v_user_record.level * 1000 THEN
    v_new_level := FLOOR(v_new_total_points / 1000.0) + 1;
  END IF;
  
  -- 프로필 업데이트
  UPDATE profiles
  SET total_points = v_new_total_points,
      level = v_new_level, 
      updated_at = NOW()
  WHERE id = v_current_user_id;
  
  RETURN json_build_object(
    'success', true,
    'goal_title', v_goal_record.title,
    'points_earned', v_goal_record.reward_points,
    'total_points', v_new_total_points,
    'current_level', v_new_level,
    'level_up', (v_new_level > v_user_record.level)
  );
END;
$$;

-- 목표 진행률 업데이트 함수 (완전히 명확한 테이블.컬럼 참조)
CREATE OR REPLACE FUNCTION update_goal_progress_fixed(
  p_goal_id UUID,
  p_progress_amount INTEGER, 
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql  
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_goal_record RECORD;
  v_new_current_value INTEGER;
  v_progress_percentage NUMERIC;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (명시적 테이블 참조)
  SELECT g.id, g.user_id, g.current_value, g.target_value
  INTO v_goal_record  
  FROM goals g
  WHERE g.id = p_goal_id AND g.user_id = v_current_user_id;
  
  IF v_goal_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  -- 새로운 진행값 계산
  v_new_current_value := v_goal_record.current_value + p_progress_amount;
  
  IF v_goal_record.target_value IS NOT NULL AND v_new_current_value > v_goal_record.target_value THEN
    v_new_current_value := v_goal_record.target_value;
  END IF;
  
  -- 목표 진행률 업데이트
  UPDATE goals
  SET current_value = v_new_current_value, updated_at = NOW()
  WHERE id = p_goal_id AND user_id = v_current_user_id;
  
  -- 진행 기록 추가
  INSERT INTO goal_progress (goal_id, user_id, progress_value, notes)
  VALUES (p_goal_id, v_current_user_id, p_progress_amount, p_note);
  
  -- 진행률 계산
  IF v_goal_record.target_value > 0 THEN
    v_progress_percentage := (v_new_current_value::NUMERIC / v_goal_record.target_value::NUMERIC) * 100;
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'current_value', v_new_current_value,
    'target_value', v_goal_record.target_value,
    'progress_percentage', v_progress_percentage,
    'is_completed', v_new_current_value >= COALESCE(v_goal_record.target_value, 0)
  );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION complete_goal_fixed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_goal_progress_fixed(UUID, INTEGER, TEXT) TO authenticated;

SELECT 'RLS 정책 및 함수 완전 정리 및 재설정 완료!' as message;