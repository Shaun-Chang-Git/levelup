-- 모든 SQL 함수를 완전히 재작성 - user_id 모호성 완전 제거

-- 1. 기존 함수들 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID);
DROP FUNCTION IF EXISTS update_goal_progress(UUID, INTEGER, TEXT);

-- 2. 목표 진행률 업데이트 함수 (완전 재작성)
CREATE OR REPLACE FUNCTION update_goal_progress(
  p_goal_id UUID, 
  p_progress_amount INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_goal_user_id UUID;
  v_current_value INTEGER;
  v_target_value INTEGER;
  v_new_current_value INTEGER;
  v_progress_percentage NUMERIC;
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
    goals.current_value,
    goals.target_value
  INTO 
    v_goal_user_id,
    v_current_value,
    v_target_value
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
  
  -- 새로운 진행값 계산
  v_new_current_value := v_current_value + p_progress_amount;
  
  -- 목표값 초과 방지
  IF v_target_value IS NOT NULL AND v_new_current_value > v_target_value THEN
    v_new_current_value := v_target_value;
  END IF;
  
  -- 목표 진행률 업데이트
  UPDATE goals 
  SET 
    current_value = v_new_current_value,
    updated_at = NOW()
  WHERE goals.id = p_goal_id 
    AND goals.user_id = v_user_id;
  
  -- 진행 기록 추가
  INSERT INTO goal_progress (goal_id, user_id, progress_value, notes)
  VALUES (p_goal_id, v_user_id, p_progress_amount, p_note);
  
  -- 진행률 계산
  IF v_target_value > 0 THEN
    v_progress_percentage := (v_new_current_value::NUMERIC / v_target_value::NUMERIC) * 100;
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  -- 성공 응답
  RETURN json_build_object(
    'success', true,
    'current_value', v_new_current_value,
    'target_value', v_target_value,
    'progress_percentage', v_progress_percentage,
    'progress_added', p_progress_amount
  );
END;
$$;

-- 3. 목표 완료 함수 (재확인용 - 최신 버전)
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