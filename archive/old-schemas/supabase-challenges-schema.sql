-- ==========================================
-- LevelUp 도전과제 시스템 데이터베이스 스키마
-- Phase 3.2: 고급 게이미피케이션
-- ==========================================

-- 배지 시스템 테이블 (먼저 생성)
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- 배지 등급
    tier VARCHAR(20) NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    
    -- 획득 조건
    unlock_type VARCHAR(50) NOT NULL CHECK (unlock_type IN (
        'goal_count', 'streak_days', 'points_total', 'level_reached',
        'category_master', 'challenge_winner', 'special_event', 'manual'
    )),
    unlock_condition JSONB NOT NULL,
    
    -- 시각적 요소
    icon_emoji VARCHAR(10) DEFAULT '🏆',
    color VARCHAR(7) DEFAULT '#FFD700',
    
    -- 보상
    bonus_points INTEGER DEFAULT 0,
    
    -- 메타데이터
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_hidden BOOLEAN DEFAULT FALSE, -- 숨겨진 배지 (조건 충족 전까지 비공개)
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 도전과제 테이블
CREATE TABLE challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 도전과제 타입
    type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'special', 'seasonal')),
    
    -- 카테고리 연결
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- 도전 조건
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN (
        'goal_completion', 'habit_streak', 'points_earned', 'level_reached',
        'category_goals', 'consecutive_days', 'total_goals', 'difficulty_goals'
    )),
    target_value INTEGER NOT NULL DEFAULT 1,
    target_condition JSONB, -- 복잡한 조건을 위한 JSON 필드
    
    -- 보상
    reward_points INTEGER NOT NULL DEFAULT 100,
    reward_badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
    reward_title VARCHAR(100),
    
    -- 기간 설정
    start_date DATE,
    end_date DATE,
    duration_days INTEGER, -- 개인별 도전 기간
    
    -- 상태 및 메타데이터
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'ended', 'archived')),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    is_featured BOOLEAN DEFAULT FALSE,
    max_participants INTEGER, -- 참가자 수 제한 (NULL = 무제한)
    
    -- 이미지 및 아이콘
    icon_emoji VARCHAR(10) DEFAULT '🎯',
    background_color VARCHAR(7) DEFAULT '#1976d2',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 사용자 도전과제 참여 테이블
CREATE TABLE user_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    
    -- 참여 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
    
    -- 진행 상황
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN target_progress > 0 THEN (current_progress::DECIMAL / target_progress) * 100
            ELSE 0
        END
    ) STORED,
    
    -- 개인별 기간 (도전과제가 duration_days를 가진 경우)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 보상 수령 여부
    reward_claimed BOOLEAN DEFAULT FALSE,
    reward_claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- 추가 데이터
    notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약 조건
    UNIQUE(user_id, challenge_id)
);

-- 사용자 배지 소유 테이블
CREATE TABLE user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    
    -- 획득 정보
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    earned_through VARCHAR(50), -- 'challenge', 'achievement', 'manual', 'special_event'
    earned_from_id UUID, -- challenge_id 또는 achievement_id
    
    -- 배지 활성화 여부 (프로필에 표시)
    is_active BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- 메타데이터
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약 조건 (같은 배지는 한 번만 획득)
    UNIQUE(user_id, badge_id)
);

-- 도전과제 완료 이력 테이블
CREATE TABLE challenge_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_challenge_id UUID NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
    
    -- 완료 정보
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_time_days INTEGER, -- 완료에 걸린 일수
    final_progress INTEGER NOT NULL,
    
    -- 순위 정보
    completion_rank INTEGER, -- 해당 도전과제 완료 순위
    total_participants INTEGER, -- 완료 당시 총 참가자 수
    
    -- 보상 정보
    points_earned INTEGER DEFAULT 0,
    badge_earned UUID REFERENCES badges(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 리더보드 테이블
CREATE TABLE leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 리더보드 타입
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'total_points', 'level_ranking', 'goal_completions', 'streak_days',
        'challenge_completions', 'category_points', 'weekly_points', 'monthly_points'
    )),
    
    -- 필터 조건
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    time_period VARCHAR(20) CHECK (time_period IN ('all_time', 'yearly', 'monthly', 'weekly', 'daily')),
    start_date DATE,
    end_date DATE,
    
    -- 설정
    is_active BOOLEAN DEFAULT TRUE,
    max_entries INTEGER DEFAULT 100,
    update_frequency VARCHAR(20) DEFAULT 'daily' CHECK (update_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
    
    -- 시각적 설정
    icon_emoji VARCHAR(10) DEFAULT '🏆',
    color VARCHAR(7) DEFAULT '#FFD700',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 리더보드 엔트리 테이블
CREATE TABLE leaderboard_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 랭킹 정보
    rank_position INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    previous_rank INTEGER,
    rank_change INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN previous_rank IS NULL THEN 0
            ELSE previous_rank - rank_position
        END
    ) STORED,
    
    -- 추가 통계 (리더보드 타입에 따라 다름)
    additional_stats JSONB,
    
    -- 업데이트 정보
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약 조건
    UNIQUE(leaderboard_id, user_id),
    UNIQUE(leaderboard_id, rank_position)
);

-- ==========================================
-- 인덱스 생성
-- ==========================================

-- 도전과제 인덱스
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_category ON challenges(category_id);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX idx_challenges_featured ON challenges(is_featured) WHERE is_featured = TRUE;

-- 사용자 도전과제 인덱스
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_user_challenges_progress ON user_challenges(progress_percentage);

-- 배지 인덱스
CREATE INDEX idx_badges_tier ON badges(tier);
CREATE INDEX idx_badges_rarity ON badges(rarity);
CREATE INDEX idx_badges_unlock_type ON badges(unlock_type);

-- 사용자 배지 인덱스
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_active ON user_badges(is_active) WHERE is_active = TRUE;

-- 리더보드 인덱스
CREATE INDEX idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(leaderboard_id, rank_position);
CREATE INDEX idx_leaderboard_entries_user ON leaderboard_entries(user_id);

-- ==========================================
-- RLS (Row Level Security) 정책
-- ==========================================

-- 도전과제 RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active challenges" ON challenges
    FOR SELECT USING (status = 'active');

-- 사용자 도전과제 RLS
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenges" ON user_challenges
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- 배지 RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view non-hidden badges" ON badges
    FOR SELECT USING (is_hidden = FALSE);

-- 사용자 배지 RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own badges" ON user_badges
    FOR UPDATE USING (auth.uid() = user_id);

-- 리더보드 엔트리 RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard entries" ON leaderboard_entries
    FOR SELECT USING (TRUE);

-- ==========================================
-- 트리거 및 함수
-- ==========================================

-- 도전과제 진행률 업데이트 함수
CREATE OR REPLACE FUNCTION update_challenge_progress(
    p_user_id UUID,
    p_challenge_id UUID,
    p_progress_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_challenge user_challenges;
    v_challenge challenges;
BEGIN
    -- 사용자 도전과제 정보 조회
    SELECT * INTO v_user_challenge 
    FROM user_challenges 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 도전과제 정보 조회
    SELECT * INTO v_challenge 
    FROM challenges 
    WHERE id = p_challenge_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 진행률 업데이트
    UPDATE user_challenges 
    SET 
        current_progress = LEAST(current_progress + p_progress_increment, target_progress),
        updated_at = NOW()
    WHERE id = v_user_challenge.id;
    
    -- 완료 체크
    SELECT * INTO v_user_challenge 
    FROM user_challenges 
    WHERE id = v_user_challenge.id;
    
    IF v_user_challenge.current_progress >= v_user_challenge.target_progress THEN
        -- 도전과제 완료 처리
        PERFORM complete_user_challenge(v_user_challenge.id);
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 도전과제 완료 처리 함수
CREATE OR REPLACE FUNCTION complete_user_challenge(p_user_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_challenge user_challenges;
    v_challenge challenges;
    v_completion_rank INTEGER;
    v_total_participants INTEGER;
BEGIN
    -- 사용자 도전과제 정보 조회
    SELECT * INTO v_user_challenge 
    FROM user_challenges 
    WHERE id = p_user_challenge_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 도전과제 정보 조회
    SELECT * INTO v_challenge 
    FROM challenges 
    WHERE id = v_user_challenge.challenge_id;
    
    -- 완료 순위 계산
    SELECT COUNT(*) + 1 INTO v_completion_rank
    FROM challenge_completions 
    WHERE challenge_id = v_challenge.id;
    
    -- 총 참가자 수 계산
    SELECT COUNT(*) INTO v_total_participants
    FROM user_challenges 
    WHERE challenge_id = v_challenge.id;
    
    -- 사용자 도전과제 상태 업데이트
    UPDATE user_challenges 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_challenge_id;
    
    -- 완료 이력 생성
    INSERT INTO challenge_completions (
        user_id, challenge_id, user_challenge_id,
        completion_time_days, final_progress, completion_rank, total_participants,
        points_earned, badge_earned
    ) VALUES (
        v_user_challenge.user_id,
        v_challenge.id,
        p_user_challenge_id,
        EXTRACT(DAYS FROM (NOW() - v_user_challenge.started_at))::INTEGER,
        v_user_challenge.current_progress,
        v_completion_rank,
        v_total_participants,
        v_challenge.reward_points,
        v_challenge.reward_badge_id
    );
    
    -- 포인트 지급
    PERFORM add_points_to_user(v_user_challenge.user_id, v_challenge.reward_points, 'challenge_completion');
    
    -- 배지 지급 (있는 경우)
    IF v_challenge.reward_badge_id IS NOT NULL THEN
        INSERT INTO user_badges (user_id, badge_id, earned_through, earned_from_id)
        VALUES (v_user_challenge.user_id, v_challenge.reward_badge_id, 'challenge', v_challenge.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 배지 획득 체크 함수
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_badge badges;
    v_user_profile profiles;
    v_condition JSONB;
    v_awarded_count INTEGER := 0;
    v_check_result BOOLEAN;
BEGIN
    -- 사용자 프로필 조회
    SELECT * INTO v_user_profile FROM profiles WHERE id = p_user_id;
    
    -- 아직 획득하지 않은 배지들 체크
    FOR v_badge IN 
        SELECT b.* FROM badges b
        WHERE b.id NOT IN (
            SELECT badge_id FROM user_badges WHERE user_id = p_user_id
        )
        AND b.is_hidden = FALSE
    LOOP
        v_check_result := FALSE;
        v_condition := v_badge.unlock_condition;
        
        -- 배지 타입별 조건 체크
        CASE v_badge.unlock_type
            WHEN 'goal_count' THEN
                SELECT COUNT(*) >= (v_condition->>'target')::INTEGER INTO v_check_result
                FROM goals WHERE user_id = p_user_id AND status = 'completed';
                
            WHEN 'points_total' THEN
                SELECT v_user_profile.total_points >= (v_condition->>'target')::INTEGER INTO v_check_result;
                
            WHEN 'level_reached' THEN
                SELECT v_user_profile.level >= (v_condition->>'target')::INTEGER INTO v_check_result;
                
            WHEN 'streak_days' THEN
                SELECT MAX(streak_count) >= (v_condition->>'target')::INTEGER INTO v_check_result
                FROM goals WHERE user_id = p_user_id;
                
            WHEN 'challenge_winner' THEN
                SELECT COUNT(*) >= (v_condition->>'target')::INTEGER INTO v_check_result
                FROM challenge_completions 
                WHERE user_id = p_user_id AND completion_rank = 1;
        END CASE;
        
        -- 조건 충족 시 배지 지급
        IF v_check_result THEN
            INSERT INTO user_badges (user_id, badge_id, earned_through)
            VALUES (p_user_id, v_badge.id, 'achievement')
            ON CONFLICT (user_id, badge_id) DO NOTHING;
            
            -- 보너스 포인트 지급
            IF v_badge.bonus_points > 0 THEN
                PERFORM add_points_to_user(p_user_id, v_badge.bonus_points, 'badge_bonus');
            END IF;
            
            v_awarded_count := v_awarded_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_awarded_count;
END;
$$;

-- 리더보드 업데이트 함수
CREATE OR REPLACE FUNCTION update_leaderboard(p_leaderboard_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leaderboard leaderboards;
    v_user_data RECORD;
    v_rank INTEGER := 1;
BEGIN
    -- 리더보드 정보 조회
    SELECT * INTO v_leaderboard FROM leaderboards WHERE id = p_leaderboard_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 기존 순위 저장 (rank change 계산용)
    UPDATE leaderboard_entries 
    SET previous_rank = rank_position 
    WHERE leaderboard_id = p_leaderboard_id;
    
    -- 기존 엔트리 삭제
    DELETE FROM leaderboard_entries WHERE leaderboard_id = p_leaderboard_id;
    
    -- 리더보드 타입별 데이터 조회 및 삽입
    CASE v_leaderboard.type
        WHEN 'total_points' THEN
            FOR v_user_data IN
                SELECT up.id as user_id, up.total_points as score
                FROM profiles up
                ORDER BY up.total_points DESC
                LIMIT v_leaderboard.max_entries
            LOOP
                INSERT INTO leaderboard_entries (leaderboard_id, user_id, rank_position, score)
                VALUES (p_leaderboard_id, v_user_data.user_id, v_rank, v_user_data.score);
                v_rank := v_rank + 1;
            END LOOP;
            
        WHEN 'level_ranking' THEN
            FOR v_user_data IN
                SELECT up.id as user_id, up.level as score
                FROM profiles up
                ORDER BY up.level DESC, up.total_points DESC
                LIMIT v_leaderboard.max_entries
            LOOP
                INSERT INTO leaderboard_entries (leaderboard_id, user_id, rank_position, score)
                VALUES (p_leaderboard_id, v_user_data.user_id, v_rank, v_user_data.score);
                v_rank := v_rank + 1;
            END LOOP;
    END CASE;
    
    -- 리더보드 업데이트 시간 갱신
    UPDATE leaderboards 
    SET updated_at = NOW() 
    WHERE id = p_leaderboard_id;
    
    RETURN TRUE;
END;
$$;

-- ==========================================
-- 트리거 설정
-- ==========================================

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_challenges
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_challenges
    BEFORE UPDATE ON user_challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_badges
    BEFORE UPDATE ON badges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- 목표 완료 시 도전과제 진행률 업데이트 트리거
CREATE OR REPLACE FUNCTION trigger_update_challenges_on_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- 목표가 완료된 경우에만 실행
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 관련 도전과제들의 진행률 업데이트
        PERFORM update_challenge_progress_for_goal_completion(NEW.user_id, NEW.id);
        
        -- 배지 획득 체크
        PERFORM check_and_award_badges(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goal_completion_challenges
    AFTER UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_challenges_on_goal_completion();

-- 목표 완료에 따른 도전과제 업데이트 함수
CREATE OR REPLACE FUNCTION update_challenge_progress_for_goal_completion(
    p_user_id UUID,
    p_goal_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal goals;
    v_challenge challenges;
BEGIN
    -- 완료된 목표 정보 조회
    SELECT * INTO v_goal FROM goals WHERE id = p_goal_id;
    
    -- 관련 도전과제들 업데이트
    FOR v_challenge IN
        SELECT c.* FROM challenges c
        JOIN user_challenges uc ON c.id = uc.challenge_id
        WHERE uc.user_id = p_user_id 
        AND uc.status = 'active'
        AND c.status = 'active'
    LOOP
        CASE v_challenge.target_type
            WHEN 'goal_completion' THEN
                PERFORM update_challenge_progress(p_user_id, v_challenge.id, 1);
            WHEN 'category_goals' THEN
                IF v_challenge.target_condition->>'category_id' = v_goal.category_id::TEXT THEN
                    PERFORM update_challenge_progress(p_user_id, v_challenge.id, 1);
                END IF;
            WHEN 'difficulty_goals' THEN
                IF v_challenge.target_condition->>'difficulty' = v_goal.difficulty THEN
                    PERFORM update_challenge_progress(p_user_id, v_challenge.id, 1);
                END IF;
        END CASE;
    END LOOP;
END;
$$;