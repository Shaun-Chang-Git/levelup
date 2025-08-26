-- 반복 목표 (습관 추적) 시스템 스키마 추가
-- 기존 스키마 실행 후 추가로 실행

-- 1. 기존 goals 테이블에 반복 관련 컬럼 추가
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')) DEFAULT NULL;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL; -- 주간: [1,2,3] (월,화,수), 월간: [1,15] (1일,15일)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1; -- 매 N일/주/월마다
ALTER TABLE goals ADD COLUMN IF NOT EXISTS habit_streak INTEGER DEFAULT 0; -- 현재 연속 달성 일수
ALTER TABLE goals ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0; -- 최고 연속 달성 일수
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_completed_date DATE DEFAULT NULL; -- 마지막 완료 날짜
ALTER TABLE goals ADD COLUMN IF NOT EXISTS next_due_date DATE DEFAULT NULL; -- 다음 수행 예정 날짜

-- 2. 습관 완료 기록 테이블 (일일 체크)
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  completion_value INTEGER DEFAULT 1, -- 완료한 양 (예: 30분 운동 = 30)
  streak_day INTEGER DEFAULT 0, -- 이 완료가 몇 번째 연속 달성인지
  UNIQUE(goal_id, completion_date) -- 하루에 한 번만 완료 가능
);

-- 3. 습관 통계 집계 테이블 (성능 최적화용)
CREATE TABLE IF NOT EXISTS habit_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL, -- 주간 통계의 시작 날짜 (월요일)
  month_start_date DATE NOT NULL, -- 월간 통계의 시작 날짜 (1일)
  completed_days INTEGER DEFAULT 0, -- 해당 주/월에 완료한 일수
  total_possible_days INTEGER DEFAULT 0, -- 해당 주/월에 가능한 총 일수
  completion_rate DECIMAL(5,2) DEFAULT 0, -- 완료율 (%)
  current_streak INTEGER DEFAULT 0, -- 해당 기간 연속 달성 일수
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, week_start_date, month_start_date)
);

-- 4. 습관 리마인더/알림 설정 테이블
CREATE TABLE IF NOT EXISTS habit_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_time TIME NOT NULL, -- 알림 시간
  days_of_week INTEGER[] DEFAULT NULL, -- 알림 요일 [1,2,3,4,5] (월-금)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_goals_is_recurring ON goals(is_recurring);
CREATE INDEX IF NOT EXISTS idx_goals_recurrence_type ON goals(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_goals_next_due_date ON goals(next_due_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_goal_id ON habit_completions(goal_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_statistics_goal_id ON habit_statistics(goal_id);
CREATE INDEX IF NOT EXISTS idx_habit_statistics_user_id ON habit_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_statistics_week ON habit_statistics(week_start_date);
CREATE INDEX IF NOT EXISTS idx_habit_statistics_month ON habit_statistics(month_start_date);

-- 6. 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_habit_statistics_updated_at 
  BEFORE UPDATE ON habit_statistics 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_habit_reminders_updated_at 
  BEFORE UPDATE ON habit_reminders 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. 습관 완료 처리 함수
CREATE OR REPLACE FUNCTION complete_habit(
  p_goal_id UUID,
  p_completion_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_completion_value INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_goal_record RECORD;
  v_streak_day INTEGER := 0;
  v_new_streak INTEGER := 0;
  v_points_earned INTEGER := 0;
  v_result JSON;
BEGIN
  -- 목표 정보 조회
  SELECT user_id, habit_streak, longest_streak, last_completed_date, reward_points, recurrence_type
  INTO v_goal_record
  FROM goals 
  WHERE id = p_goal_id AND is_recurring = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '반복 목표를 찾을 수 없습니다: %', p_goal_id;
  END IF;

  v_user_id := v_goal_record.user_id;

  -- 이미 완료했는지 확인
  IF EXISTS (
    SELECT 1 FROM habit_completions 
    WHERE goal_id = p_goal_id AND completion_date = p_completion_date
  ) THEN
    RAISE EXCEPTION '이미 완료된 날짜입니다: %', p_completion_date;
  END IF;

  -- 연속 달성 계산
  IF v_goal_record.last_completed_date IS NULL THEN
    v_new_streak := 1;
  ELSIF p_completion_date = v_goal_record.last_completed_date + INTERVAL '1 day' THEN
    v_new_streak := v_goal_record.habit_streak + 1;
  ELSIF p_completion_date = v_goal_record.last_completed_date THEN
    -- 같은 날짜는 이미 위에서 체크됨
    v_new_streak := v_goal_record.habit_streak;
  ELSE
    -- 연속성이 끊어짐
    v_new_streak := 1;
  END IF;

  v_streak_day := v_new_streak;

  -- 습관 완료 기록 추가
  INSERT INTO habit_completions (
    goal_id, user_id, completion_date, notes, completion_value, streak_day
  ) VALUES (
    p_goal_id, v_user_id, p_completion_date, p_notes, p_completion_value, v_streak_day
  );

  -- 목표 업데이트
  UPDATE goals SET
    habit_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_completed_date = p_completion_date,
    current_value = current_value + p_completion_value,
    updated_at = NOW()
  WHERE id = p_goal_id;

  -- 포인트 계산 (연속 달성 보너스 적용)
  v_points_earned := v_goal_record.reward_points;
  
  -- 연속 달성 보너스 (7일마다 50% 보너스, 30일마다 100% 보너스)
  IF v_new_streak % 30 = 0 THEN
    v_points_earned := v_points_earned * 2; -- 30일 연속: 100% 보너스
  ELSIF v_new_streak % 7 = 0 THEN
    v_points_earned := ROUND(v_points_earned * 1.5); -- 7일 연속: 50% 보너스
  END IF;

  -- 사용자 포인트 업데이트
  UPDATE profiles SET
    total_points = total_points + v_points_earned,
    experience_points = experience_points + v_points_earned
  WHERE id = v_user_id;

  -- 레벨 업 체크 (간단한 레벨 공식: 100 * level^2)
  UPDATE profiles SET
    level = FLOOR(SQRT(experience_points / 100)) + 1
  WHERE id = v_user_id;

  -- 다음 수행 예정일 계산 및 업데이트
  PERFORM update_next_due_date(p_goal_id);

  -- 결과 반환
  v_result := json_build_object(
    'success', true,
    'points_earned', v_points_earned,
    'current_streak', v_new_streak,
    'is_streak_milestone', (v_new_streak % 7 = 0 OR v_new_streak % 30 = 0),
    'completion_date', p_completion_date
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 8. 다음 수행 예정일 계산 함수
CREATE OR REPLACE FUNCTION update_next_due_date(p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
  v_goal_record RECORD;
  v_next_date DATE;
  v_day_of_week INTEGER;
  v_current_day INTEGER;
  v_days_ahead INTEGER;
BEGIN
  SELECT recurrence_type, recurrence_days, recurrence_interval, last_completed_date
  INTO v_goal_record
  FROM goals 
  WHERE id = p_goal_id AND is_recurring = TRUE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  CASE v_goal_record.recurrence_type
    WHEN 'daily' THEN
      -- 매일 또는 N일마다
      v_next_date := COALESCE(v_goal_record.last_completed_date, CURRENT_DATE) + 
                     (v_goal_record.recurrence_interval || ' days')::INTERVAL;
    
    WHEN 'weekly' THEN
      -- 특정 요일들 (1=월요일, 7=일요일)
      v_current_day := EXTRACT(DOW FROM CURRENT_DATE); -- 0=일요일, 6=토요일
      IF v_current_day = 0 THEN v_current_day := 7; END IF; -- 1-7로 변환
      
      -- 다음 수행 요일 찾기
      v_days_ahead := NULL;
      FOR i IN 1..7 LOOP
        v_day_of_week := ((v_current_day + i - 1) % 7) + 1;
        IF v_goal_record.recurrence_days @> ARRAY[v_day_of_week] THEN
          v_days_ahead := i;
          EXIT;
        END IF;
      END LOOP;
      
      v_next_date := CURRENT_DATE + (COALESCE(v_days_ahead, 1) || ' days')::INTERVAL;
    
    WHEN 'monthly' THEN
      -- 특정 일자들
      v_next_date := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
      IF v_goal_record.recurrence_days IS NOT NULL AND array_length(v_goal_record.recurrence_days, 1) > 0 THEN
        v_next_date := v_next_date + (v_goal_record.recurrence_days[1] - 1 || ' days')::INTERVAL;
      END IF;
      
    ELSE
      v_next_date := CURRENT_DATE + INTERVAL '1 day';
  END CASE;

  -- 다음 수행 예정일 업데이트
  UPDATE goals SET
    next_due_date = v_next_date,
    updated_at = NOW()
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 습관 완료 취소 함수
CREATE OR REPLACE FUNCTION undo_habit_completion(
  p_goal_id UUID,
  p_completion_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  v_completion_record RECORD;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- 완료 기록 조회
  SELECT user_id, completion_value, streak_day
  INTO v_completion_record
  FROM habit_completions 
  WHERE goal_id = p_goal_id AND completion_date = p_completion_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION '완료 기록을 찾을 수 없습니다';
  END IF;

  v_user_id := v_completion_record.user_id;

  -- 완료 기록 삭제
  DELETE FROM habit_completions 
  WHERE goal_id = p_goal_id AND completion_date = p_completion_date;

  -- 목표 통계 재계산 (간단히 current_value만 조정)
  UPDATE goals SET
    current_value = GREATEST(0, current_value - v_completion_record.completion_value),
    updated_at = NOW()
  WHERE id = p_goal_id;

  -- 연속 달성 재계산은 복잡하므로 별도 함수로 처리 가능

  v_result := json_build_object(
    'success', true,
    'message', '습관 완료가 취소되었습니다'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 실행 완료 메시지
SELECT '반복 목표 (습관 추적) 시스템 스키마 생성 완료!' as message;