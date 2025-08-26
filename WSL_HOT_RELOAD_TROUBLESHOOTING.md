# WSL Hot Reload 문제 해결 가이드

## 문제 상황
WSL2 환경에서 React 개발 서버의 Hot Reload (자동 새로고침)가 작동하지 않는 문제

## 적용된 해결책

### 1. 환경 변수 설정
다음 파일들에 WSL 환경을 위한 설정을 추가했습니다:

#### `.env` 파일
```bash
# React 개발 서버 설정
FAST_REFRESH=true
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true

# WSL 전용 설정
HOST=0.0.0.0
PORT=3000
BROWSER=none

# 경고를 에러로 처리하지 않음
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true

# 소스맵 생성
GENERATE_SOURCEMAP=true
```

#### `.env.local` 파일에 추가
```bash
# WSL에서 Hot Reload 활성화
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

#### `.env.development` 파일
```bash
# Development 환경 전용 설정
FAST_REFRESH=true
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
BROWSER=none
HOST=0.0.0.0
PORT=3000
GENERATE_SOURCEMAP=true
ESLINT_NO_DEV_ERRORS=true
```

### 2. Package.json 스크립트 수정
```json
{
  "scripts": {
    "start": "CHOKIDAR_USEPOLLING=true react-scripts start",
    "start:wsl": "CHOKIDAR_USEPOLLING=true WATCHPACK_POLLING=true react-scripts start"
  }
}
```

## Hot Reload가 작동하지 않는 주요 원인

### 1. WSL2 파일 시스템 감시 문제
- WSL2에서 Windows 파일 시스템 (`/mnt/c/`)에 있는 파일 변경을 감지하는 데 어려움
- `CHOKIDAR_USEPOLLING=true` 설정으로 해결

### 2. Webpack의 파일 감시 설정
- `WATCHPACK_POLLING=true` 설정 추가 필요
- React Scripts 5.0.1에서는 추가 폴링 설정 필요

### 3. 네트워크 바인딩 문제
- `HOST=0.0.0.0` 설정으로 모든 인터페이스에서 접근 가능하도록 설정

## 테스트 방법

### 1. 개발 서버 시작
```bash
npm run start:wsl
```

### 2. 파일 변경 테스트
1. `src/pages/HomePage.tsx` 파일 수정
2. 브라우저에서 변경사항이 자동으로 반영되는지 확인
3. 콘솔에서 HMR (Hot Module Replacement) 메시지 확인

### 3. 서버 상태 확인
```bash
# 프로세스 확인
ps aux | grep "react-scripts\|node.*start.js"

# 포트 확인
ss -tulpn | grep :3000

# 서버 응답 확인
curl -I http://localhost:3000
```

## 추가 해결 방법

### 1. WSL 내부로 프로젝트 이동
만약 위 설정으로도 해결되지 않는다면, 프로젝트를 WSL 내부 파일 시스템으로 이동:
```bash
# WSL 홈 디렉토리로 복사
cp -r /mnt/c/Users/idonn/levelup ~/levelup
cd ~/levelup
npm install
npm run start
```

### 2. VS Code WSL 확장 사용
- VS Code에서 WSL 확장 설치
- `code .`로 WSL 환경에서 직접 개발

### 3. Docker 사용
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 확인사항

- ✅ `CHOKIDAR_USEPOLLING=true` 설정 추가됨
- ✅ `WATCHPACK_POLLING=true` 설정 추가됨
- ✅ WSL 전용 스크립트 `start:wsl` 추가됨
- ✅ 환경 변수 파일들 설정 완료
- ⏳ 실제 Hot Reload 작동 테스트 필요

## 최종 권장사항

1. **단기적 해결책**: 현재 설정된 `npm run start:wsl` 사용
2. **장기적 해결책**: 프로젝트를 WSL 내부 파일 시스템으로 이동
3. **개발 편의성**: VS Code WSL 확장 사용

## 문제가 지속되는 경우

1. Node.js 및 npm 버전 확인
2. WSL2 버전 업데이트
3. Windows Terminal 최신 버전 사용
4. 방화벽 설정 확인

---

**참고**: 이 설정들은 WSL2 환경에서 React 개발 서버의 Hot Reload를 활성화하기 위한 표준적인 해결책입니다.