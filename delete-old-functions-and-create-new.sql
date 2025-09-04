-- 기존 문제가 있는 함수들 완전 삭제 및 새 함수 생성
-- 근본 원인: supabase-rls-policies.sql의 기존 complete_goal 함수가 user_id 모호성 문제를 가지고 있음

-- 1. 기존 모든 complete_goal 관련 함수 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_goal_fixed(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_goal_v2(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_goal_v3(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_user_goal(UUID) CASCADE;

-- 2. 새로운 안전한 목표 완료 함수 생성
-- 함수명을 완전히 다르게 하여 기존 코드와 충돌 방지
CREATE OR REPLACE FUNCTION process_goal_completion(target_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  authenticated_user_id UUID;
  selected_goal RECORD;
  user_profile_data RECORD;
  calculated_total_points INTEGER;
  calculated_user_level INTEGER;
  level_increased BOOLEAN := false;
BEGIN
  -- 현재 인증된 사용자 ID 가져오기
  authenticated_user_id := auth.uid();
  
  -- 인증 확인
  IF authenticated_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (명시적 별칭 사용)
  SELECT 
    g.id,
    g.user_id,
    g.title,
    g.status,
    g.reward_points
  INTO selected_goal
  FROM goals g
  WHERE g.id = target_goal_id;
  
  -- 목표 존재 확인
  IF selected_goal.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  -- 소유권 확인
  IF selected_goal.user_id != authenticated_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- 이미 완료된 목표 확인
  IF selected_goal.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Goal already completed');
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = target_goal_id 
    AND user_id = authenticated_user_id;
  
  -- 사용자 프로필 정보 조회
  SELECT 
    p.total_points,
    p.level
  INTO user_profile_data
  FROM profiles p
  WHERE p.id = authenticated_user_id;
  
  -- 새로운 총 포인트 계산
  calculated_total_points := user_profile_data.total_points + selected_goal.reward_points;
  
  -- 레벨업 확인 (1000포인트마다 1레벨)
  calculated_user_level := user_profile_data.level;
  IF calculated_total_points >= user_profile_data.level * 1000 THEN
    calculated_user_level := FLOOR(calculated_total_points / 1000.0) + 1;
    level_increased := (calculated_user_level > user_profile_data.level);
  END IF;
  
  -- 사용자 프로필 업데이트
  UPDATE profiles
  SET 
    total_points = calculated_total_points,
    level = calculated_user_level,
    updated_at = NOW()
  WHERE id = authenticated_user_id;
  
  -- 성공 응답 반환
  RETURN json_build_object(
    'success', true,
    'goal_title', selected_goal.title,
    'points_earned', selected_goal.reward_points,
    'total_points', calculated_total_points,
    'current_level', calculated_user_level,
    'level_up', level_increased
  );
END;
$$;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION process_goal_completion(UUID) IS 'Process goal completion - completely resolved user_id ambiguity with RLS policies';

-- 성공 메시지
SELECT 'Old functions deleted and new process_goal_completion function created successfully!' as result;