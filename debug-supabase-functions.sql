-- Supabase 함수 상태 디버깅 쿼리

-- 1. 모든 complete_goal 관련 함수 조회
SELECT 
    routine_name,
    routine_type,
    routine_definition,
    specific_name
FROM information_schema.routines 
WHERE routine_name LIKE '%complete%goal%' 
   OR routine_name LIKE '%complete_user_goal%'
ORDER BY routine_name;

-- 2. 함수 매개변수 정보 조회
SELECT 
    r.routine_name,
    p.parameter_name,
    p.data_type,
    p.parameter_mode,
    p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name LIKE '%complete%goal%' 
   OR r.routine_name LIKE '%complete_user_goal%'
ORDER BY r.routine_name, p.ordinal_position;

-- 3. public 스키마의 모든 함수 조회
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. 테스트: 실제 함수 호출 (안전한 방식)
-- 실제 목표 ID로 변경하여 테스트
-- SELECT complete_user_goal('94053e73-3666-4493-974b-500a550d0c26'::UUID);

-- 5. goals 테이블 구조 확인 (user_id 컬럼 정보)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;