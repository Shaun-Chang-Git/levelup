-- 🎯 트리거 함수의 user_id 모호성 문제 해결
-- 문제: AFTER UPDATE 트리거가 실행될 때 user_id 컬럼 참조가 모호함

-- ========================================
-- 1. 문제가 되는 함수 수정
-- ========================================

-- check_and_award_achievements 함수 재작성 (모호성 제거)
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_stats RECORD;
  achievement RECORD;
BEGIN
  -- 사용자 통계 조회 (명시적 변수명 사용)
  SELECT 
    profiles.total_points,
    COUNT(CASE WHEN goals.status = 'completed' THEN 1 END) as completed_goals,
    COUNT(DISTINCT goals.category_id) as categories_completed,
    MAX(goals.completed_at) as last_completion,
    COUNT(CASE WHEN goals.completed_at >= CURRENT_DATE THEN 1 END) as today_completed,
    COUNT(CASE WHEN goals.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_completed
  INTO user_stats
  FROM profiles
  LEFT JOIN goals ON profiles.id = goals.user_id
  WHERE profiles.id = p_user_id  -- 명시적 파라미터 사용
  GROUP BY profiles.id, profiles.total_points;

  -- 업적 확인 루프
  FOR achievement IN 
    SELECT achievements.id, achievements.title, achievements.condition_type, achievements.condition_value
    FROM achievements
    WHERE achievements.is_active = true
  LOOP
    -- 업적 조건 확인 로직 (기존과 동일하지만 명시적 변수 사용)
    DECLARE
      condition_met BOOLEAN := false;
    BEGIN
      CASE achievement.condition_type
        WHEN 'total_goals' THEN
          condition_met := user_stats.completed_goals >= achievement.condition_value;
        WHEN 'total_points' THEN
          condition_met := user_stats.total_points >= achievement.condition_value;
        WHEN 'categories' THEN
          condition_met := user_stats.categories_completed >= achievement.condition_value;
        WHEN 'daily_goals' THEN
          condition_met := user_stats.today_completed >= achievement.condition_value;
        WHEN 'weekly_goals' THEN
          condition_met := user_stats.week_completed >= achievement.condition_value;
      END CASE;

      -- 업적 달성 시 추가
      IF condition_met THEN
        INSERT INTO user_achievements (user_id, achievement_id, earned_at)
        VALUES (p_user_id, achievement.id, NOW())
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      END IF;
    END;
  END LOOP;
END;
$$;

-- ========================================
-- 2. 트리거 함수 수정
-- ========================================

CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 목표가 완료된 경우에만 업적 체크 실행
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM check_and_award_achievements(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- ========================================
-- 3. 기존 트리거 재생성 (안전한 버전)
-- ========================================

-- 기존 트리거 제거 후 재생성
DROP TRIGGER IF EXISTS after_goal_completion ON goals;

CREATE TRIGGER after_goal_completion
  AFTER UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_achievement_check();

-- 권한 부여
GRANT EXECUTE ON FUNCTION check_and_award_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_achievement_check() TO authenticated;

SELECT '🎯 트리거 user_id 모호성 문제 해결 완료!' as result;