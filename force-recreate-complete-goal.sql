-- 강제로 complete_goal 함수 완전 삭제 및 재생성

-- 1. 모든 가능한 complete_goal 함수 시그니처 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_goal(p_goal_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_goal(p_goal_id UUID) CASCADE;

-- 2. 완전히 새로운 이름으로 함수 생성 (테스트용)
CREATE OR REPLACE FUNCTION complete_user_goal(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_goal_owner_id UUID;
  v_goal_points INTEGER;
  v_goal_current_status TEXT;
  v_user_total_points INTEGER;
  v_user_current_level INTEGER;
  v_updated_total_points INTEGER;
  v_final_level INTEGER;
BEGIN
  -- Step 1: 현재 사용자 ID 가져오기
  v_current_user_id := auth.uid();
  
  -- Step 2: 인증 확인
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Step 3: 목표 정보 조회
  SELECT 
    g.user_id,
    g.reward_points,
    g.status
  INTO 
    v_goal_owner_id,
    v_goal_points,
    v_goal_current_status
  FROM goals AS g
  WHERE g.id = p_goal_id;
  
  -- Step 4: 목표 존재 확인
  IF v_goal_owner_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Goal not found'
    );
  END IF;
  
  -- Step 5: 소유권 확인
  IF v_goal_owner_id != v_current_user_id THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Unauthorized'
    );
  END IF;
  
  -- Step 6: 완료 상태 확인
  IF v_goal_current_status = 'completed' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Goal already completed'
    );
  END IF;
  
  -- Step 7: 목표 완료 처리
  UPDATE goals AS g
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE g.id = p_goal_id 
    AND g.user_id = v_current_user_id;
  
  -- Step 8: 현재 사용자 정보 조회
  SELECT 
    p.total_points,
    p.level
  INTO 
    v_user_total_points,
    v_user_current_level
  FROM profiles AS p
  WHERE p.id = v_current_user_id;
  
  -- Step 9: 포인트 업데이트
  v_updated_total_points := v_user_total_points + v_goal_points;
  
  UPDATE profiles AS p
  SET 
    total_points = v_updated_total_points,
    updated_at = NOW()
  WHERE p.id = v_current_user_id;
  
  -- Step 10: 레벨업 체크
  v_final_level := v_user_current_level;
  IF v_updated_total_points >= v_user_current_level * 1000 THEN
    v_final_level := FLOOR(v_updated_total_points / 1000) + 1;
    
    UPDATE profiles AS p
    SET 
      level = v_final_level,
      updated_at = NOW()
    WHERE p.id = v_current_user_id;
  END IF;
  
  -- Step 11: 성공 응답
  RETURN json_build_object(
    'success', true,
    'points_earned', v_goal_points,
    'total_points', v_updated_total_points,
    'current_level', v_final_level,
    'level_up', (v_final_level > v_user_current_level)
  );
END;
$$;

-- 3. 원래 이름으로 함수 생성 (위 함수가 성공하면)
CREATE OR REPLACE FUNCTION complete_goal(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- 새로운 함수 호출
  RETURN complete_user_goal(p_goal_id);
END;
$$;