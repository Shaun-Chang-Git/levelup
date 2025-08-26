-- ==========================================
-- LevelUp 도전과제 및 배지 기본 데이터
-- Phase 3.2: 고급 게이미피케이션
-- ==========================================

-- 배지 데이터 삽입
INSERT INTO badges (name, description, tier, unlock_type, unlock_condition, icon_emoji, color, bonus_points, rarity, sort_order) VALUES

-- Bronze 티어 배지 (기본 달성)
('첫 걸음', '첫 번째 목표를 완료하세요', 'bronze', 'goal_count', '{"target": 1}', '👶', '#CD7F32', 50, 'common', 1),
('습관 형성자', '첫 번째 습관을 7일 연속 완료하세요', 'bronze', 'streak_days', '{"target": 7}', '🌱', '#CD7F32', 50, 'common', 2),
('포인트 수집가', '총 1000 포인트를 획득하세요', 'bronze', 'points_total', '{"target": 1000}', '💰', '#CD7F32', 100, 'common', 3),
('레벨 업', '레벨 5에 도달하세요', 'bronze', 'level_reached', '{"target": 5}', '⬆️', '#CD7F32', 100, 'common', 4),

-- Silver 티어 배지 (중급 달성)
('목표 달성자', '10개의 목표를 완료하세요', 'silver', 'goal_count', '{"target": 10}', '🎯', '#C0C0C0', 150, 'common', 5),
('꾸준함의 힘', '30일 연속 습관을 완료하세요', 'silver', 'streak_days', '{"target": 30}', '🔥', '#C0C0C0', 200, 'rare', 6),
('포인트 마스터', '총 5000 포인트를 획득하세요', 'silver', 'points_total', '{"target": 5000}', '💎', '#C0C0C0', 200, 'common', 7),
('중급자', '레벨 10에 도달하세요', 'silver', 'level_reached', '{"target": 10}', '🚀', '#C0C0C0', 200, 'common', 8),
('도전자', '첫 번째 도전과제를 완료하세요', 'silver', 'challenge_winner', '{"target": 1}', '🏁', '#C0C0C0', 150, 'rare', 9),

-- Gold 티어 배지 (고급 달성)
('목표 전문가', '50개의 목표를 완료하세요', 'gold', 'goal_count', '{"target": 50}', '🏆', '#FFD700', 300, 'rare', 10),
('습관 마스터', '100일 연속 습관을 완료하세요', 'gold', 'streak_days', '{"target": 100}', '👑', '#FFD700', 500, 'epic', 11),
('포인트 제왕', '총 20000 포인트를 획득하세요', 'gold', 'points_total', '{"target": 20000}', '🌟', '#FFD700', 400, 'rare', 12),
('고급자', '레벨 20에 도달하세요', 'gold', 'level_reached', '{"target": 20}', '⚡', '#FFD700', 400, 'rare', 13),
('챔피언', '3개의 도전과제에서 1등을 하세요', 'gold', 'challenge_winner', '{"target": 3}', '🥇', '#FFD700', 400, 'epic', 14),

-- Platinum 티어 배지 (최고급 달성)
('목표 마에스트로', '100개의 목표를 완료하세요', 'platinum', 'goal_count', '{"target": 100}', '🎭', '#E5E4E2', 500, 'epic', 15),
('불굴의 의지', '365일 연속 습관을 완료하세요', 'platinum', 'streak_days', '{"target": 365}', '💪', '#E5E4E2', 1000, 'legendary', 16),
('포인트 황제', '총 50000 포인트를 획득하세요', 'platinum', 'points_total', '{"target": 50000}', '👑', '#E5E4E2', 600, 'epic', 17),
('마스터', '레벨 30에 도달하세요', 'platinum', 'level_reached', '{"target": 30}', '🎖️', '#E5E4E2', 600, 'epic', 18),

-- Diamond 티어 배지 (전설급 달성)
('전설의 달성자', '500개의 목표를 완료하세요', 'diamond', 'goal_count', '{"target": 500}', '💠', '#B9F2FF', 1000, 'legendary', 19),
('영원한 습관', '1000일 연속 습관을 완료하세요', 'diamond', 'streak_days', '{"target": 1000}', '🔮', '#B9F2FF', 2000, 'legendary', 20),
('포인트 신', '총 100000 포인트를 획득하세요', 'diamond', 'points_total', '{"target": 100000}', '🌌', '#B9F2FF', 1000, 'legendary', 21);

-- 기본 리더보드 생성
INSERT INTO leaderboards (name, description, type, time_period, max_entries, icon_emoji, color) VALUES
('전체 랭킹', '모든 사용자의 총 포인트 순위', 'total_points', 'all_time', 100, '🏆', '#FFD700'),
('레벨 랭킹', '레벨 기준 사용자 순위', 'level_ranking', 'all_time', 100, '⚡', '#1976d2'),
('이번 달 챔피언', '이번 달 획득한 포인트 순위', 'monthly_points', 'monthly', 50, '🌟', '#FF9800'),
('이번 주 스타', '이번 주 획득한 포인트 순위', 'weekly_points', 'weekly', 30, '⭐', '#4CAF50'),
('목표 달성 왕', '완료한 목표 개수 순위', 'goal_completions', 'all_time', 100, '🎯', '#9C27B0');

-- 일일 도전과제 데이터
INSERT INTO challenges (title, description, type, target_type, target_value, reward_points, difficulty, icon_emoji, background_color, status) VALUES

-- 일일 도전과제
('오늘의 목표', '오늘 1개의 목표를 완료하세요', 'daily', 'goal_completion', 1, 50, 'easy', '🎯', '#4CAF50', 'active'),
('습관 실천', '오늘 1개의 습관을 완료하세요', 'daily', 'habit_streak', 1, 50, 'easy', '✅', '#2196F3', 'active'),
('꾸준한 하루', '오늘 3개의 목표 또는 습관을 완료하세요', 'daily', 'goal_completion', 3, 100, 'medium', '🔥', '#FF9800', 'active'),
('완벽한 하루', '오늘 5개의 목표 또는 습관을 완료하세요', 'daily', 'goal_completion', 5, 200, 'hard', '💯', '#F44336', 'active'),

-- 주간 도전과제
('주간 달성자', '이번 주 7개의 목표를 완료하세요', 'weekly', 'goal_completion', 7, 300, 'medium', '📅', '#673AB7', 'active'),
('습관 마스터', '이번 주 7일 연속 같은 습관을 완료하세요', 'weekly', 'habit_streak', 7, 400, 'hard', '🏆', '#3F51B5', 'active'),
('카테고리 정복', '이번 주 3개 이상의 다른 카테고리에서 목표를 완료하세요', 'weekly', 'category_goals', 3, 350, 'medium', '🌈', '#009688', 'active'),
('어려운 도전', '이번 주 어려움 이상 난이도의 목표 3개를 완료하세요', 'weekly', 'difficulty_goals', 3, 500, 'expert', '⚡', '#795548', 'active'),

-- 월간 도전과제
('월간 챔피언', '이번 달 30개의 목표를 완료하세요', 'monthly', 'goal_completion', 30, 1000, 'hard', '👑', '#E91E63', 'active'),
('습관의 달인', '이번 달 30일 연속 습관을 유지하세요', 'monthly', 'habit_streak', 30, 1200, 'expert', '🎖️', '#9C27B0', 'active'),
('완벽주의자', '이번 달 모든 목표를 100% 달성하세요', 'monthly', 'goal_completion', 50, 1500, 'expert', '💎', '#607D8B', 'active'),

-- 특별 도전과제 (시즌 한정)
('신년 결심', '새해 첫 달에 20개의 목표를 완료하세요', 'special', 'goal_completion', 20, 2000, 'hard', '🎊', '#FF5722', 'active'),
('봄맞이 습관', '봄 시즌에 새로운 습관 5개를 시작하세요', 'special', 'habit_streak', 5, 1000, 'medium', '🌸', '#CDDC39', 'active'),
('여름 도전', '여름 3개월 동안 100개의 목표를 완료하세요', 'special', 'goal_completion', 100, 3000, 'expert', '☀️', '#FFC107', 'active');

-- 카테고리별 도전과제 (기존 카테고리 ID를 사용한다고 가정)
-- 실제 운영 시에는 categories 테이블의 실제 ID를 사용해야 합니다.

-- 도전과제 참여를 위한 샘플 함수 (사용자가 도전과제에 참여)
CREATE OR REPLACE FUNCTION join_challenge(
    p_user_id UUID,
    p_challenge_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge challenges;
    v_target_progress INTEGER;
    v_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 도전과제 정보 조회
    SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 이미 참여했는지 체크
    IF EXISTS (SELECT 1 FROM user_challenges WHERE user_id = p_user_id AND challenge_id = p_challenge_id) THEN
        RETURN FALSE;
    END IF;
    
    -- 목표 진행률 설정
    v_target_progress := v_challenge.target_value;
    
    -- 마감일 설정
    CASE v_challenge.type
        WHEN 'daily' THEN
            v_deadline := date_trunc('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second';
        WHEN 'weekly' THEN
            v_deadline := date_trunc('week', NOW()) + INTERVAL '1 week' - INTERVAL '1 second';
        WHEN 'monthly' THEN
            v_deadline := date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second';
        WHEN 'special' THEN
            v_deadline := COALESCE(v_challenge.end_date::TIMESTAMP WITH TIME ZONE, NOW() + INTERVAL '30 days');
        ELSE
            v_deadline := NOW() + INTERVAL '30 days';
    END CASE;
    
    -- 사용자 도전과제 생성
    INSERT INTO user_challenges (
        user_id, challenge_id, target_progress, deadline
    ) VALUES (
        p_user_id, p_challenge_id, v_target_progress, v_deadline
    );
    
    RETURN TRUE;
END;
$$;

-- 도전과제 자동 참여 함수 (일일/주간 도전과제의 경우)
CREATE OR REPLACE FUNCTION auto_join_periodic_challenges(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge challenges;
    v_joined_count INTEGER := 0;
BEGIN
    -- 일일/주간 도전과제 자동 참여
    FOR v_challenge IN
        SELECT * FROM challenges 
        WHERE type IN ('daily', 'weekly') 
        AND status = 'active'
        AND id NOT IN (
            SELECT challenge_id FROM user_challenges 
            WHERE user_id = p_user_id 
            AND (
                (type = 'daily' AND DATE(started_at) = CURRENT_DATE) OR
                (type = 'weekly' AND DATE_TRUNC('week', started_at) = DATE_TRUNC('week', NOW()))
            )
        )
    LOOP
        IF join_challenge(p_user_id, v_challenge.id) THEN
            v_joined_count := v_joined_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_joined_count;
END;
$$;

-- 만료된 도전과제 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    -- 만료된 사용자 도전과제를 실패로 처리
    UPDATE user_challenges 
    SET 
        status = 'failed',
        updated_at = NOW()
    WHERE status = 'active' 
    AND deadline < NOW()
    AND current_progress < target_progress;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$;

-- 일일 통계 업데이트 함수 (크론잡으로 실행)
CREATE OR REPLACE FUNCTION update_daily_challenge_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 만료된 도전과제 정리
    PERFORM cleanup_expired_challenges();
    
    -- 모든 활성 리더보드 업데이트
    PERFORM update_leaderboard(id) FROM leaderboards WHERE is_active = TRUE;
    
    -- 전체 사용자의 배지 획득 체크
    PERFORM check_and_award_badges(id) FROM profiles;
    
END;
$$;