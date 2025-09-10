-- 🔥 데이터베이스 완전 초기화
-- ⚠️ 주의: 모든 데이터가 삭제됩니다!

-- ========================================
-- 1단계: 모든 트리거 제거
-- ========================================

DROP TRIGGER IF EXISTS after_goal_completion ON goals;
DROP TRIGGER IF EXISTS trigger_goal_completion_activity ON goals;
DROP TRIGGER IF EXISTS trigger_goal_completion_challenges ON goals;
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- ========================================
-- 2단계: 모든 함수 제거
-- ========================================

DROP FUNCTION IF EXISTS complete_goal(UUID);
DROP FUNCTION IF EXISTS complete_goal_fixed(UUID);
DROP FUNCTION IF EXISTS complete_goal_unified(UUID);
DROP FUNCTION IF EXISTS simple_complete_goal_no_triggers(UUID, UUID);
DROP FUNCTION IF EXISTS update_goal_progress_fixed(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS check_and_award_achievements(UUID);
DROP FUNCTION IF EXISTS trigger_achievement_check();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ========================================
-- 3단계: 의존성 순서로 테이블 제거
-- ========================================

-- 소셜 기능 테이블들
DROP TABLE IF EXISTS activity_comments CASCADE;
DROP TABLE IF EXISTS activity_reactions CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS group_challenge_members CASCADE;
DROP TABLE IF EXISTS group_challenges CASCADE;
DROP TABLE IF EXISTS goal_shares CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;

-- 도전과제/배지 테이블들
DROP TABLE IF EXISTS leaderboard_entries CASCADE;
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS challenge_completions CASCADE;
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- 습관 추적 테이블들
DROP TABLE IF EXISTS habit_reminders CASCADE;
DROP TABLE IF EXISTS habit_statistics CASCADE;
DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS habits CASCADE;

-- 템플릿 테이블들
DROP TABLE IF EXISTS user_template_favorites CASCADE;
DROP TABLE IF EXISTS goal_templates CASCADE;

-- 핵심 테이블들
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS goal_progress CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 시퀀스 제거
DROP SEQUENCE IF EXISTS categories_id_seq CASCADE;
DROP SEQUENCE IF EXISTS achievements_id_seq CASCADE;
DROP SEQUENCE IF EXISTS challenges_id_seq CASCADE;
DROP SEQUENCE IF EXISTS badges_id_seq CASCADE;
DROP SEQUENCE IF EXISTS leaderboards_id_seq CASCADE;

-- ========================================
-- 4단계: RLS 정책 제거
-- ========================================

-- 정책들은 테이블과 함께 자동 삭제됨

SELECT '🔥 데이터베이스 완전 초기화 완료!' as result;
SELECT '📊 모든 기존 테이블, 함수, 트리거, 정책이 제거되었습니다.' as summary;