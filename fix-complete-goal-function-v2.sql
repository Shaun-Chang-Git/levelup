-- 목표 완료 함수 수정 - Supabase 호환 버전
CREATE OR REPLACE FUNCTION complete_goal(goal_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS '
DECLARE
  goal_record goals%ROWTYPE;
  user_profile profiles%ROWTYPE;
  current_user_id UUID;
BEGIN
  -- 현재 사용자 ID 명확히 가져오기
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN ''{"success": false, "error": "Not authenticated"}'';
  END IF;
  
  -- 목표 정보 조회 (테이블 별칭 사용)
  SELECT g.* INTO goal_record 
  FROM goals g 
  WHERE g.id = goal_id AND g.user_id = current_user_id;
  
  IF NOT FOUND THEN
    RETURN ''{"success": false, "error": "Goal not found"}'';
  END IF;
  
  -- 이미 완료된 목표인지 확인
  IF goal_record.status = ''completed'' THEN
    RETURN ''{"success": false, "error": "Goal already completed"}'';
  END IF;
  
  -- 목표 완료 처리
  UPDATE goals 
  SET status = ''completed'', 
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = goal_id AND user_id = current_user_id;
  
  -- 사용자 포인트 업데이트
  UPDATE profiles 
  SET total_points = total_points + goal_record.reward_points,
      updated_at = NOW()
  WHERE id = current_user_id;
  
  -- 업데이트된 사용자 프로필 조회
  SELECT p.* INTO user_profile 
  FROM profiles p 
  WHERE p.id = current_user_id;
  
  -- 레벨업 체크 (1000포인트당 1레벨)
  IF user_profile.total_points >= user_profile.level * 1000 THEN
    UPDATE profiles 
    SET level = level + 1,
        updated_at = NOW()
    WHERE id = current_user_id;
    
    -- 레벨업 후 프로필 다시 조회
    SELECT p.* INTO user_profile 
    FROM profiles p 
    WHERE p.id = current_user_id;
  END IF;
  
  RETURN JSON_BUILD_OBJECT(
    ''success'', true,
    ''points_earned'', goal_record.reward_points,
    ''total_points'', user_profile.total_points,
    ''current_level'', user_profile.level
  );
END;
';