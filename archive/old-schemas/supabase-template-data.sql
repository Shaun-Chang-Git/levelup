-- 목표 템플릿 기본 데이터 추가
-- supabase-template-schema.sql 실행 후 추가로 실행

-- 1. 시스템 기본 템플릿 추가

-- 건강/운동 카테고리 템플릿들
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
('매일 30분 운동하기', '건강한 생활을 위해 매일 30분씩 운동하는 습관을 만들어보세요', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'medium', 30, '일', 30, ARRAY['운동', '건강', '습관', '매일'], TRUE, NULL),
('주 3회 헬스장 가기', '꾸준한 근력 운동으로 건강한 몸만들기', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'medium', 12, '회', 30, ARRAY['헬스장', '근력운동', '주3회'], TRUE, NULL),
('10,000보 걷기', '매일 만보 걷기로 기초 체력 향상하기', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'easy', 30, '일', 30, ARRAY['걷기', '만보', '유산소'], TRUE, NULL),
('금연하기', '담배 끊기 도전! 건강한 삶의 첫걸음', (SELECT id FROM categories WHERE name = '건강' LIMIT 1), 'hard', 30, '일', 30, ARRAY['금연', '건강', '습관개선'], TRUE, NULL);

-- 학습/성장 카테고리 템플릿들  
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
('매일 30분 독서하기', '지식 향상을 위한 꾸준한 독서 습관 만들기', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'medium', 30, '일', 30, ARRAY['독서', '학습', '습관', '매일'], TRUE, NULL),
('한 달에 책 2권 읽기', '월간 독서 목표로 꾸준한 학습 습관 기르기', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'medium', 2, '권', 30, ARRAY['독서', '월간목표', '학습'], TRUE, NULL),
('온라인 강의 완주하기', '관심 분야 온라인 강의를 끝까지 수강하기', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'medium', 1, '개', 60, ARRAY['온라인강의', '학습', '완주'], TRUE, NULL),
('영어 단어 외우기', '매일 영어 단어 10개씩 외워서 어휘력 늘리기', (SELECT id FROM categories WHERE name = '학습' LIMIT 1), 'easy', 300, '개', 30, ARRAY['영어', '단어', '어휘', '매일'], TRUE, NULL);

-- 취미/여가 카테고리 템플릿들
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES  
('새로운 요리 배우기', '한 달 동안 새로운 요리 레시피 도전하기', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'medium', 10, '개', 30, ARRAY['요리', '레시피', '취미'], TRUE, NULL),
('매일 일기 쓰기', '하루를 돌아보는 일기 쓰기 습관 만들기', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'easy', 30, '일', 30, ARRAY['일기', '습관', '성찰', '매일'], TRUE, NULL),
('사진 찍기 프로젝트', '매주 의미있는 사진 찍어서 추억 만들기', (SELECT id FROM categories WHERE name = '취미' LIMIT 1), 'easy', 12, '장', 30, ARRAY['사진', '취미', '추억'], TRUE, NULL);

-- 자기계발 카테고리 템플릿들
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
('새로운 기술 익히기', '업무나 취미에 도움이 될 새로운 기술 습득하기', (SELECT id FROM categories WHERE name = '자기계발' LIMIT 1), 'hard', 1, '개', 60, ARRAY['기술', '학습', '자기계발'], TRUE, NULL),
('네트워킹 활동', '한 달에 새로운 사람들과 의미있는 만남 갖기', (SELECT id FROM categories WHERE name = '자기계발' LIMIT 1), 'medium', 5, '명', 30, ARRAY['네트워킹', '인맥', '소셜'], TRUE, NULL),
('부업 시작하기', '새로운 수입원 만들기 프로젝트', (SELECT id FROM categories WHERE name = '자기계발' LIMIT 1), 'expert', 1, '개', 90, ARRAY['부업', '수익', '프로젝트'], TRUE, NULL);

-- 생산성 카테고리 템플릿들
INSERT INTO goal_templates (title, description, category_id, difficulty, target_value, unit, duration_days, tags, is_public, creator_id) VALUES
('미니멀 라이프 시작', '불필요한 물건 정리하고 깔끔한 환경 만들기', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'medium', 30, '개', 30, ARRAY['미니멀', '정리정돈', '환경개선'], TRUE, NULL),
('디지털 디톡스', '스마트폰 사용 시간 줄이고 집중력 향상하기', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'hard', 30, '일', 30, ARRAY['디지털디톡스', '집중력', '습관개선'], TRUE, NULL),
('투두리스트 관리', '매일 계획 세우고 실행하는 습관 만들기', (SELECT id FROM categories WHERE name = '생산성' LIMIT 1), 'easy', 30, '일', 30, ARRAY['계획', '관리', '생산성', '매일'], TRUE, NULL);

-- 실행 완료 메시지
SELECT '목표 템플릿 기본 데이터 추가 완료! 총 ' || COUNT(*) || '개 템플릿이 생성되었습니다.' as message 
FROM goal_templates;