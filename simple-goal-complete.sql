-- 가장 단순한 목표 완료 함수 - RLS 정책 충돌 완전 회피
-- SECURITY DEFINER로 RLS 정책을 우회하고 직접 처리

CREATE OR REPLACE FUNCTION simple_complete_goal(goal_uuid TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- 이 함수는 함수 소유자 권한으로 실행 (RLS 우회)
AS $$
DECLARE
    current_user_uuid TEXT;
    goal_data RECORD;
    profile_data RECORD;
    new_points INTEGER;
    new_level INTEGER;
BEGIN
    -- 현재 사용자 ID 가져오기
    current_user_uuid := auth.uid()::TEXT;
    
    -- 인증 확인
    IF current_user_uuid IS NULL THEN
        RETURN '{"success": false, "error": "Not authenticated"}'::JSON;
    END IF;
    
    -- RLS 정책을 우회하여 직접 목표 조회
    SELECT 
        id, user_id, title, status, reward_points
    INTO goal_data
    FROM goals 
    WHERE id::TEXT = goal_uuid AND user_id::TEXT = current_user_uuid;
    
    -- 목표 존재 확인
    IF goal_data.id IS NULL THEN
        RETURN '{"success": false, "error": "Goal not found"}'::JSON;
    END IF;
    
    -- 이미 완료된 목표 확인
    IF goal_data.status = 'completed' THEN
        RETURN '{"success": false, "error": "Goal already completed"}'::JSON;
    END IF;
    
    -- RLS 정책을 우회하여 직접 목표 업데이트
    UPDATE goals 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id::TEXT = goal_uuid AND user_id::TEXT = current_user_uuid;
    
    -- 사용자 프로필 조회
    SELECT total_points, level
    INTO profile_data
    FROM profiles
    WHERE id::TEXT = current_user_uuid;
    
    -- 포인트 계산
    new_points := profile_data.total_points + goal_data.reward_points;
    new_level := GREATEST(1, FLOOR(new_points / 1000.0) + 1);
    
    -- 프로필 업데이트
    UPDATE profiles
    SET 
        total_points = new_points,
        level = new_level,
        updated_at = NOW()
    WHERE id::TEXT = current_user_uuid;
    
    -- 성공 응답
    RETURN json_build_object(
        'success', true,
        'goal_title', goal_data.title,
        'points_earned', goal_data.reward_points,
        'total_points', new_points,
        'current_level', new_level,
        'level_up', (new_level > profile_data.level)
    );
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION simple_complete_goal(TEXT) TO authenticated;

SELECT 'Simple goal completion function created successfully!' as result;