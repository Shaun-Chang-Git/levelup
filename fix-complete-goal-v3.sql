-- 목표 완료 함수 V3 - 완전히 새로운 함수명으로 생성
-- user_id 모호성 문제 완전 해결

-- 새로운 함수명으로 생성 (기존과 충돌 방지)
CREATE OR REPLACE FUNCTION complete_goal_v3(p_goal_id UUID)
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
  -- 현재 사용자 ID 가져오기
  v_current_user_id := auth.uid();
  
  -- 인증 확인
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (모든 컬럼을 명시적으로 지정)
  SELECT 
    g.id,
    g.user_id,
    g.title,
    g.status,
    g.reward_points
  INTO v_goal_record
  FROM goals g
  WHERE g.id = p_goal_id;
  
  -- 목표 존재 확인
  IF v_goal_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  -- 소유권 확인
  IF v_goal_record.user_id != v_current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- 이미 완료된 목표 확인
  IF v_goal_record.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Goal already completed');
  END IF;
  
  -- 목표 완료 처리 (테이블 별칭 사용)
  UPDATE goals g2
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE g2.id = p_goal_id 
    AND g2.user_id = v_current_user_id;
  
  -- 사용자 프로필 정보 조회 (테이블 별칭 사용)
  SELECT 
    p.total_points,
    p.level
  INTO v_user_record
  FROM profiles p
  WHERE p.id = v_current_user_id;
  
  -- 새로운 총 포인트 계산
  v_new_total_points := v_user_record.total_points + v_goal_record.reward_points;
  
  -- 레벨업 확인 (1000포인트마다 1레벨)
  v_new_level := v_user_record.level;
  IF v_new_total_points >= v_user_record.level * 1000 THEN
    v_new_level := FLOOR(v_new_total_points / 1000.0) + 1;
  END IF;
  
  -- 사용자 프로필 업데이트 (테이블 별칭 사용)
  UPDATE profiles p2
  SET 
    total_points = v_new_total_points,
    level = v_new_level,
    updated_at = NOW()
  WHERE p2.id = v_current_user_id;
  
  -- 성공 응답 반환
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

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION complete_goal_v3(UUID) IS 'Complete a goal V3 - fully resolved user_id ambiguity with aliases';