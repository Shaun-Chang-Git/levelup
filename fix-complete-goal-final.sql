-- 최종 버전: complete_goal 함수 - 모든 컬럼 참조를 완전히 명시적으로 처리
DROP FUNCTION IF EXISTS complete_goal(UUID);

CREATE OR REPLACE FUNCTION complete_goal(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_goal_user_id UUID;
  v_reward_points INTEGER;
  v_total_points INTEGER;
  v_current_level INTEGER;
  v_goal_status TEXT;
BEGIN
  -- 현재 사용자 ID 가져오기
  v_user_id := auth.uid();
  
  -- 인증 확인
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Not authenticated'
    );
  END IF;
  
  -- 목표 정보 조회 (명시적 컬럼 선택)
  SELECT 
    goals.user_id,
    goals.reward_points,
    goals.status
  INTO 
    v_goal_user_id,
    v_reward_points,
    v_goal_status
  FROM goals 
  WHERE goals.id = p_goal_id;
  
  -- 목표를 찾을 수 없는 경우
  IF v_goal_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Goal not found'
    );
  END IF;
  
  -- 소유권 확인
  IF v_goal_user_id != v_user_id THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Unauthorized'
    );
  END IF;
  
  -- 이미 완료된 목표인지 확인
  IF v_goal_status = 'completed' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Goal already completed'
    );
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE goals.id = p_goal_id 
    AND goals.user_id = v_user_id;
  
  -- 사용자 포인트 업데이트
  UPDATE profiles 
  SET 
    total_points = profiles.total_points + v_reward_points,
    updated_at = NOW()
  WHERE profiles.id = v_user_id;
  
  -- 업데이트된 사용자 정보 조회
  SELECT 
    profiles.total_points,
    profiles.level
  INTO 
    v_total_points,
    v_current_level
  FROM profiles 
  WHERE profiles.id = v_user_id;
  
  -- 레벨업 체크 (1000포인트당 1레벨)
  IF v_total_points >= v_current_level * 1000 THEN
    UPDATE profiles 
    SET 
      level = profiles.level + 1,
      updated_at = NOW()
    WHERE profiles.id = v_user_id;
    
    -- 새 레벨 가져오기
    SELECT profiles.level 
    INTO v_current_level
    FROM profiles 
    WHERE profiles.id = v_user_id;
  END IF;
  
  -- 성공 응답
  RETURN json_build_object(
    'success', true,
    'points_earned', v_reward_points,
    'total_points', v_total_points,
    'current_level', v_current_level
  );
END;
$$;