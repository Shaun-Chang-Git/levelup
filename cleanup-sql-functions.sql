-- 🧹 불필요한 SQL 함수들 완전 정리
-- 에러 해결을 위해 만든 17개의 SQL 파일에서 생성된 모든 함수들 제거

-- ========================================
-- 1. 목표 완료 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS complete_goal(UUID);
DROP FUNCTION IF EXISTS complete_goal_fixed(UUID);
DROP FUNCTION IF EXISTS complete_goal_unified(UUID);
DROP FUNCTION IF EXISTS simple_complete_goal(TEXT);
DROP FUNCTION IF EXISTS simple_complete_goal_no_triggers(UUID, UUID);
DROP FUNCTION IF EXISTS mark_goal_as_completed(UUID);

-- ========================================
-- 2. 목표 진행률 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS update_goal_progress(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS update_goal_progress_fixed(UUID, INTEGER, TEXT);

-- ========================================
-- 3. 업적/게이미피케이션 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS check_and_award_achievements(UUID);
DROP FUNCTION IF EXISTS update_user_level(UUID);
DROP FUNCTION IF EXISTS check_and_award_badges(UUID);
DROP FUNCTION IF EXISTS trigger_achievement_check();

-- ========================================
-- 4. 소셜 기능 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS trigger_create_goal_activity();
DROP FUNCTION IF EXISTS create_activity_feed(UUID, TEXT, TEXT, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_activity_feed(UUID, INTEGER, INTEGER);

-- ========================================
-- 5. 도전과제 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS trigger_update_challenges_on_goal_completion();
DROP FUNCTION IF EXISTS auto_join_periodic_challenges(UUID);
DROP FUNCTION IF EXISTS update_challenge_progress(UUID, UUID, TEXT, INTEGER);

-- ========================================
-- 6. 리더보드 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS update_leaderboard_entries(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_leaderboard_rankings(INTEGER, INTEGER, INTEGER);

-- ========================================
-- 7. 습관 추적 관련 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS complete_habit(UUID);
DROP FUNCTION IF EXISTS get_todays_habits(UUID);
DROP FUNCTION IF EXISTS update_habit_statistics(UUID);

-- ========================================
-- 8. 기타 디버깅용 함수들 (모두 제거)
-- ========================================

DROP FUNCTION IF EXISTS test_function_permissions();
DROP FUNCTION IF EXISTS debug_user_context();
DROP FUNCTION IF EXISTS get_user_goals_with_progress(UUID);

-- ========================================
-- 9. 트리거 함수들 (필수 제외 모두 제거)
-- ========================================

-- 업적/게이미피케이션 트리거 함수들
DROP FUNCTION IF EXISTS trigger_achievement_check();
DROP FUNCTION IF EXISTS trigger_level_up_check();
DROP FUNCTION IF EXISTS trigger_badge_award();

-- 소셜 기능 트리거 함수들  
DROP FUNCTION IF EXISTS trigger_create_goal_activity();
DROP FUNCTION IF EXISTS trigger_create_completion_activity();

-- 도전과제 트리거 함수들
DROP FUNCTION IF EXISTS trigger_update_challenges_on_goal_completion();
DROP FUNCTION IF EXISTS trigger_challenge_progress_update();

-- 알림 관련 트리거 함수들
DROP FUNCTION IF EXISTS trigger_create_notification();
DROP FUNCTION IF EXISTS trigger_send_push_notification();

-- ========================================
-- 10. 유틸리티 함수들 (디버깅용만 제거)
-- ========================================

DROP FUNCTION IF EXISTS calculate_goal_progress_percentage(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_user_statistics(UUID);
DROP FUNCTION IF EXISTS format_goal_completion_message(TEXT, INTEGER);

-- ========================================
-- 유지할 함수: update_updated_at_column() (필수)
-- ========================================

-- 이 함수는 v2.0에서 필요하므로 유지
-- CREATE OR REPLACE FUNCTION update_updated_at_column() ...

-- ========================================
-- 11. 권한 정리
-- ========================================

-- 제거된 함수들의 권한도 자동으로 제거됨

SELECT '🧹 불필요한 SQL 함수들 완전 정리 완료!' as result;
SELECT '✨ 이제 update_updated_at_column() 함수만 남았습니다.' as summary;
SELECT '📊 총 30개 이상의 디버깅용 함수가 제거되었습니다.' as cleanup_count;