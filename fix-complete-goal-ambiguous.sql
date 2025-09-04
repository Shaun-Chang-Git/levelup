-- 목표 완료 함수 - user_id 모호성 문제 해결
-- 테이블 별칭(alias) 사용으로 컬럼 참조 명확화

-- 기존 complete_goal 함수 완전 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID) CASCADE;

-- 새로운 complete_goal 함수 생성 (테이블 별칭 사용)
CREATE OR REPLACE FUNCTION complete_goal(p_goal_id UUID)
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
    RETURN '{"success": false, "error": "Not authenticated"}'::JSON;
  END IF;
  
  -- 목표 정보 조회 (테이블 별칭 g 사용)
  SELECT 
    g.id,
    g.user_id,  -- 명확히 goals 테이블의 user_id
    g.title,
    g.status,
    g.reward_points
  INTO v_goal_record
  FROM goals g  -- 테이블 별칭 사용
  WHERE g.id = p_goal_id;
  
  -- 목표 존재 확인
  IF v_goal_record.id IS NULL THEN
    RETURN '{"success": false, "error": "Goal not found"}'::JSON;
  END IF;
  
  -- 소유권 확인
  IF v_goal_record.user_id != v_current_user_id THEN
    RETURN '{"success": false, "error": "Unauthorized"}'::JSON;
  END IF;
  
  -- 이미 완료된 목표 확인
  IF v_goal_record.status = 'completed' THEN
    RETURN '{"success": false, "error": "Goal already completed"}'::JSON;
  END IF;
  
  -- 목표 완료 처리 (테이블 별칭 g2 사용)
  UPDATE goals g2
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE g2.id = p_goal_id 
    AND g2.user_id = v_current_user_id;  -- 명확히 goals 테이블의 user_id
  
  -- 사용자 프로필 정보 조회 (테이블 별칭 p 사용)
  SELECT 
    p.total_points,
    p.level
  INTO v_user_record
  FROM profiles p  -- 테이블 별칭 사용
  WHERE p.id = v_current_user_id;  -- 명확히 profiles 테이블의 id
  
  -- 새로운 총 포인트 계산
  v_new_total_points := v_user_record.total_points + v_goal_record.reward_points;
  
  -- 레벨업 확인
  v_new_level := v_user_record.level;
  IF v_new_total_points >= v_user_record.level * 1000 THEN
    v_new_level := FLOOR(v_new_total_points / 1000.0) + 1;
  END IF;
  
  -- 사용자 프로필 업데이트 (테이블 별칭 p2 사용)
  UPDATE profiles p2
  SET 
    total_points = v_new_total_points,
    level = v_new_level,
    updated_at = NOW()
  WHERE p2.id = v_current_user_id;  -- 명확히 profiles 테이블의 id
  
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
COMMENT ON FUNCTION complete_goal(UUID) IS 'Complete a goal and award points to user - fixed user_id ambiguity';