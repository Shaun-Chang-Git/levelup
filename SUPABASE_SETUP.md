# Supabase 데이터베이스 설정 가이드

## 🎯 설정 순서

### 1단계: SQL 파일 실행
Supabase Dashboard > SQL Editor에서 다음 순서로 실행하세요:

1. **`supabase-schema.sql`** - 테이블 스키마 생성
2. **`supabase-rls-policies.sql`** - 보안 정책 설정  
3. **`supabase-initial-data.sql`** - 초기 데이터 및 함수 생성

### 2단계: Authentication 설정
Supabase Dashboard > Authentication > Settings에서:

- **Site URL**: `http://localhost:3000` (개발용)
- **Redirect URLs**: `http://localhost:3000/**`
- **Email Templates**: 필요에 따라 커스터마이징

### 3단계: 환경 변수 확인
`.env.local` 파일이 올바르게 설정되었는지 확인:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 생성될 데이터베이스 구조

### 테이블 목록
- **profiles** - 사용자 프로필 (auth.users 확장)
- **categories** - 목표 카테고리 (학습, 건강, 취미 등)
- **goals** - 사용자 목표
- **goal_progress** - 목표 진행 기록
- **achievements** - 업적/뱃지 정보
- **user_achievements** - 사용자 업적 달성 기록

### 주요 기능
- ✅ Row Level Security (RLS) 적용
- ✅ 자동 프로필 생성 (회원가입 시)
- ✅ 목표 완료 시 포인트 자동 지급
- ✅ 업적 달성 자동 체크
- ✅ 레벨업 시스템
- ✅ 연속 달성 (Streak) 추적

## 🎮 게이미피케이션 시스템

### 포인트 시스템
- 목표 난이도별 포인트: Easy(50), Medium(100), Hard(200), Expert(500)
- 업적 달성 시 추가 포인트
- 1000포인트당 1레벨 상승

### 기본 업적 (16개)
1. **첫 걸음** - 첫 목표 완료 (100pt)
2. **열정적인 도전자** - 5개 목표 완료 (300pt)
3. **목표 달성 마스터** - 10개 목표 완료 (500pt)
4. **완벽주의자** - 25개 목표 완료 (1000pt)
5. **꾸준함의 시작** - 3일 연속 달성 (150pt)
6. **습관의 형성** - 7일 연속 달성 (400pt)
7. **철인** - 30일 연속 달성 (1500pt)
8. **점수 수집가** - 1000포인트 달성 (200pt)
9. **포인트 마스터** - 5000포인트 달성 (800pt)
10. **레전드** - 10000포인트 달성 (2000pt)
11. **책벌레** - 학습 목표 10개 완료 (600pt)
12. **헬스 마니아** - 건강 목표 15개 완료 (800pt)
13. **취미 전문가** - 취미 목표 8개 완료 (500pt)
14. **커리어 전문가** - 커리어 목표 12개 완료 (700pt)

### 8개 기본 카테고리
1. 📚 **학습** - 책읽기, 강의 수강, 새로운 기술 습득
2. 💪 **건강** - 운동, 다이어트, 금연/금주
3. 🎨 **취미** - 음악, 미술, 요리, 여행
4. 💼 **커리어** - 자격증, 프로젝트, 네트워킹
5. ⏰ **생활습관** - 일찍 일어나기, 정리정돈, 시간관리
6. 👥 **인간관계** - 가족시간, 친구만나기, 새로운 만남
7. 💰 **재정관리** - 저축, 투자, 가계부 작성
8. 📈 **자기계발** - 명상, 일기쓰기, 독서, 성찰

## 🔧 유용한 SQL 쿼리

### 사용자 통계 조회
```sql
SELECT 
  p.display_name,
  p.level,
  p.total_points,
  COUNT(g.id) as total_goals,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals
FROM profiles p
LEFT JOIN goals g ON p.id = g.user_id
WHERE p.id = auth.uid()
GROUP BY p.id, p.display_name, p.level, p.total_points;
```

### 카테고리별 목표 현황
```sql
SELECT 
  c.name as category,
  COUNT(g.id) as total_goals,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_goals
FROM categories c
LEFT JOIN goals g ON c.id = g.category_id AND g.user_id = auth.uid()
GROUP BY c.id, c.name
ORDER BY total_goals DESC;
```

### 달성한 업적 목록
```sql
SELECT 
  a.name,
  a.description,
  a.reward_points,
  ua.earned_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = auth.uid()
ORDER BY ua.earned_at DESC;
```

## 🚨 문제 해결

### 권한 오류 발생 시
```sql
-- RLS가 제대로 설정되었는지 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 함수 실행 오류 시
```sql
-- 함수 목록 확인
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## ✅ 설정 완료 체크리스트

- [ ] supabase-schema.sql 실행 완료
- [ ] supabase-rls-policies.sql 실행 완료
- [ ] supabase-initial-data.sql 실행 완료
- [ ] Authentication 설정 완료
- [ ] .env.local 환경 변수 설정 확인
- [ ] 테스트 사용자 계정 생성 및 로그인 테스트

## 🎉 다음 단계

데이터베이스 설정이 완료되면:
1. React 애플리케이션에서 Supabase 연결 테스트
2. 회원가입/로그인 기능 테스트
3. 목표 생성 및 관리 기능 구현
4. 게이미피케이션 요소 UI 구현

---

**💡 팁**: SQL 실행 후 오류가 있다면 Supabase Dashboard > Logs에서 상세한 오류 메시지를 확인할 수 있습니다.