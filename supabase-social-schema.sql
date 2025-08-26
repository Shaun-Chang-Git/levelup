-- ==========================================
-- LevelUp 소셜 기능 데이터베이스 스키마
-- Phase 3.3-1: 소셜 기능 구현
-- ==========================================

-- 사용자 팔로우 관계 테이블 (친구 시스템)
CREATE TABLE user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 팔로우 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'muted')),
    
    -- 친구 관계 (상호 팔로우)
    is_mutual BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 자기 자신을 팔로우할 수 없고, 중복 팔로우 방지
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- 목표 공유 설정 테이블
CREATE TABLE goal_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 공유 타입
    share_type VARCHAR(20) NOT NULL DEFAULT 'friends' CHECK (share_type IN ('public', 'friends', 'followers', 'private')),
    
    -- 공유 설정
    allow_comments BOOLEAN DEFAULT TRUE,
    allow_reactions BOOLEAN DEFAULT TRUE,
    show_progress BOOLEAN DEFAULT TRUE,
    
    -- 공유 메타데이터
    share_message TEXT,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 하나의 목표는 한 번만 공유
    UNIQUE(goal_id, user_id)
);

-- 그룹 도전과제 테이블
CREATE TABLE group_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 기본 정보
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 그룹 설정
    max_members INTEGER DEFAULT 10,
    join_type VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (join_type IN ('open', 'invite_only', 'request')),
    
    -- 도전과제 조건 (기존 challenges 테이블 참조)
    base_challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    target_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    
    -- 기간 설정
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    
    -- 보상 설정
    reward_points INTEGER DEFAULT 0,
    winner_reward_multiplier DECIMAL(3,2) DEFAULT 1.5, -- 1등 추가 보상
    
    -- 시각적 설정
    icon_emoji VARCHAR(10) DEFAULT '👥',
    background_color VARCHAR(7) DEFAULT '#FF6B6B',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 그룹 도전과제 참가자 테이블
CREATE TABLE group_challenge_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_challenge_id UUID NOT NULL REFERENCES group_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 참가 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'left', 'kicked')),
    
    -- 진행 상황
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN target_progress > 0 THEN (current_progress::DECIMAL / target_progress) * 100
            ELSE 0
        END
    ) STORED,
    
    -- 순위
    current_rank INTEGER,
    final_rank INTEGER, -- 완료 시 최종 순위
    
    -- 참가 정보
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 참가 방지
    UNIQUE(group_challenge_id, user_id)
);

-- 커뮤니티 활동 피드 테이블
CREATE TABLE activity_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 활동 타입
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'goal_created', 'goal_completed', 'goal_shared', 'habit_streak',
        'challenge_joined', 'challenge_completed', 'badge_earned', 'level_up',
        'friend_added', 'group_challenge_created', 'group_challenge_won'
    )),
    
    -- 활동 데이터
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 관련 객체 참조
    related_goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    related_challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    related_group_challenge_id UUID REFERENCES group_challenges(id) ON DELETE CASCADE,
    related_badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    
    -- 메타데이터
    metadata JSONB,
    
    -- 공개 설정
    visibility VARCHAR(20) NOT NULL DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'followers', 'private')),
    
    -- 통계
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동에 대한 반응 테이블 (좋아요, 응원 등)
CREATE TABLE activity_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 반응 타입
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'like' CHECK (reaction_type IN (
        'like', 'love', 'support', 'celebrate', 'wow', 'motivate'
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 활동에 대해 한 사용자는 하나의 반응만
    UNIQUE(activity_id, user_id)
);

-- 활동에 대한 댓글 테이블
CREATE TABLE activity_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 댓글 내용
    content TEXT NOT NULL,
    
    -- 대댓글 지원
    parent_comment_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE,
    
    -- 댓글 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 테이블
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 알림 타입
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'friend_request', 'goal_deadline', 'habit_reminder', 'challenge_invitation',
        'group_challenge_update', 'activity_reaction', 'activity_comment',
        'badge_earned', 'level_up', 'streak_milestone'
    )),
    
    -- 알림 내용
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- 관련 객체 참조
    related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    related_goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    related_challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    related_activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
    
    -- 알림 상태
    is_read BOOLEAN DEFAULT FALSE,
    is_pushed BOOLEAN DEFAULT FALSE, -- 푸시 알림 전송 여부
    
    -- 스케줄 알림
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 사용자 알림 설정 테이블
CREATE TABLE notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 알림 타입별 설정
    friend_requests BOOLEAN DEFAULT TRUE,
    goal_deadlines BOOLEAN DEFAULT TRUE,
    habit_reminders BOOLEAN DEFAULT TRUE,
    challenge_invitations BOOLEAN DEFAULT TRUE,
    activity_reactions BOOLEAN DEFAULT TRUE,
    activity_comments BOOLEAN DEFAULT TRUE,
    achievements BOOLEAN DEFAULT TRUE,
    
    -- 푸시 알림 설정
    push_enabled BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    
    -- 이메일 알림 설정
    email_enabled BOOLEAN DEFAULT TRUE,
    email_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 사용자당 하나의 설정
    UNIQUE(user_id)
);

-- ==========================================
-- 인덱스 생성
-- ==========================================

-- 팔로우 관계 인덱스
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_mutual ON user_follows(is_mutual) WHERE is_mutual = TRUE;

-- 목표 공유 인덱스
CREATE INDEX idx_goal_shares_user ON goal_shares(user_id);
CREATE INDEX idx_goal_shares_goal ON goal_shares(goal_id);
CREATE INDEX idx_goal_shares_type ON goal_shares(share_type);

-- 그룹 도전과제 인덱스
CREATE INDEX idx_group_challenges_creator ON group_challenges(creator_id);
CREATE INDEX idx_group_challenges_status ON group_challenges(status);
CREATE INDEX idx_group_challenge_members_group ON group_challenge_members(group_challenge_id);
CREATE INDEX idx_group_challenge_members_user ON group_challenge_members(user_id);

-- 활동 피드 인덱스
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX idx_activity_comments_activity ON activity_comments(activity_id);

-- 알림 인덱스
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ==========================================
-- RLS (Row Level Security) 정책
-- ==========================================

-- 팔로우 관계 RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view follows involving them" ON user_follows
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can create follows as follower" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can update their follows" ON user_follows
    FOR UPDATE USING (auth.uid() = follower_id);
CREATE POLICY "Users can delete their follows" ON user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- 목표 공유 RLS
ALTER TABLE goal_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view shared goals" ON goal_shares
    FOR SELECT USING (
        share_type = 'public' OR
        (share_type = 'friends' AND auth.uid() IN (
            SELECT following_id FROM user_follows WHERE follower_id = user_id AND is_mutual = TRUE
        )) OR
        (share_type = 'followers' AND auth.uid() IN (
            SELECT follower_id FROM user_follows WHERE following_id = user_id
        )) OR
        auth.uid() = user_id
    );
CREATE POLICY "Users can create goal shares" ON goal_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goal shares" ON goal_shares
    FOR UPDATE USING (auth.uid() = user_id);

-- 그룹 도전과제 RLS
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active group challenges" ON group_challenges
    FOR SELECT USING (status = 'active' AND join_type = 'open');
CREATE POLICY "Members can view their group challenges" ON group_challenges
    FOR SELECT USING (
        id IN (SELECT group_challenge_id FROM group_challenge_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can create group challenges" ON group_challenges
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their group challenges" ON group_challenges
    FOR UPDATE USING (auth.uid() = creator_id);

-- 그룹 도전과제 멤버 RLS
ALTER TABLE group_challenge_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view group challenge members" ON group_challenge_members
    FOR SELECT USING (
        group_challenge_id IN (
            SELECT group_challenge_id FROM group_challenge_members WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can join group challenges" ON group_challenge_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON group_challenge_members
    FOR UPDATE USING (auth.uid() = user_id);

-- 활동 피드 RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public activities" ON activity_feed
    FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can view friends activities" ON activity_feed
    FOR SELECT USING (
        visibility = 'friends' AND user_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = auth.uid() AND is_mutual = TRUE
        )
    );
CREATE POLICY "Users can view own activities" ON activity_feed
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own activities" ON activity_feed
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 알림 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 함수 및 트리거
-- ==========================================

-- 상호 팔로우 체크 함수
CREATE OR REPLACE FUNCTION update_mutual_follow_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 새로 팔로우가 생성될 때
    IF TG_OP = 'INSERT' THEN
        -- 상대방도 나를 팔로우하는지 확인
        IF EXISTS (
            SELECT 1 FROM user_follows 
            WHERE follower_id = NEW.following_id 
            AND following_id = NEW.follower_id 
            AND status = 'active'
        ) THEN
            -- 양방향 is_mutual 업데이트
            UPDATE user_follows 
            SET is_mutual = TRUE 
            WHERE (follower_id = NEW.follower_id AND following_id = NEW.following_id)
               OR (follower_id = NEW.following_id AND following_id = NEW.follower_id);
        END IF;
    END IF;
    
    -- 팔로우가 삭제될 때
    IF TG_OP = 'DELETE' THEN
        -- 상대방의 is_mutual 상태 업데이트
        UPDATE user_follows 
        SET is_mutual = FALSE 
        WHERE follower_id = OLD.following_id AND following_id = OLD.follower_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mutual_follow_status
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_mutual_follow_status();

-- 활동 피드 자동 생성 함수
CREATE OR REPLACE FUNCTION create_activity_feed_entry(
    p_user_id UUID,
    p_activity_type VARCHAR,
    p_title VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_visibility VARCHAR DEFAULT 'friends',
    p_related_goal_id UUID DEFAULT NULL,
    p_related_challenge_id UUID DEFAULT NULL,
    p_related_badge_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO activity_feed (
        user_id, activity_type, title, description, visibility,
        related_goal_id, related_challenge_id, related_badge_id, metadata
    ) VALUES (
        p_user_id, p_activity_type, p_title, p_description, p_visibility,
        p_related_goal_id, p_related_challenge_id, p_related_badge_id, p_metadata
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$;

-- 목표 완료 시 활동 피드 생성 트리거
CREATE OR REPLACE FUNCTION trigger_create_goal_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_goal_title VARCHAR(255);
    v_category_name VARCHAR(50);
BEGIN
    -- 목표가 완료된 경우
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 목표 정보 조회
        SELECT g.title, c.name INTO v_goal_title, v_category_name
        FROM goals g
        LEFT JOIN categories c ON g.category_id = c.id
        WHERE g.id = NEW.id;
        
        -- 활동 피드 생성
        PERFORM create_activity_feed_entry(
            NEW.user_id,
            'goal_completed',
            '목표를 달성했습니다! 🎉',
            format('"%s" 목표를 성공적으로 완료했습니다!', v_goal_title),
            'friends',
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object(
                'category', v_category_name,
                'difficulty', NEW.difficulty,
                'points_earned', NEW.reward_points
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goal_completion_activity
    AFTER UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION trigger_create_goal_activity();

-- 배지 획득 시 활동 피드 생성 트리거
CREATE OR REPLACE FUNCTION trigger_create_badge_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_badge_name VARCHAR(100);
    v_badge_tier VARCHAR(20);
BEGIN
    -- 배지 정보 조회
    SELECT name, tier INTO v_badge_name, v_badge_tier
    FROM badges
    WHERE id = NEW.badge_id;
    
    -- 활동 피드 생성
    PERFORM create_activity_feed_entry(
        NEW.user_id,
        'badge_earned',
        format('새로운 %s 배지를 획득했습니다!', v_badge_tier),
        format('"%s" 배지를 획득했습니다! 🏆', v_badge_name),
        'friends',
        NULL,
        NULL,
        NEW.badge_id,
        jsonb_build_object(
            'tier', v_badge_tier,
            'earned_through', NEW.earned_through
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_badge_earned_activity
    AFTER INSERT ON user_badges
    FOR EACH ROW EXECUTE FUNCTION trigger_create_badge_activity();

-- 알림 생성 함수
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_related_user_id UUID DEFAULT NULL,
    p_related_goal_id UUID DEFAULT NULL,
    p_related_challenge_id UUID DEFAULT NULL,
    p_related_activity_id UUID DEFAULT NULL,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_user_settings notification_settings;
BEGIN
    -- 사용자 알림 설정 확인
    SELECT * INTO v_user_settings
    FROM notification_settings
    WHERE user_id = p_user_id;
    
    -- 설정이 없으면 기본값으로 생성
    IF NOT FOUND THEN
        INSERT INTO notification_settings (user_id) VALUES (p_user_id);
        SELECT * INTO v_user_settings FROM notification_settings WHERE user_id = p_user_id;
    END IF;
    
    -- 알림 타입별 설정 확인
    IF (p_type = 'friend_request' AND v_user_settings.friend_requests) OR
       (p_type = 'goal_deadline' AND v_user_settings.goal_deadlines) OR
       (p_type = 'habit_reminder' AND v_user_settings.habit_reminders) OR
       (p_type = 'challenge_invitation' AND v_user_settings.challenge_invitations) OR
       (p_type = 'activity_reaction' AND v_user_settings.activity_reactions) OR
       (p_type = 'activity_comment' AND v_user_settings.activity_comments) OR
       (p_type IN ('badge_earned', 'level_up') AND v_user_settings.achievements) THEN
        
        INSERT INTO notifications (
            user_id, type, title, message,
            related_user_id, related_goal_id, related_challenge_id, related_activity_id,
            scheduled_for
        ) VALUES (
            p_user_id, p_type, p_title, p_message,
            p_related_user_id, p_related_goal_id, p_related_challenge_id, p_related_activity_id,
            p_scheduled_for
        ) RETURNING id INTO v_notification_id;
        
        RETURN v_notification_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 활동 반응 시 알림 생성
CREATE OR REPLACE FUNCTION trigger_create_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_activity activity_feed;
    v_reactor_name VARCHAR(50);
BEGIN
    -- 활동 정보 조회
    SELECT * INTO v_activity FROM activity_feed WHERE id = NEW.activity_id;
    
    -- 자기 자신의 활동에는 알림 생성하지 않음
    IF v_activity.user_id != NEW.user_id THEN
        -- 반응한 사용자 이름 조회
        SELECT display_name INTO v_reactor_name
        FROM profiles
        WHERE id = NEW.user_id;
        
        -- 알림 생성
        PERFORM create_notification(
            v_activity.user_id,
            'activity_reaction',
            format('%s님이 회원님의 활동에 %s했습니다', 
                   COALESCE(v_reactor_name, '누군가'), 
                   CASE NEW.reaction_type
                       WHEN 'like' THEN '좋아요를'
                       WHEN 'love' THEN '사랑을'
                       WHEN 'support' THEN '응원을'
                       WHEN 'celebrate' THEN '축하를'
                       ELSE '반응을'
                   END),
            v_activity.title,
            NEW.user_id,
            NULL,
            NULL,
            NEW.activity_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reaction_notification
    AFTER INSERT ON activity_reactions
    FOR EACH ROW EXECUTE FUNCTION trigger_create_reaction_notification();

-- updated_at 자동 업데이트 트리거들
CREATE TRIGGER set_timestamp_user_follows
    BEFORE UPDATE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_goal_shares
    BEFORE UPDATE ON goal_shares
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_group_challenges
    BEFORE UPDATE ON group_challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_group_challenge_members
    BEFORE UPDATE ON group_challenge_members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_activity_comments
    BEFORE UPDATE ON activity_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_notification_settings
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();