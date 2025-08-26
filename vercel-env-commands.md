# 🔧 Vercel CLI 환경 변수 설정 명령어

## 방법 1: 자동 스크립트 실행 (권장)

```bash
# 스크립트 실행 권한 부여 및 실행
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

## 방법 2: 개별 명령어 실행

아래 명령어들을 **하나씩 차례대로** 실행하세요:

### 1. Vercel 프로젝트 연결 확인
```bash
vercel
```

### 2. 환경 변수 설정 (하나씩 실행)

```bash
# Supabase URL 설정
vercel env add REACT_APP_SUPABASE_URL production
# 입력값: https://ajubvuhbhivgbljrmjzf.supabase.co

# Supabase 키 설정  
vercel env add REACT_APP_SUPABASE_ANON_KEY production
# 입력값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdWJ2dWhiaGl2Z2JsanJtanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDc5MTgsImV4cCI6MjA3MTU4MzkxOH0.bxwGTwp-X6hkq8HUU1j0MUUJ141kaP-x93X7KLSbUdo

# 환경 설정
vercel env add REACT_APP_ENVIRONMENT production  
# 입력값: production

# Node 환경 설정
vercel env add NODE_ENV production
# 입력값: production

# 소스맵 비활성화
vercel env add GENERATE_SOURCEMAP production
# 입력값: false

# 버전 설정
vercel env add REACT_APP_VERSION production
# 입력값: 1.0.0

# PWA 활성화
vercel env add REACT_APP_PWA_ENABLED production
# 입력값: true

# 푸시 알림 활성화  
vercel env add REACT_APP_PUSH_NOTIFICATIONS_ENABLED production
# 입력값: true
```

### 3. 설정 확인
```bash
# 환경 변수 목록 확인
vercel env ls

# 특정 환경 변수 확인
vercel env get REACT_APP_SUPABASE_URL production
```

## 방법 3: 한 번에 복사/붙여넣기 (가장 빠름)

터미널에서 아래 전체를 복사해서 붙여넣으세요:

```bash
echo "https://ajubvuhbhivgbljrmjzf.supabase.co" | vercel env add REACT_APP_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdWJ2dWhiaGl2Z2JsanJtanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDc5MTgsImV4cCI6MjA3MTU4MzkxOH0.bxwGTwp-X6hkq8HUU1j0MUUJ141kaP-x93X7KLSbUdo" | vercel env add REACT_APP_SUPABASE_ANON_KEY production
echo "production" | vercel env add REACT_APP_ENVIRONMENT production
echo "production" | vercel env add NODE_ENV production  
echo "false" | vercel env add GENERATE_SOURCEMAP production
echo "1.0.0" | vercel env add REACT_APP_VERSION production
echo "true" | vercel env add REACT_APP_PWA_ENABLED production
echo "true" | vercel env add REACT_APP_PUSH_NOTIFICATIONS_ENABLED production
```

## ✅ 설정 완료 확인

모든 설정이 완료되면 다음 명령어로 확인하세요:

```bash
vercel env ls
```

다음과 같은 출력이 나와야 합니다:
```
Environment Variables:
- REACT_APP_SUPABASE_URL (Production)
- REACT_APP_SUPABASE_ANON_KEY (Production)
- REACT_APP_ENVIRONMENT (Production)
- NODE_ENV (Production)
- GENERATE_SOURCEMAP (Production)
- REACT_APP_VERSION (Production)
- REACT_APP_PWA_ENABLED (Production)
- REACT_APP_PUSH_NOTIFICATIONS_ENABLED (Production)
```

## 🚨 문제 해결

### "No project found" 오류 시:
```bash
vercel link
```

### 환경 변수 삭제가 필요한 경우:
```bash
vercel env rm VARIABLE_NAME production
```

### 환경 변수 수정이 필요한 경우:
```bash
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
```

---

**가장 빠른 방법은 "방법 3"을 사용하는 것입니다!** 🚀