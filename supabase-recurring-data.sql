-- 반복 목표 (습관) 템플릿 데이터 추가
-- supabase-recurring-schema.sql 실행 후 추가로 실행

-- 1. 반복 목표 전용 템플릿 추가 (기존 템플릿을 반복형으로 업데이트)

-- 건강/운동 관련 습관 템플릿
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
-- 일일 습관들
('매일 30분 운동', '건강한 생활을 위해 매일 30분씩 운동하는 습관', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'medium', 30, '분', 365, ARRAY['운동', '건강', '일일습관', '30분'], TRUE, NULL),
('매일 10,000보 걷기', '매일 만보 걷기로 기초 체력 향상', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'easy', 10000, '보', 365, ARRAY['걷기', '만보', '일일습관'], TRUE, NULL),
('매일 물 8잔 마시기', '충분한 수분 섭취로 건강 관리', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'easy', 8, '잔', 365, ARRAY['물', '수분섭취', '일일습관'], TRUE, NULL),
('매일 7시간 수면', '충분한 수면으로 건강한 생활리듬 유지', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'medium', 7, '시간', 365, ARRAY['수면', '휴식', '일일습관'], TRUE, NULL),

-- 주간 습관들
('주 3회 헬스장 가기', '규칙적인 근력운동으로 체력 향상', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'medium', 3, '회', 365, ARRAY['헬스장', '근력운동', '주간습관'], TRUE, NULL),
('주 2회 요가하기', '몸과 마음의 균형을 위한 요가 습관', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'easy', 2, '회', 365, ARRAY['요가', '스트레칭', '주간습관'], TRUE, NULL);

-- 학습/성장 관련 습관 템플릿
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
-- 일일 학습 습관들
('매일 30분 독서', '꾸준한 독서로 지식과 교양 쌓기', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'medium', 30, '분', 365, ARRAY['독서', '학습', '일일습관'], TRUE, NULL),
('매일 영어 단어 10개 암기', '꾸준한 영어 학습으로 어휘력 향상', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'easy', 10, '개', 365, ARRAY['영어', '단어암기', '일일습관'], TRUE, NULL),
('매일 일기 쓰기', '하루를 정리하고 성찰하는 시간', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'easy', 1, '편', 365, ARRAY['일기', '글쓰기', '성찰', '일일습관'], TRUE, NULL),

-- 주간 학습 습관들
('주 5회 온라인 강의 수강', '체계적인 학습으로 전문성 향상', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'medium', 5, '회', 365, ARRAY['온라인강의', '전문학습', '주간습관'], TRUE, NULL);

-- 생산성/자기계발 관련 습관 템플릿
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
-- 일일 생산성 습관들
('매일 계획 세우기', '하루를 계획적으로 보내는 습관', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'easy', 1, '번', 365, ARRAY['계획', '일정관리', '일일습관'], TRUE, NULL),
('매일 감사 3가지 적기', '긍정적인 마음가짐을 기르는 감사 습관', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'easy', 3, '가지', 365, ARRAY['감사', '긍정', '일일습관'], TRUE, NULL),
('매일 스마트폰 사용 2시간 이하', '디지털 디톡스로 집중력 향상', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'hard', 2, '시간', 365, ARRAY['디지털디톡스', '집중력', '일일습관'], TRUE, NULL),

-- 주간 생산성 습관들
('주 1회 주간 회고', '한 주를 돌아보고 다음 주 계획 세우기', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'medium', 1, '회', 365, ARRAY['회고', '계획', '주간습관'], TRUE, NULL),
('주 2회 정리 정돈', '깔끔한 환경 유지로 생산성 향상', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'medium', 2, '회', 365, ARRAY['정리정돈', '환경개선', '주간습관'], TRUE, NULL);

-- 취미/여가 관련 습관 템플릿  
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
-- 일일 취미 습관들
('매일 음악 30분 듣기', '좋은 음악으로 마음의 여유 갖기', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'easy', 30, '분', 365, ARRAY['음악감상', '여가', '일일습관'], TRUE, NULL),
('매일 산책 20분', '자연을 즐기며 마음의 평화 찾기', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'easy', 20, '분', 365, ARRAY['산책', '자연', '일일습관'], TRUE, NULL),

-- 주간 취미 습관들
('주 1회 새로운 요리 도전', '요리 실력 향상과 즐거운 식사', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'medium', 1, '개', 365, ARRAY['요리', '새로운도전', '주간습관'], TRUE, NULL),
('주 2회 사진 촬영', '일상의 아름다운 순간들 기록하기', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'easy', 2, '회', 365, ARRAY['사진촬영', '기록', '주간습관'], TRUE, NULL);

-- 2. 반복 목표 사용량 초기화 (새로 추가된 템플릿들은 사용량 0)
-- 이미 생성된 템플릿들의 사용량은 유지

-- 3. 시스템 함수 테스트용 샘플 데이터 (개발/테스트 환경에서만 사용)
-- 실제 운영에서는 사용자가 직접 반복 목표를 생성

-- 실행 완료 메시지
SELECT '반복 목표 (습관) 템플릿 데이터 추가 완료! 총 ' || COUNT(*) || '개 습관 템플릿이 생성되었습니다.' as message 
FROM goal_templates 
WHERE tags @> ARRAY['일일습관'] OR tags @> ARRAY['주간습관'] OR tags @> ARRAY['월간습관'];