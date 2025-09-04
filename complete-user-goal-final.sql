-- 목표 완료 함수 - user_id 단어 완전 제거로 모호성 해결
-- 완전히 다른 변수명과 함수명 사용

CREATE OR REPLACE FUNCTION complete_user_goal(goal_uuid UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  current_auth_user UUID;
  goal_owner_id UUID;
  goal_title_text TEXT;
  goal_status_value TEXT;
  reward_points_amount INTEGER;
  user_current_points INTEGER;
  user_current_level INTEGER;
  new_total_points INTEGER;
  new_user_level INTEGER;
  level_increased BOOLEAN := false;
BEGIN
  -- 현재 인증된 사용자 ID 가져오기
  current_auth_user := auth.uid();
  
  -- 인증 확인
  IF current_auth_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (개별 컬럼으로 분리)
  SELECT 
    goals.user_id,
    goals.title,
    goals.status,
    goals.reward_points
  INTO 
    goal_owner_id,
    goal_title_text,
    goal_status_value,
    reward_points_amount
  FROM goals
  WHERE goals.id = goal_uuid;
  
  -- 목표 존재 확인
  IF goal_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  -- 소유권 확인
  IF goal_owner_id != current_auth_user THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- 이미 완료된 목표 확인
  IF goal_status_value = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Goal already completed');
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE goals.id = goal_uuid 
    AND goals.user_id = current_auth_user;
  
  -- 사용자 프로필 정보 조회
  SELECT 
    profiles.total_points,
    profiles.level
  INTO 
    user_current_points,
    user_current_level
  FROM profiles
  WHERE profiles.id = current_auth_user;
  
  -- 새로운 총 포인트 계산
  new_total_points := user_current_points + reward_points_amount;
  
  -- 레벨업 확인 (1000포인트마다 1레벨)
  new_user_level := user_current_level;
  IF new_total_points >= user_current_level * 1000 THEN
    new_user_level := FLOOR(new_total_points / 1000.0) + 1;
    level_increased := (new_user_level > user_current_level);
  END IF;
  
  -- 사용자 프로필 업데이트
  UPDATE profiles
  SET 
    total_points = new_total_points,
    level = new_user_level,
    updated_at = NOW()
  WHERE profiles.id = current_auth_user;
  
  -- 성공 응답 반환
  RETURN json_build_object(
    'success', true,
    'goal_title', goal_title_text,
    'points_earned', reward_points_amount,
    'total_points', new_total_points,
    'current_level', new_user_level,
    'level_up', level_increased
  );
END;
$$;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION complete_user_goal(UUID) IS 'Complete a user goal - completely resolved user_id ambiguity by avoiding the term';