#!/bin/bash

# Vercel 환경 변수 자동 설정 스크립트
echo "🚀 Vercel 환경 변수 설정을 시작합니다..."

# Vercel CLI 확인
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI가 설치되지 않았습니다. 설치 중..."
    npm install -g vercel
fi

echo "✅ Vercel CLI 준비 완료"

# 환경 변수 설정
echo "📝 환경 변수를 설정합니다..."

# Production 환경 변수
echo "Setting REACT_APP_SUPABASE_URL..."
echo "https://ajubvuhbhivgbljrmjzf.supabase.co" | vercel env add REACT_APP_SUPABASE_URL production

echo "Setting REACT_APP_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdWJ2dWhiaGl2Z2JsanJtanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDc5MTgsImV4cCI6MjA3MTU4MzkxOH0.bxwGTwp-X6hkq8HUU1j0MUUJ141kaP-x93X7KLSbUdo" | vercel env add REACT_APP_SUPABASE_ANON_KEY production

echo "Setting REACT_APP_ENVIRONMENT..."
echo "production" | vercel env add REACT_APP_ENVIRONMENT production

echo "Setting NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

echo "Setting GENERATE_SOURCEMAP..."
echo "false" | vercel env add GENERATE_SOURCEMAP production

echo "Setting REACT_APP_VERSION..."
echo "1.0.0" | vercel env add REACT_APP_VERSION production

echo "Setting REACT_APP_PWA_ENABLED..."
echo "true" | vercel env add REACT_APP_PWA_ENABLED production

echo "Setting REACT_APP_PUSH_NOTIFICATIONS_ENABLED..."
echo "true" | vercel env add REACT_APP_PUSH_NOTIFICATIONS_ENABLED production

echo ""
echo "🎉 모든 환경 변수 설정이 완료되었습니다!"
echo ""
echo "📋 설정된 환경 변수:"
vercel env ls

echo ""
echo "🚀 다음 단계:"
echo "1. GitHub에 코드 푸시"
echo "2. 자동 배포 완료 대기"
echo "3. 배포된 사이트 확인"