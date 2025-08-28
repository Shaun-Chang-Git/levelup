-- 1단계: 기존 함수 완전 삭제
DROP FUNCTION IF EXISTS complete_goal(UUID);

-- 2단계: 새로운 함수 생성 (매우 간단한 버전)
CREATE OR REPLACE FUNCTION complete_goal(p_goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS '
DECLARE
  v_user_id UUID;
  v_reward_points INTEGER;
  v_total_points INTEGER;
  v_current_level INTEGER;
BEGIN
  -- 현재 사용자 ID 가져오기
  v_user_id := auth.uid();
  
  -- 인증 확인
  IF v_user_id IS NULL THEN
    RETURN ''{"success": false, "error": "Not authenticated"}'';
  END IF;
  
  -- 목표의 reward_points 가져오기
  SELECT reward_points INTO v_reward_points
  FROM goals 
  WHERE id = p_goal_id AND user_id = v_user_id AND status != ''completed'';
  
  -- 목표를 찾을 수 없는 경우
  IF v_reward_points IS NULL THEN
    RETURN ''{"success": false, "error": "Goal not found or already completed"}'';
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET status = ''completed'', 
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_goal_id AND user_id = v_user_id;
  
  -- 포인트 업데이트
  UPDATE profiles 
  SET total_points = total_points + v_reward_points,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  -- 업데이트된 포인트와 레벨 조회
  SELECT total_points, level INTO v_total_points, v_current_level
  FROM profiles 
  WHERE id = v_user_id;
  
  -- 레벨업 체크
  IF v_total_points >= v_current_level * 1000 THEN
    UPDATE profiles 
    SET level = level + 1,
        updated_at = NOW()
    WHERE id = v_user_id;
    
    v_current_level := v_current_level + 1;
  END IF;
  
  -- 성공 응답
  RETURN JSON_BUILD_OBJECT(
    ''success'', true,
    ''points_earned'', v_reward_points,
    ''total_points'', v_total_points,
    ''current_level'', v_current_level
  );
END;
';