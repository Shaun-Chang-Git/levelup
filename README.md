# 🎯 LevelUp - 학습 게이미피케이션 플랫폼

> 학습 활동을 게임화하여 동기부여를 높이는 현대적 웹 애플리케이션

## 📋 프로젝트 개요

**LevelUp**은 학습 목표 설정부터 달성까지의 과정을 게임처럼 재미있게 만드는 플랫폼입니다.
사용자들은 목표를 설정하고 달성하며 경험치를 획득하여 레벨업할 수 있습니다.

## ✨ 주요 기능

### 핵심 기능
- 🎯 **목표 설정 및 추적** - 다양한 카테고리의 학습 목표 관리
- ⭐ **경험치 시스템** - 목표 달성 시 경험치 획득 및 레벨업
- 🏆 **업적 시스템** - 다양한 업적을 통한 추가적인 동기부여
- 📊 **통계 대시보드** - 학습 진행 상황을 한눈에 확인
- 🥇 **리더보드** - 전체/주간/월간 랭킹 시스템

### 소셜 & 게이미피케이션
- 🎮 **습관 추적** - 일일 습관 관리 및 연속 달성 기록
- 🏅 **뱃지 시스템** - 특별 업적에 대한 뱃지 수여
- 🎯 **도전 과제** - 개인 및 그룹 도전 과제 참여
- 👥 **소셜 기능** - 친구 추가, 활동 공유, 그룹 생성

### PWA 기능
- 📱 **앱 설치** - 홈 화면에 설치하여 네이티브 앱처럼 사용
- 🔔 **푸시 알림** - 목표 알림, 도전 과제, 사회적 활동 알림
- 🌐 **오프라인 지원** - 인터넷 없이도 기본 기능 이용 가능
- 🎨 **다크 모드** - 시스템 설정에 따른 자동 테마 전환

### 사용자 경험
- ♿ **완전한 접근성** - WCAG 2.1 AA 준수, 스크린 리더 지원
- 📱 **완전 반응형** - 모바일, 태블릿, 데스크톱 최적화
- ⚡ **고성능** - 코드 스플리팅, 지연 로딩, Core Web Vitals 최적화
- 🎯 **직관적 UX** - 터치 친화적 인터페이스, 명확한 네비게이션

## 🛠️ 기술 스택

### Frontend
- **React 18** - Concurrent Features, Suspense, Error Boundaries
- **TypeScript** - 완전한 타입 안전성 및 개발 도구 지원
- **Material-UI v5** - 현대적 Material Design 3.0 구현
- **React Router v6** - 최신 라우팅 시스템 및 코드 스플리팅
- **React Query** - 서버 상태 관리 및 캐싱
- **React Context API** - 전역 상태 관리 (테마, 인증, 알림)

### PWA & Performance
- **Service Worker** - 오프라인 지원, 백그라운드 동기화, 푸시 알림
- **Web App Manifest** - PWA 설치 및 네이티브 앱 경험
- **Code Splitting** - React.lazy를 통한 동적 import 및 성능 최적화
- **Core Web Vitals** - LCP, FID, CLS 실시간 모니터링
- **Lazy Loading** - 이미지 및 컴포넌트 지연 로딩

### Backend & Infrastructure
- **Supabase** - BaaS (Backend as a Service)
- **PostgreSQL** - 관계형 데이터베이스 및 실시간 구독
- **Supabase Auth** - 소셜 로그인 및 JWT 기반 인증
- **Supabase Storage** - 파일 업로드 및 CDN
- **Edge Functions** - 서버리스 함수 및 웹훅
- **Real-time** - WebSocket 기반 실시간 데이터 동기화

### 접근성 & UX
- **WCAG 2.1 AA** - 완전한 웹 접근성 준수
- **Screen Reader Support** - ARIA 라벨링 및 시맨틱 HTML
- **Focus Management** - 키보드 네비게이션 최적화
- **Color Contrast** - 충분한 색상 대비 및 다크 모드 지원

### 개발 도구 & 품질
- **ESLint + Prettier** - 코드 품질 및 일관성 관리
- **Jest + RTL** - 단위 테스트 및 통합 테스트
- **Cypress** - E2E 테스트 및 시각적 회귀 테스트
- **TypeScript Strict Mode** - 엄격한 타입 검사
- **Error Monitoring** - 실시간 에러 추적 및 리포팅

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── accessibility/      # 접근성 컴포넌트 (Skip Links, 스크린 리더 지원)
│   ├── auth/              # 인증 관련 컴포넌트
│   ├── goals/             # 목표 관리 컴포넌트
│   ├── habits/            # 습관 추적 컴포넌트
│   ├── achievements/       # 업적 시스템 컴포넌트
│   ├── challenges/        # 도전 과제 컴포넌트
│   ├── badges/            # 뱃지 시스템 컴포넌트
│   ├── gamification/      # 게이미피케이션 공통 컴포넌트
│   ├── statistics/        # 통계 대시보드 컴포넌트
│   ├── social/            # 소셜 기능 컴포넌트
│   ├── leaderboard/       # 리더보드 컴포넌트
│   ├── layout/            # 레이아웃 및 네비게이션
│   ├── pwa/              # PWA 관련 컴포넌트 (설치 프롬프트, 관리)
│   ├── notifications/     # 푸시 알림 시스템
│   └── performance/       # 성능 최적화 컴포넌트 (Lazy Loading)
├── contexts/             # React Context (Auth, Theme, Notification)
├── hooks/                # 커스텀 훅 (반응형, 성능, PWA)
├── services/             # API 서비스 및 Supabase 클라이언트
├── types/                # TypeScript 타입 정의
├── utils/                # 유틸리티 함수 (성능, UX 검증, 접근성)
├── styles/               # 테마 및 글로벌 스타일
├── pages/                # 페이지 컴포넌트 (지연 로딩)
└── workers/              # Service Worker 및 PWA 로직

public/
├── manifest.json         # PWA 매니페스트
├── offline.html          # 오프라인 페이지
├── sw.js                # Service Worker
└── icons/               # PWA 아이콘 (다양한 크기)
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd levelup

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에서 Supabase 설정 추가

# 개발 서버 시작
npm start
```

### 환경 변수 설정

```env
# Supabase 설정
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# PWA 설정
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key

# 개발 환경
REACT_APP_ERROR_REPORTING_ENDPOINT=your_error_reporting_url
```

## 📈 개발 진행 상황

### Phase 1: 프로젝트 초기 설정 ✅ (완료)
- [x] React + TypeScript 프로젝트 생성
- [x] Material-UI 설계 시스템 구축
- [x] 개발 환경 및 코드 품질 도구 설정
- [x] 기본 폴더 구조 및 아키텍처 구축

### Phase 2: 데이터베이스 및 인증 ✅ (완료)
- [x] Supabase 프로젝트 설정 및 데이터베이스 스키마 설계
- [x] RLS 정책 설정 및 보안 구현
- [x] 소셜 로그인 및 JWT 기반 인증 시스템
- [x] Protected Route 및 권한 관리 구현

### Phase 3.1: 핵심 기능 구현 ✅ (완료)
- [x] 목표 설정 및 추적 시스템
- [x] 경험치 및 레벨업 시스템
- [x] 업적 시스템 및 뱃지 관리
- [x] 통계 대시보드 및 시각화
- [x] 리더보드 및 랭킹 시스템

### Phase 3.2: 소셜 및 게이미피케이션 ✅ (완료)
- [x] 습관 추적 시스템
- [x] 도전 과제 및 그룹 챌린지
- [x] 소셜 기능 (친구, 그룹, 활동 공유)
- [x] 실시간 알림 및 피드 시스템

### Phase 3.3-1: 모바일 최적화 ✅ (완료)
- [x] 완전 반응형 디자인 구현
- [x] 터치 친화적 인터페이스
- [x] 모바일 네비게이션 최적화
- [x] 다크 모드 지원

### Phase 3.3-2: UX 개선사항 ✅ (완료)
- [x] **PWA 구현** - Service Worker, 매니페스트, 오프라인 지원, 앱 설치
- [x] **웹 푸시 알림** - 백그라운드 알림, 권한 관리, 구독 시스템
- [x] **접근성 개선** - WCAG 2.1 AA 준수, 스크린 리더 지원, 키보드 네비게이션
- [x] **성능 최적화** - 코드 스플리팅, 지연 로딩, Core Web Vitals 모니터링
- [x] **UX 검증 시스템** - 자동화된 UX 품질 테스트 및 검증

### Phase 4: 고급 기능 (계획 중)
- [ ] AI 기반 목표 추천 시스템
- [ ] 고급 분석 및 인사이트
- [ ] 팀 및 조직 기능
- [ ] API 및 외부 서비스 연동

## 🚀 주요 특징

### PWA (Progressive Web App)
- **오프라인 지원**: 네트워크 연결 없이도 기본 기능 사용 가능
- **앱 설치**: 브라우저에서 홈 화면에 설치하여 네이티브 앱처럼 사용
- **푸시 알림**: 목표 달성, 도전 과제, 소셜 활동에 대한 실시간 알림
- **백그라운드 동기화**: 오프라인 상태에서의 데이터 자동 동기화

### 완전한 접근성
- **WCAG 2.1 AA 준수**: 모든 사용자가 동등하게 이용 가능
- **스크린 리더 지원**: 시각 장애인을 위한 완전한 접근성
- **키보드 네비게이션**: 마우스 없이도 모든 기능 이용 가능
- **고대비 모드**: 시각적 접근성을 위한 색상 대비 최적화

### 고성능 최적화
- **지연 로딩**: 필요한 컴포넌트만 동적으로 로드
- **코드 스플리팅**: 페이지별 번들 분할로 초기 로딩 시간 단축
- **이미지 최적화**: WebP 포맷 및 반응형 이미지 제공
- **캐싱 전략**: Service Worker를 통한 intelligent caching

### 현대적 UX/UI
- **Material Design 3.0**: 최신 Material Design 가이드라인 적용
- **부드러운 애니메이션**: Framer Motion을 통한 자연스러운 전환효과
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **직관적 네비게이션**: 명확하고 일관된 사용자 인터페이스

## 🛡️ 보안 및 개인정보

- **데이터 암호화**: 모든 민감한 데이터는 암호화되어 저장
- **RLS (Row Level Security)**: Supabase를 통한 행 수준 보안 정책
- **JWT 인증**: 안전한 토큰 기반 인증 시스템
- **GDPR 준수**: 유럽 개인정보보호법 준수

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인
- TypeScript 사용 필수
- 접근성 가이드라인 준수 (WCAG 2.1 AA)
- 컴포넌트 단위 테스트 작성
- 반응형 디자인 고려
- PWA 기능 호환성 확인

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 언제든 연락주세요!

## 🚀 배포 및 프로덕션

### 🌐 라이브 데모
- **프로덕션 URL**: `https://levelup-app.vercel.app` (배포 후 업데이트)
- **개발 환경**: 로컬에서 `npm start` 실행

### 📦 배포 방법

#### 1. Vercel 자동 배포 (권장)
```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결 및 배포
vercel --prod
```

#### 2. 수동 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build:production

# 빌드 결과 미리보기
npm run preview

# Vercel 배포
npm run deploy:vercel
```

### ⚙️ 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```env
# 필수 설정
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# 선택적 설정
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
REACT_APP_PWA_ENABLED=true
GENERATE_SOURCEMAP=false
```

자세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참조하세요.

### 📊 성능 지표

- **Lighthouse 점수**: 95+ (성능, 접근성, SEO, PWA)
- **First Contentful Paint**: < 1.8초
- **Largest Contentful Paint**: < 2.5초
- **Time to Interactive**: < 5초
- **Cumulative Layout Shift**: < 0.1

### 🔒 보안 및 컴플라이언스

- ✅ HTTPS 강제 적용
- ✅ CSP (Content Security Policy) 헤더
- ✅ XSS 및 CSRF 방어
- ✅ 환경 변수 보안 관리
- ✅ GDPR/개인정보보호법 준수

### 🌍 브라우저 지원

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

---

🎯 **Happy Learning with LevelUp!** 🚀