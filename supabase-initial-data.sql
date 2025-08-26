-- LevelUp 애플리케이션 초기 데이터 삽입
-- 실행 순서: supabase-schema.sql, supabase-rls-policies.sql 실행 후 이 파일을 실행

-- 1. 기본 카테고리 데이터 삽입
INSERT INTO categories (name, description, icon, color) VALUES
('학습', '책읽기, 강의 수강, 새로운 기술 습득 등', 'book', '#3B82F6'),
('건강', '운동, 다이어트, 금연/금주 등', 'fitness', '#10B981'),
('취미', '음악, 미술, 요리, 여행 등', 'palette', '#8B5CF6'),
('커리어', '자격증 취득, 프로젝트 완성, 네트워킹 등', 'briefcase', '#F59E0B'),
('생활습관', '일찍 일어나기, 정리정돈, 시간관리 등', 'clock', '#EF4444'),
('인간관계', '가족시간, 친구만나기, 새로운 사람들과 만나기 등', 'users', '#EC4899'),
('재정관리', '저축, 투자, 가계부 작성 등', 'dollar-sign', '#059669'),
('자기계발', '명상, 일기쓰기, 독서, 성찰 등', 'trending-up', '#7C3AED');

-- 2. 기본 업적/뱃지 데이터 삽입
INSERT INTO achievements (name, description, icon, badge_color, condition_type, condition_value, reward_points) VALUES
-- 목표 완료 관련 업적
('첫 걸음', '첫 번째 목표를 완료하세요', 'star', '#FFD700', 'goal_complete', 1, 100),
('열정적인 도전자', '5개의 목표를 완료하세요', 'award', '#FFD700', 'goal_complete', 5, 300),
('목표 달성 마스터', '10개의 목표를 완료하세요', 'trophy', '#FFD700', 'goal_complete', 10, 500),
('완벽주의자', '25개의 목표를 완료하세요', 'crown', '#FFD700', 'goal_complete', 25, 1000),

-- 연속 달성 관련 업적
('꾸준함의 시작', '3일 연속 목표를 달성하세요', 'calendar', '#FF6B6B', 'streak', 3, 150),
('습관의 형성', '7일 연속 목표를 달성하세요', 'flame', '#FF6B6B', 'streak', 7, 400),
('철인', '30일 연속 목표를 달성하세요', 'shield', '#FF6B6B', 'streak', 30, 1500),

-- 포인트 누적 관련 업적
('점수 수집가', '1000포인트를 모으세요', 'gem', '#4ECDC4', 'total_points', 1000, 200),
('포인트 마스터', '5000포인트를 모으세요', 'diamond', '#4ECDC4', 'total_points', 5000, 800),
('레전드', '10000포인트를 모으세요', 'star', '#4ECDC4', 'total_points', 10000, 2000),

-- 카테고리별 특별 업적
('책벌레', '학습 카테고리에서 10개의 목표를 완료하세요', 'book-open', '#3B82F6', 'category_goals', 10, 600),
('헬스 마니아', '건강 카테고리에서 15개의 목표를 완료하세요', 'heart', '#10B981', 'category_goals', 15, 800),
('취미 전문가', '취미 카테고리에서 8개의 목표를 완료하세요', 'palette', '#8B5CF6', 'category_goals', 8, 500),
('커리어 전문가', '커리어 카테고리에서 12개의 목표를 완료하세요', 'trending-up', '#F59E0B', 'category_goals', 12, 700);

-- 3. 샘플 목표 데이터 (테스트용 - 실제 운영에서는 제거)
-- 주의: 이 데이터는 실제 사용자 ID가 있어야 작동합니다
-- 개발/테스트 환경에서만 사용하세요

-- 4. 업적 달성 체크 함수
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_stats RECORD;
  achievement RECORD;
  newly_earned achievements%ROWTYPE;
  awarded_count INTEGER := 0;
BEGIN
  -- 사용자 통계 수집
  SELECT 
    p.total_points,
    COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals,
    MAX(g.streak_count) as max_streak,
    COUNT(CASE WHEN g.status = 'completed' AND g.category_id = (SELECT id FROM categories WHERE name = '학습') THEN 1 END) as learning_goals,
    COUNT(CASE WHEN g.status = 'completed' AND g.category_id = (SELECT id FROM categories WHERE name = '건강') THEN 1 END) as health_goals,
    COUNT(CASE WHEN g.status = 'completed' AND g.category_id = (SELECT id FROM categories WHERE name = '취미') THEN 1 END) as hobby_goals,
    COUNT(CASE WHEN g.status = 'completed' AND g.category_id = (SELECT id FROM categories WHERE name = '커리어') THEN 1 END) as career_goals
  INTO user_stats
  FROM profiles p
  LEFT JOIN goals g ON p.id = g.user_id
  WHERE p.id = user_id
  GROUP BY p.id, p.total_points;
  
  -- 각 업적 조건 체크
  FOR achievement IN 
    SELECT a.* FROM achievements a
    WHERE a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.user_id = user_id AND ua.achievement_id = a.id
    )
  LOOP
    -- 조건별 체크
    IF (achievement.condition_type = 'goal_complete' AND user_stats.completed_goals >= achievement.condition_value) OR
       (achievement.condition_type = 'streak' AND user_stats.max_streak >= achievement.condition_value) OR
       (achievement.condition_type = 'total_points' AND user_stats.total_points >= achievement.condition_value) OR
       (achievement.condition_type = 'category_goals' AND achievement.name LIKE '%학습%' AND user_stats.learning_goals >= achievement.condition_value) OR
       (achievement.condition_type = 'category_goals' AND achievement.name LIKE '%건강%' AND user_stats.health_goals >= achievement.condition_value) OR
       (achievement.condition_type = 'category_goals' AND achievement.name LIKE '%취미%' AND user_stats.hobby_goals >= achievement.condition_value) OR
       (achievement.condition_type = 'category_goals' AND achievement.name LIKE '%커리어%' AND user_stats.career_goals >= achievement.condition_value) THEN
       
      -- 업적 달성 기록
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (user_id, achievement.id);
      
      -- 보상 포인트 지급
      IF achievement.reward_points > 0 THEN
        UPDATE profiles 
        SET total_points = total_points + achievement.reward_points,
            updated_at = NOW()
        WHERE id = user_id;
      END IF;
      
      awarded_count := awarded_count + 1;
    END IF;
  END LOOP;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'newly_earned_count', awarded_count,
    'message', awarded_count || '개의 새로운 업적을 달성했습니다!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 목표 완료 시 자동 업적 체크 트리거 함수
CREATE OR REPLACE FUNCTION trigger_achievement_check()
RETURNS TRIGGER AS $$
BEGIN
  -- 목표가 완료 상태로 변경될 때만 실행
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM check_and_award_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 목표 완료 트리거 생성
CREATE TRIGGER after_goal_completion
  AFTER UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_achievement_check();

-- 7. 사용자 레벨 계산 함수
CREATE OR REPLACE FUNCTION calculate_user_level(total_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- 1000포인트당 1레벨, 최소 1레벨
  RETURN GREATEST(1, total_points / 1000 + 1);
END;
$$ LANGUAGE plpgsql;

-- 8. 레벨업 체크 및 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_level(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  new_level INTEGER;
  level_up BOOLEAN := false;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  new_level := calculate_user_level(user_profile.total_points);
  
  IF new_level > user_profile.level THEN
    UPDATE profiles 
    SET level = new_level,
        experience_points = user_profile.total_points - ((new_level - 1) * 1000),
        updated_at = NOW()
    WHERE id = user_id;
    
    level_up := true;
  END IF;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'level_up', level_up,
    'current_level', new_level,
    'total_points', user_profile.total_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 실행 완료 메시지
SELECT 'LevelUp 초기 데이터 및 게이미피케이션 함수 설정 완료!' as message;
SELECT COUNT(*) || '개의 카테고리가 생성되었습니다.' as categories_count FROM categories;
SELECT COUNT(*) || '개의 업적이 생성되었습니다.' as achievements_count FROM achievements;