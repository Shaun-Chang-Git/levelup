-- 완전한 함수 리셋: 모든 기존 함수 삭제 후 새로 생성

-- ========================================
-- STEP 1: 모든 관련 함수 완전 삭제
-- ========================================

-- 모든 complete_goal 함수 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_goal(goal_id UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_goal(p_goal_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_goal(goal_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_goal(p_goal_id UUID) CASCADE;

-- 모든 complete_user_goal 함수 삭제
DROP FUNCTION IF EXISTS complete_user_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_user_goal(p_goal_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_user_goal(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_user_goal(p_goal_id UUID) CASCADE;

-- 모든 update_goal_progress 함수 삭제
DROP FUNCTION IF EXISTS update_goal_progress(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_goal_progress(goal_id UUID, progress_amount INTEGER, note TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_goal_progress(p_goal_id UUID, p_progress_amount INTEGER, p_note TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress(goal_id UUID, progress_amount INTEGER, note TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress(p_goal_id UUID, p_progress_amount INTEGER, p_note TEXT) CASCADE;

-- ========================================
-- STEP 2: 새로운 함수들 생성 (완전히 새로운 이름)
-- ========================================

-- 새로운 진행률 업데이트 함수 (자동 완료 기능 제거)
CREATE OR REPLACE FUNCTION update_goal_progress_v2(
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
  v_goal_owner_id UUID;
  v_current_value INTEGER;
  v_target_value INTEGER;
  v_new_current_value INTEGER;
  v_progress_percentage NUMERIC;
BEGIN
  -- 현재 사용자 ID
  v_user_id := auth.uid();
  
  -- 인증 확인
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (테이블 별칭 사용)
  SELECT 
    g.user_id,
    g.current_value,
    g.target_value
  INTO 
    v_goal_owner_id,
    v_current_value,
    v_target_value
  FROM goals AS g
  WHERE g.id = p_goal_id;
  
  -- 목표 존재 및 권한 확인
  IF v_goal_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  IF v_goal_owner_id != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- 새로운 진행값 계산
  v_new_current_value := v_current_value + p_progress_amount;
  
  -- 목표값 초과 방지
  IF v_target_value IS NOT NULL AND v_new_current_value > v_target_value THEN
    v_new_current_value := v_target_value;
  END IF;
  
  -- 목표 진행률 업데이트
  UPDATE goals AS g
  SET 
    current_value = v_new_current_value,
    updated_at = NOW()
  WHERE g.id = p_goal_id 
    AND g.user_id = v_user_id;
  
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

-- 새로운 목표 완료 함수
CREATE OR REPLACE FUNCTION complete_goal_v2(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_goal_owner_id UUID;
  v_goal_points INTEGER;
  v_goal_current_status TEXT;
  v_user_total_points INTEGER;
  v_user_current_level INTEGER;
  v_updated_total_points INTEGER;
  v_final_level INTEGER;
BEGIN
  -- 현재 사용자 ID
  v_user_id := auth.uid();
  
  -- 인증 확인
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- 목표 정보 조회 (테이블 별칭 사용)
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
  
  -- 목표 존재 확인
  IF v_goal_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Goal not found');
  END IF;
  
  -- 권한 확인
  IF v_goal_owner_id != v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- 완료 상태 확인
  IF v_goal_current_status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Goal already completed');
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals AS g
  SET 
    status = 'completed', 
    completed_at = NOW(),
    updated_at = NOW()
  WHERE g.id = p_goal_id 
    AND g.user_id = v_user_id;
  
  -- 사용자 정보 조회 (테이블 별칭 사용)
  SELECT 
    p.total_points,
    p.level
  INTO 
    v_user_total_points,
    v_user_current_level
  FROM profiles AS p
  WHERE p.id = v_user_id;
  
  -- 포인트 업데이트
  v_updated_total_points := v_user_total_points + v_goal_points;
  
  UPDATE profiles AS p
  SET 
    total_points = v_updated_total_points,
    updated_at = NOW()
  WHERE p.id = v_user_id;
  
  -- 레벨업 체크
  v_final_level := v_user_current_level;
  IF v_updated_total_points >= v_user_current_level * 1000 THEN
    v_final_level := FLOOR(v_updated_total_points / 1000) + 1;
    
    UPDATE profiles AS p
    SET 
      level = v_final_level,
      updated_at = NOW()
    WHERE p.id = v_user_id;
  END IF;
  
  -- 성공 응답
  RETURN json_build_object(
    'success', true,
    'points_earned', v_goal_points,
    'total_points', v_updated_total_points,
    'current_level', v_final_level,
    'level_up', (v_final_level > v_user_current_level)
  );
END;
$$;

-- ========================================
-- STEP 3: 기존 이름으로 래퍼 함수 생성
-- ========================================

-- update_goal_progress 래퍼
CREATE OR REPLACE FUNCTION update_goal_progress(
  p_goal_id UUID, 
  p_progress_amount INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN update_goal_progress_v2(p_goal_id, p_progress_amount, p_note);
END;
$$;

-- complete_goal 래퍼
CREATE OR REPLACE FUNCTION complete_goal(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN complete_goal_v2(p_goal_id);
END;
$$;