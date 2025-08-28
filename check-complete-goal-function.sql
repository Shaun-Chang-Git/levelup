-- complete_goal 함수 현재 상태 확인
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'complete_goal' 
  AND routine_schema = 'public';

-- 함수 매개변수 확인
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.parameters p
WHERE p.specific_name IN (
    SELECT r.specific_name 
    FROM information_schema.routines r 
    WHERE r.routine_name = 'complete_goal'
);

-- 테스트용 목표 ID로 함수 직접 실행 (실제 목표 ID로 변경 필요)
-- SELECT complete_goal('94053e73-3666-4493-974b-500a550d0c26'::UUID);