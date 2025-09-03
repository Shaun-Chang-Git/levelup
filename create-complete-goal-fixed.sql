-- 새로운 목표 완료 함수 - 완전히 새로운 이름으로 생성
-- complete_goal_fixed 함수로 user_id 모호성 문제 완전 해결

-- 새로운 함수 생성 (기존 함수와 완전 분리)
CREATE OR REPLACE FUNCTION complete_goal_fixed(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  goal_data RECORD;
  user_data RECORD;
  new_total_points INTEGER;
  new_level INTEGER;
  level_changed BOOLEAN;
BEGIN
  -- 현재 사용자 ID 가져오기
  current_user_id := auth.uid();
  
  -- 인증 확인
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Not authenticated'
    );
  END IF;
  
  -- 목표 정보 조회 (별칭으로 명확하게 구분)
  SELECT 
    goals.id,
    goals.user_id AS goal_owner_id,  -- 명확한 별명 사용
    goals.title,
    goals.status,
    goals.reward_points
  INTO goal_data
  FROM goals
  WHERE goals.id = p_goal_id;
  
  -- 목표 존재 확인
  IF goal_data.id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Goal not found'
    );
  END IF;
  
  -- 소유권 확인 (별명 사용으로 명확하게)
  IF goal_data.goal_owner_id != current_user_id THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Unauthorized'
    );
  END IF;
  
  -- 이미 완료된 목표 확인
  IF goal_data.status = 'completed' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Goal already completed'
    );
  END IF;
  
  -- 목표 완료 처리 (WHERE 조건에서 명확한 테이블 참조)
  UPDATE goals 
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE goals.id = p_goal_id 
    AND goals.user_id = current_user_id;
  
  -- 사용자 프로필 정보 조회 (별칭으로 명확하게)
  SELECT 
    profiles.total_points,
    profiles.level
  INTO user_data
  FROM profiles
  WHERE profiles.id = current_user_id;
  
  -- 새로운 총 포인트 계산
  new_total_points := user_data.total_points + goal_data.reward_points;
  
  -- 레벨업 확인
  new_level := user_data.level;
  level_changed := false;
  
  IF new_total_points >= user_data.level * 1000 THEN
    new_level := FLOOR(new_total_points / 1000.0) + 1;
    level_changed := true;
  END IF;
  
  -- 사용자 프로필 업데이트 (WHERE 조건에서 명확한 테이블 참조)
  UPDATE profiles
  SET 
    total_points = new_total_points,
    level = new_level,
    updated_at = NOW()
  WHERE profiles.id = current_user_id;
  
  -- 성공 응답 반환
  RETURN json_build_object(
    'success', true,
    'goal_title', goal_data.title,
    'points_earned', goal_data.reward_points,
    'total_points', new_total_points,
    'current_level', new_level,
    'level_up', level_changed
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION complete_goal_fixed(UUID) IS 'Complete a goal and award points - fixed user_id ambiguity with clear aliases';