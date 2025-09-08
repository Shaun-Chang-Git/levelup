-- 🚨 LevelUp 스키마 일관성 수정 (근본적 해결책)
-- 문제: user_id가 profiles(id)와 auth.users(id)를 혼재해서 참조
-- 해결: 모든 user_id를 auth.users(id) 참조로 통일

-- ========================================
-- 1단계: 기존 함수들 모두 삭제
-- ========================================
DROP FUNCTION IF EXISTS complete_goal(UUID);
DROP FUNCTION IF EXISTS complete_goal_fixed(UUID); 
DROP FUNCTION IF EXISTS update_goal_progress_fixed(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS simple_complete_goal(TEXT);

-- ========================================
-- 2단계: 외래키 참조 통일 (auth.users로 표준화)
-- ========================================

-- goals 테이블 외래키 수정
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- goal_progress 테이블 외래키 수정  
ALTER TABLE goal_progress DROP CONSTRAINT IF EXISTS goal_progress_user_id_fkey;
ALTER TABLE goal_progress ADD CONSTRAINT goal_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_achievements 테이블 외래키 수정
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- habits 테이블이 존재한다면 수정
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'habits') THEN
    ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_user_id_fkey;
    ALTER TABLE habits ADD CONSTRAINT habits_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- habit_completions 테이블이 존재한다면 수정
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'habit_completions') THEN
    ALTER TABLE habit_completions DROP CONSTRAINT IF EXISTS habit_completions_user_id_fkey;
    ALTER TABLE habit_completions ADD CONSTRAINT habit_completions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- user_template_favorites 테이블이 존재한다면 수정
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_template_favorites') THEN
    ALTER TABLE user_template_favorites DROP CONSTRAINT IF EXISTS user_template_favorites_user_id_fkey;
    ALTER TABLE user_template_favorites ADD CONSTRAINT user_template_favorites_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ========================================
-- 3단계: RLS 정책 완전 재작성 (auth.uid() 사용)
-- ========================================

-- goals 테이블 RLS 정책 재작성
DROP POLICY IF EXISTS "goals_select_policy" ON goals;
DROP POLICY IF EXISTS "goals_insert_policy" ON goals;
DROP POLICY IF EXISTS "goals_update_policy" ON goals;
DROP POLICY IF EXISTS "goals_delete_policy" ON goals;

CREATE POLICY "goals_select_policy" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_policy" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_policy" ON goals  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "goals_delete_policy" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- goal_progress 테이블 RLS 정책 재작성
DROP POLICY IF EXISTS "goal_progress_select_policy" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_insert_policy" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_update_policy" ON goal_progress;
DROP POLICY IF EXISTS "goal_progress_delete_policy" ON goal_progress;

CREATE POLICY "goal_progress_select_policy" ON goal_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goal_progress_insert_policy" ON goal_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goal_progress_update_policy" ON goal_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "goal_progress_delete_policy" ON goal_progress
  FOR DELETE USING (auth.uid() = user_id);

-- user_achievements 테이블 RLS 정책 재작성  
DROP POLICY IF EXISTS "user_achievements_select_policy" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_insert_policy" ON user_achievements;

CREATE POLICY "user_achievements_select_policy" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_achievements_insert_policy" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 4단계: 간단하고 명확한 완료 함수 생성
-- ========================================

CREATE OR REPLACE FUNCTION complete_goal_unified(p_goal_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_goal RECORD;
  v_profile RECORD;
  v_new_points INTEGER;
  v_new_level INTEGER;
BEGIN
  -- 인증 확인
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- 목표 조회 (명시적 조건)
  SELECT id, user_id, title, status, reward_points
  INTO v_goal
  FROM goals
  WHERE id = p_goal_id AND user_id = v_user_id;
  
  IF v_goal.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  IF v_goal.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Already completed');
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_goal_id AND user_id = v_user_id;
  
  -- 프로필 조회 및 포인트 계산
  SELECT total_points, level INTO v_profile
  FROM profiles WHERE id = v_user_id;
  
  v_new_points := COALESCE(v_profile.total_points, 0) + COALESCE(v_goal.reward_points, 0);
  v_new_level := GREATEST(FLOOR(v_new_points / 1000.0) + 1, COALESCE(v_profile.level, 1));
  
  -- 프로필 업데이트
  UPDATE profiles
  SET total_points = v_new_points, level = v_new_level, updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'goal_title', v_goal.title,
    'points_earned', v_goal.reward_points,
    'total_points', v_new_points,
    'level', v_new_level
  );
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION complete_goal_unified(UUID) TO authenticated;

-- 완료 메시지
SELECT '🎉 스키마 일관성 수정 완료! complete_goal_unified 함수 사용 준비됨' as result;