-- ==========================================
-- LevelUp 소셜 기능 추가 SQL 함수들
-- Phase 3.3-1: 소셜 기능 구현
-- ==========================================

-- 그룹 도전과제 진행률 업데이트 함수
CREATE OR REPLACE FUNCTION update_group_challenge_progress(
    p_user_id UUID,
    p_group_challenge_id UUID,
    p_progress_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member group_challenge_members;
    v_challenge group_challenges;
BEGIN
    -- 그룹 도전과제 멤버 정보 조회
    SELECT * INTO v_member
    FROM group_challenge_members 
    WHERE user_id = p_user_id 
    AND group_challenge_id = p_group_challenge_id 
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 그룹 도전과제 정보 조회
    SELECT * INTO v_challenge
    FROM group_challenges 
    WHERE id = p_group_challenge_id 
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 진행률 업데이트
    UPDATE group_challenge_members 
    SET 
        current_progress = LEAST(current_progress + p_progress_increment, target_progress),
        updated_at = NOW()
    WHERE id = v_member.id;
    
    -- 완료 체크
    SELECT * INTO v_member 
    FROM group_challenge_members 
    WHERE id = v_member.id;
    
    IF v_member.current_progress >= v_member.target_progress THEN
        -- 그룹 도전과제 완료 처리
        PERFORM complete_group_challenge_member(v_member.id);
    END IF;
    
    -- 순위 업데이트
    PERFORM update_group_challenge_rankings(p_group_challenge_id);
    
    RETURN TRUE;
END;
$$;

-- 그룹 도전과제 멤버 완료 처리 함수
CREATE OR REPLACE FUNCTION complete_group_challenge_member(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member group_challenge_members;
    v_challenge group_challenges;
    v_completion_rank INTEGER;
BEGIN
    -- 멤버 정보 조회
    SELECT * INTO v_member 
    FROM group_challenge_members 
    WHERE id = p_member_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 그룹 도전과제 정보 조회
    SELECT * INTO v_challenge 
    FROM group_challenges 
    WHERE id = v_member.group_challenge_id;
    
    -- 완료 순위 계산
    SELECT COUNT(*) + 1 INTO v_completion_rank
    FROM group_challenge_members 
    WHERE group_challenge_id = v_member.group_challenge_id 
    AND status = 'completed';
    
    -- 멤버 상태 업데이트
    UPDATE group_challenge_members 
    SET 
        status = 'completed',
        completed_at = NOW(),
        final_rank = v_completion_rank,
        updated_at = NOW()
    WHERE id = p_member_id;
    
    -- 포인트 지급 (1등은 추가 보상)
    DECLARE
        v_reward_points INTEGER := v_challenge.reward_points;
    BEGIN
        IF v_completion_rank = 1 THEN
            v_reward_points := ROUND(v_reward_points * v_challenge.winner_reward_multiplier);
        END IF;
        
        PERFORM add_points_to_user(v_member.user_id, v_reward_points, 'group_challenge_completion');
    END;
    
    -- 활동 피드 생성
    PERFORM create_activity_feed_entry(
        v_member.user_id,
        CASE 
            WHEN v_completion_rank = 1 THEN 'group_challenge_won'
            ELSE 'challenge_completed'
        END,
        CASE 
            WHEN v_completion_rank = 1 THEN format('그룹 도전과제에서 1등을 했습니다! 🏆')
            ELSE format('그룹 도전과제를 완료했습니다! (%d등)', v_completion_rank)
        END,
        format('"%s" 그룹 도전과제를 완료했습니다!', v_challenge.title),
        'friends',
        NULL,
        NULL,
        v_member.group_challenge_id,
        NULL,
        jsonb_build_object(
            'rank', v_completion_rank,
            'points_earned', v_reward_points
        )
    );
    
    RETURN TRUE;
END;
$$;

-- 그룹 도전과제 순위 업데이트 함수
CREATE OR REPLACE FUNCTION update_group_challenge_rankings(p_group_challenge_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member RECORD;
    v_rank INTEGER := 1;
BEGIN
    -- 진행률 기준으로 순위 업데이트
    FOR v_member IN
        SELECT id, current_progress
        FROM group_challenge_members
        WHERE group_challenge_id = p_group_challenge_id
        AND status IN ('active', 'completed')
        ORDER BY current_progress DESC, updated_at ASC
    LOOP
        UPDATE group_challenge_members
        SET current_rank = v_rank
        WHERE id = v_member.id;
        
        v_rank := v_rank + 1;
    END LOOP;
END;
$$;

-- 레벨업 시 활동 피드 생성 트리거 (기존 profiles 테이블 업데이트 시)
CREATE OR REPLACE FUNCTION trigger_create_level_up_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- 레벨이 올라간 경우
    IF NEW.level > OLD.level THEN
        -- 활동 피드 생성
        PERFORM create_activity_feed_entry(
            NEW.id,
            'level_up',
            format('레벨 %d에 달성했습니다! ⬆️', NEW.level),
            format('축하합니다! 레벨 %d로 올라갔습니다!', NEW.level),
            'friends',
            NULL,
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'new_level', NEW.level,
                'old_level', OLD.level,
                'total_points', NEW.total_points
            )
        );
        
        -- 레벨업 알림 생성
        PERFORM create_notification(
            NEW.id,
            'level_up',
            format('레벨 %d 달성!', NEW.level),
            format('축하합니다! 레벨 %d로 올라갔습니다!', NEW.level),
            NULL,
            NULL,
            NULL,
            NULL,
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블에 레벨업 트리거 추가 (기존에 없다면)
DROP TRIGGER IF EXISTS trigger_level_up_activity ON profiles;
CREATE TRIGGER trigger_level_up_activity
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_create_level_up_activity();

-- 새로운 팔로우 시 활동 피드 생성 트리거
CREATE OR REPLACE FUNCTION trigger_create_follow_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_follower_name VARCHAR(50);
    v_following_name VARCHAR(50);
BEGIN
    -- 새로운 팔로우인 경우에만
    IF TG_OP = 'INSERT' AND NEW.is_mutual = TRUE THEN
        -- 사용자 이름 조회
        SELECT display_name INTO v_follower_name
        FROM profiles WHERE id = NEW.follower_id;
        
        SELECT display_name INTO v_following_name
        FROM profiles WHERE id = NEW.following_id;
        
        -- 양쪽 사용자의 활동 피드에 친구 추가 활동 생성
        PERFORM create_activity_feed_entry(
            NEW.follower_id,
            'friend_added',
            format('%s님과 친구가 되었습니다! 👥', COALESCE(v_following_name, '사용자')),
            format('%s님과 서로 팔로우하여 친구가 되었습니다!', COALESCE(v_following_name, '사용자')),
            'friends',
            NULL,
            NULL,
            NULL,
            NULL,
            jsonb_build_object('friend_id', NEW.following_id)
        );
        
        PERFORM create_activity_feed_entry(
            NEW.following_id,
            'friend_added',
            format('%s님과 친구가 되었습니다! 👥', COALESCE(v_follower_name, '사용자')),
            format('%s님과 서로 팔로우하여 친구가 되었습니다!', COALESCE(v_follower_name, '사용자')),
            'friends',
            NULL,
            NULL,
            NULL,
            NULL,
            jsonb_build_object('friend_id', NEW.follower_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_activity
    AFTER INSERT OR UPDATE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION trigger_create_follow_activity();

-- 습관 연속 달성 시 활동 피드 생성 (기존 goals 테이블의 habit_streak 업데이트 시)
CREATE OR REPLACE FUNCTION trigger_create_habit_streak_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- 습관 연속 달성이 마일스톤에 도달한 경우 (7, 30, 100, 365일)
    IF NEW.habit_streak IS NOT NULL AND NEW.habit_streak > OLD.habit_streak AND 
       NEW.habit_streak IN (7, 30, 100, 365) THEN
        
        -- 활동 피드 생성
        PERFORM create_activity_feed_entry(
            NEW.user_id,
            'habit_streak',
            format('%d일 연속 습관을 달성했습니다! 🔥', NEW.habit_streak),
            format('"%s" 습관을 %d일 연속으로 완료했습니다!', NEW.title, NEW.habit_streak),
            'friends',
            NEW.id,
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'streak_days', NEW.habit_streak,
                'habit_title', NEW.title
            )
        );
        
        -- 마일스톤 달성 알림
        PERFORM create_notification(
            NEW.user_id,
            'streak_milestone',
            format('%d일 연속 달성!', NEW.habit_streak),
            format('"%s" 습관을 %d일 연속으로 완료했습니다! 계속 화이팅하세요!', NEW.title, NEW.habit_streak),
            NULL,
            NEW.id,
            NULL,
            NULL,
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- goals 테이블에 습관 연속 달성 트리거 추가
DROP TRIGGER IF EXISTS trigger_habit_streak_activity ON goals;
CREATE TRIGGER trigger_habit_streak_activity
    AFTER UPDATE ON goals
    FOR EACH ROW 
    WHEN (NEW.is_recurring = TRUE)
    EXECUTE FUNCTION trigger_create_habit_streak_activity();

-- 목표 공유 시 활동 피드 생성 트리거
CREATE OR REPLACE FUNCTION trigger_create_goal_share_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_goal goals;
BEGIN
    -- 목표 정보 조회
    SELECT * INTO v_goal FROM goals WHERE id = NEW.goal_id;
    
    -- 공개 또는 친구 공유인 경우에만 활동 피드 생성
    IF NEW.share_type IN ('public', 'friends') THEN
        PERFORM create_activity_feed_entry(
            NEW.user_id,
            'goal_shared',
            '새로운 목표를 공유했습니다! 📢',
            format('"%s" 목표를 공유했습니다. %s', 
                   v_goal.title, 
                   COALESCE(NEW.share_message, '함께 응원해주세요!')),
            NEW.share_type,
            NEW.goal_id,
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'share_type', NEW.share_type,
                'goal_difficulty', v_goal.difficulty
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goal_share_activity
    AFTER INSERT ON goal_shares
    FOR EACH ROW EXECUTE FUNCTION trigger_create_goal_share_activity();

-- 활동 반응 수 업데이트 트리거 함수들
CREATE OR REPLACE FUNCTION update_activity_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE activity_feed 
        SET likes_count = likes_count + 1
        WHERE id = NEW.activity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE activity_feed 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.activity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON activity_reactions
    FOR EACH ROW EXECUTE FUNCTION update_activity_likes_count();

-- 댓글 수 업데이트 트리거
CREATE OR REPLACE FUNCTION update_activity_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE activity_feed 
        SET comments_count = comments_count + 1
        WHERE id = NEW.activity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE activity_feed 
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.activity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON activity_comments
    FOR EACH ROW EXECUTE FUNCTION update_activity_comments_count();

-- 댓글에 대한 알림 생성 트리거
CREATE OR REPLACE FUNCTION trigger_create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_activity activity_feed;
    v_commenter_name VARCHAR(50);
BEGIN
    -- 활동 정보 조회
    SELECT * INTO v_activity FROM activity_feed WHERE id = NEW.activity_id;
    
    -- 자기 자신의 활동에는 알림 생성하지 않음
    IF v_activity.user_id != NEW.user_id THEN
        -- 댓글 작성자 이름 조회
        SELECT display_name INTO v_commenter_name
        FROM profiles
        WHERE id = NEW.user_id;
        
        -- 알림 생성
        PERFORM create_notification(
            v_activity.user_id,
            'activity_comment',
            format('%s님이 댓글을 남겼습니다', COALESCE(v_commenter_name, '누군가')),
            CASE 
                WHEN LENGTH(NEW.content) > 50 THEN LEFT(NEW.content, 47) || '...'
                ELSE NEW.content
            END,
            NEW.user_id,
            NULL,
            NULL,
            NEW.activity_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_notification
    AFTER INSERT ON activity_comments
    FOR EACH ROW EXECUTE FUNCTION trigger_create_comment_notification();

-- 활동 피드 정리 함수 (오래된 활동 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    -- 90일 이상 된 활동 삭제 (중요한 활동은 제외)
    DELETE FROM activity_feed 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND activity_type NOT IN ('badge_earned', 'level_up', 'challenge_completed');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- 알림 정리 함수 (오래된 읽은 알림 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    -- 30일 이상 된 읽은 알림 삭제
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND read_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;