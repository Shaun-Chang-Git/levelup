-- 목표 완료 기능을 위해 RLS 정책 임시 우회
-- 오직 goals 테이블에 대해서만 특별한 처리

-- 1. goals 테이블에 대한 기존 RLS 정책 확인 및 삭제
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

-- 2. 더 단순한 RLS 정책으로 재생성 (user_id 모호성 완전 제거)
CREATE POLICY "simple_goals_select" ON goals
  FOR SELECT USING (auth.uid() = goals.user_id);

CREATE POLICY "simple_goals_insert" ON goals  
  FOR INSERT WITH CHECK (auth.uid() = goals.user_id);

CREATE POLICY "simple_goals_update" ON goals
  FOR UPDATE USING (auth.uid() = goals.user_id) 
  WITH CHECK (auth.uid() = goals.user_id);

CREATE POLICY "simple_goals_delete" ON goals
  FOR DELETE USING (auth.uid() = goals.user_id);

-- 3. 혹시 모르니 목표 완료만을 위한 특별 함수 생성 (완전 다른 방식)
CREATE OR REPLACE FUNCTION mark_goal_as_completed(target_goal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  goal_info RECORD;
  user_info RECORD;
  final_points INTEGER;
  final_level INTEGER;
BEGIN
  -- 사용자 ID 확보
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 목표 정보 확인 (완전 명시적 쿼리)
  SELECT g.id, g.user_id, g.title, g.status, g.reward_points
  INTO goal_info
  FROM public.goals g
  WHERE g.id = target_goal_id 
    AND g.user_id = current_user_id;

  IF goal_info.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found');
  END IF;

  IF goal_info.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already completed');
  END IF;

  -- 목표 상태 업데이트 (완전 명시적)
  UPDATE public.goals 
  SET status = 'completed', 
      completed_at = NOW(), 
      updated_at = NOW()
  WHERE id = target_goal_id 
    AND user_id = current_user_id;

  -- 프로필 정보 확인
  SELECT p.total_points, p.level
  INTO user_info  
  FROM public.profiles p
  WHERE p.id = current_user_id;

  -- 계산
  final_points := user_info.total_points + goal_info.reward_points;
  final_level := GREATEST(1, (final_points / 1000) + 1);

  -- 프로필 업데이트
  UPDATE public.profiles
  SET total_points = final_points,
      level = final_level,
      updated_at = NOW()
  WHERE id = current_user_id;

  -- 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'goal_title', goal_info.title,
    'points_earned', goal_info.reward_points,
    'total_points', final_points,
    'current_level', final_level,
    'level_up', (final_level > user_info.level)
  );
END;
$$;

-- 실행 권한 부여
GRANT EXECUTE ON FUNCTION mark_goal_as_completed(UUID) TO authenticated;

SELECT 'Goals RLS policies recreated and special function created!' as result;