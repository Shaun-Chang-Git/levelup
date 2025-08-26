# 🚀 LevelUp 수동 배포 가이드

## ✅ 현재 상태
- [x] 프로젝트 완전 준비됨
- [x] Git 저장소 초기화 완료
- [x] 모든 파일 커밋됨
- [x] 배포 설정 완료됨

## 📋 배포 단계 (수동 실행 필요)

### 1단계: Vercel 계정 설정
```bash
# 터미널에서 실행
npx vercel login
```
- 브라우저가 열리면 GitHub/Google 계정으로 로그인
- 터미널로 돌아가서 배포 계속 진행

### 2단계: 프로젝트 배포
```bash
# 프로젝트 디렉토리에서 실행
npx vercel

# 질문에 대한 답변:
# ? Set up and deploy "~/levelup"? [Y/n] → Y
# ? Which scope do you want to deploy to? → 본인 계정 선택
# ? Link to existing project? [y/N] → N
# ? What's your project's name? → levelup (또는 원하는 이름)
# ? In which directory is your code located? → ./ (엔터)
```

### 3단계: 환경 변수 설정
배포 완료 후 Vercel 대시보드에서:

1. **프로젝트 대시보드 접속**
   - https://vercel.com/dashboard
   - 방금 생성된 프로젝트 클릭

2. **환경 변수 설정**
   - Settings → Environment Variables
   - 다음 변수들 추가:

```env
Name: REACT_APP_SUPABASE_URL
Value: https://ajubvuhbhivgbljrmjzf.supabase.co
Environment: Production, Preview, Development

Name: REACT_APP_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdWJ2dWhiaGl2Z2JsanJtanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDc5MTgsImV4cCI6MjA3MTU4MzkxOH0.bxwGTwp-X6hkq8HUU1j0MUUJ141kaP-x93X7KLSbUdo
Environment: Production, Preview, Development

Name: REACT_APP_ENVIRONMENT
Value: production
Environment: Production

Name: GENERATE_SOURCEMAP
Value: false
Environment: Production

Name: NODE_ENV
Value: production
Environment: Production
```

### 4단계: 재배포 실행
환경 변수 설정 후:
```bash
npx vercel --prod
```

## 🌐 GitHub 연결 (선택사항)

더 나은 CI/CD를 위해 GitHub 연결:

1. **GitHub 저장소 생성**
   - https://github.com/new
   - Repository name: `levelup` 
   - Public/Private 선택
   - README, .gitignore 생성하지 말 것 (이미 있음)

2. **로컬에서 GitHub 연결**
```bash
git remote add origin https://github.com/YOUR_USERNAME/levelup.git
git branch -M main
git push -u origin main
```

3. **Vercel에서 GitHub 연결**
   - Vercel 프로젝트 Settings → Git
   - Connect Git Repository → GitHub 선택
   - 저장소 연결 완료

## 📊 배포 확인 사항

### 기본 기능 테스트
- [ ] 사이트 로딩 (https://your-app.vercel.app)
- [ ] 회원가입/로그인 기능
- [ ] 목표 생성 기능
- [ ] 대시보드 표시
- [ ] 모바일 반응형

### PWA 기능 테스트
- [ ] PWA 설치 프롬프트 표시
- [ ] 홈 화면에 앱 추가 가능
- [ ] 오프라인에서 기본 페이지 표시
- [ ] 푸시 알림 권한 요청

### 성능 테스트
1. **Lighthouse 점수 확인**
   - F12 → Lighthouse → Generate Report
   - Performance: 90+ 목표
   - Accessibility: 95+ 목표
   - PWA: 100 목표

2. **Core Web Vitals**
   - LCP < 2.5초
   - FID < 100ms
   - CLS < 0.1

## 🎯 배포 완료 체크리스트

- [ ] Vercel 로그인 완료
- [ ] 첫 배포 성공
- [ ] 환경 변수 설정 완료
- [ ] 재배포 실행 완료
- [ ] 사이트 접속 확인
- [ ] 기본 기능 동작 확인
- [ ] PWA 기능 확인
- [ ] 성능 점수 확인
- [ ] GitHub 연결 (선택사항)

## 🚨 문제 해결

### 빌드 실패 시
```bash
# 로컬에서 빌드 테스트
npm install --force
npm run build:production

# 성공 시 재배포
npx vercel --prod
```

### 환경 변수 오류 시
- Vercel 대시보드에서 변수명 확인
- `REACT_APP_` 접두사 확인
- 값 복사 시 공백/개행 확인

### Supabase 연결 오류 시
- URL과 키 재확인
- Supabase 프로젝트 활성화 상태 확인
- CORS 정책 확인

## 📞 지원

배포 중 문제 발생 시:
1. 터미널 오류 메시지 확인
2. Vercel 대시보드 Functions 로그 확인  
3. Browser 개발자 도구 Console 확인

---

✨ **성공적인 배포를 위해 각 단계를 차례대로 진행해주세요!** 🚀