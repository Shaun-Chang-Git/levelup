# Vercel 환경 변수 설정 가이드

## 🔑 필수 환경 변수

배포 후 Vercel 대시보드에서 다음 환경 변수들을 설정하세요:

### Production 환경
```
REACT_APP_SUPABASE_URL=https://ajubvuhbhivgbljrmjzf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdWJ2dWhiaGl2Z2JsanJtanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDc5MTgsImV4cCI6MjA3MTU4MzkxOH0.bxwGTwp-X6hkq8HUU1j0MUUJ141kaP-x93X7KLSbUdo
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

## 📝 설정 방법

1. Vercel 대시보드 접속
2. 프로젝트 선택 → Settings → Environment Variables
3. 위 변수들을 하나씩 추가
4. 모든 환경(Production, Preview, Development)에 적용
5. Redeploy 실행

## ⚡ 빠른 설정 (CLI)
```bash
vercel env add REACT_APP_SUPABASE_URL production
vercel env add REACT_APP_SUPABASE_ANON_KEY production
vercel env add REACT_APP_ENVIRONMENT production
vercel env add REACT_APP_VERSION production
vercel env add NODE_ENV production  
vercel env add GENERATE_SOURCEMAP production
```

설정 완료 후 배포를 다시 실행하세요!