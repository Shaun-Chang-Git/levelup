# 🚀 LevelUp 배포 가이드

LevelUp 애플리케이션을 Vercel에 배포하는 완전한 가이드입니다.

## 📋 배포 전 체크리스트

### 1. 필수 요구사항
- [x] Node.js 18+ 설치
- [x] npm 또는 yarn 패키지 매니저
- [x] Vercel CLI 설치 (`npm i -g vercel`)
- [x] GitHub 계정 및 리포지토리
- [x] Supabase 프로젝트 설정

### 2. 환경 변수 확인
- [x] `.env.example` 파일 검토
- [x] Supabase URL과 ANON KEY 준비
- [x] 프로덕션 환경 변수 설정

## 🌐 Vercel 배포 단계

### Step 1: Vercel 프로젝트 설정

1. **Vercel 계정 생성 및 연결**
   ```bash
   # Vercel CLI 설치
   npm install -g vercel
   
   # Vercel 로그인
   vercel login
   ```

2. **GitHub 리포지토리 연결**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 리포지토리 선택 및 Import

### Step 2: 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수들을 추가:

```env
# 필수 환경 변수
REACT_APP_SUPABASE_URL=your_actual_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# 선택적 환경 변수
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
REACT_APP_PWA_ENABLED=true
REACT_APP_PUSH_NOTIFICATIONS_ENABLED=true
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

### Step 3: 빌드 설정

Vercel에서 다음 설정을 확인:

- **Framework Preset**: Create React App
- **Build Command**: `npm run build:production`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x

### Step 4: 배포 실행

```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build:production

# Vercel 배포
npm run deploy:vercel
```

## 🔧 고급 설정

### 1. 커스텀 도메인 설정

1. Vercel 대시보드 → Domains
2. Custom Domain 추가
3. DNS 설정 업데이트
4. SSL 인증서 자동 생성 확인

### 2. 성능 최적화

- **정적 파일 캐싱**: `vercel.json`에 설정됨
- **번들 크기 최적화**: 코드 스플리팅 적용
- **이미지 최적화**: Vercel 자동 이미지 최적화

### 3. 보안 헤더

`vercel.json`에 다음 보안 헤더가 설정되어 있습니다:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

## 📊 모니터링 및 분석

### 1. Vercel Analytics
- 자동으로 활성화됨
- Real User Metrics (RUM) 제공
- Core Web Vitals 모니터링

### 2. 성능 모니터링
```javascript
// src/utils/performance.ts에 구현됨
- LCP (Largest Contentful Paint)
- FID (First Input Delay)  
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)
```

### 3. 오류 추적 (선택사항)
Sentry 또는 LogRocket 통합:
```env
REACT_APP_SENTRY_DSN=your_sentry_dsn
```

## 🚨 트러블슈팅

### 일반적인 문제들

1. **빌드 실패**
   ```bash
   # 의존성 재설치
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **환경 변수 문제**
   - `REACT_APP_` 접두사 확인
   - Vercel 대시보드에서 변수 재확인
   - 배포 후 재빌드

3. **Supabase 연결 오류**
   - URL과 ANON KEY 재확인
   - CORS 설정 검토
   - RLS 정책 확인

4. **PWA 작동 안함**
   - HTTPS 연결 확인
   - Service Worker 등록 확인
   - 매니페스트 파일 검증

## 📚 추가 리소스

### 유용한 명령어
```bash
# 로컬 빌드 테스트
npm run build:production
npm run preview

# 번들 분석
npm run build:analyze

# 테스트 커버리지
npm run test:coverage

# Vercel 로그 확인
vercel logs [deployment-url]
```

### 성능 체크리스트
- [ ] Lighthouse 점수 90+ (모든 항목)
- [ ] First Contentful Paint < 1.8초
- [ ] Largest Contentful Paint < 2.5초
- [ ] Time to Interactive < 5초
- [ ] Cumulative Layout Shift < 0.1

### SEO 최적화
- [ ] Meta tags 설정 완료
- [ ] Open Graph 설정
- [ ] Sitemap.xml 생성
- [ ] Robots.txt 설정

## 🎯 배포 후 확인사항

1. **기능 테스트**
   - [ ] 회원가입/로그인 동작
   - [ ] 목표 생성/수정/삭제
   - [ ] 습관 추적 기능
   - [ ] PWA 설치 가능
   - [ ] 푸시 알림 작동

2. **성능 테스트**
   - [ ] 페이지 로딩 속도
   - [ ] 모바일 반응형
   - [ ] 접근성 검사
   - [ ] 브라우저 호환성

3. **보안 검사**
   - [ ] HTTPS 연결 확인
   - [ ] 보안 헤더 설정
   - [ ] 환경 변수 노출 방지

## 📞 지원

배포 과정에서 문제가 발생하면:
1. GitHub Issues 생성
2. Vercel Support 문의
3. Supabase Discord 참여

---

**배포 완료! 🎉**
프로덕션 URL: `https://your-app.vercel.app`