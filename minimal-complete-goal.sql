-- 최소한의 목표 완료 함수 - INSERT 제거, 핵심 기능만

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS complete_goal_v2(UUID) CASCADE;

-- 최소한의 목표 완료 함수
CREATE OR REPLACE FUNCTION complete_goal_v2(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
  v_goal_data RECORD;
  v_user_data RECORD;
  v_new_total_points INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Step 1: 현재 사용자 ID 가져오기
  v_current_user_id := auth.uid();
  
  -- Step 2: 인증 확인
  IF v_current_user_id IS NULL THEN
    RETURN '{"success": false, "error": "Not authenticated"}'::JSON;
  END IF;
  
  -- Step 3: 목표 정보 조회 (한 번에 모든 정보)
  SELECT 
    g.user_id AS owner_id,
    g.reward_points,
    g.status,
    g.title
  INTO v_goal_data
  FROM goals g
  WHERE g.id = p_goal_id;
  
  -- Step 4: 목표 존재 확인
  IF v_goal_data IS NULL OR v_goal_data.owner_id IS NULL THEN
    RETURN '{"success": false, "error": "Goal not found"}'::JSON;
  END IF;
  
  -- Step 5: 소유권 확인
  IF v_goal_data.owner_id != v_current_user_id THEN
    RETURN '{"success": false, "error": "Unauthorized"}'::JSON;
  END IF;
  
  -- Step 6: 완료 상태 확인
  IF v_goal_data.status = 'completed' THEN
    RETURN '{"success": false, "error": "Goal already completed"}'::JSON;
  END IF;
  
  -- Step 7: 목표 완료 처리
  UPDATE goals 
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_goal_id 
    AND user_id = v_current_user_id;
  
  -- Step 8: 사용자 정보 조회
  SELECT 
    p.total_points,
    p.level
  INTO v_user_data
  FROM profiles p
  WHERE p.id = v_current_user_id;
  
  -- Step 9: 포인트 업데이트
  v_new_total_points := v_user_data.total_points + v_goal_data.reward_points;
  
  UPDATE profiles 
  SET 
    total_points = v_new_total_points,
    updated_at = NOW()
  WHERE id = v_current_user_id;
  
  -- Step 10: 레벨업 체크
  v_new_level := v_user_data.level;
  IF v_new_total_points >= v_user_data.level * 1000 THEN
    v_new_level := FLOOR(v_new_total_points / 1000.0) + 1;
    
    UPDATE profiles 
    SET 
      level = v_new_level,
      updated_at = NOW()
    WHERE id = v_current_user_id;
  END IF;
  
  -- Step 11: 성공 응답
  RETURN json_build_object(
    'success', true,
    'goal_title', v_goal_data.title,
    'points_earned', v_goal_data.reward_points,
    'total_points', v_new_total_points,
    'current_level', v_new_level,
    'level_up', (v_new_level > v_user_data.level)
  );
END;
$$;