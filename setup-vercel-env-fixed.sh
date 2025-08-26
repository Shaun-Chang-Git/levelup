#!/bin/bash

echo "🚀 Vercel 환경 변수 설정 스크립트"
echo "각 명령어를 실행하고 값을 입력하세요..."
echo ""

echo "1/8 REACT_APP_SUPABASE_URL 설정중..."
npx vercel env add REACT_APP_SUPABASE_URL production < <(echo "https://ajubvuhbhivgbljrmjzf.supabase.co")

echo "2/8 REACT_APP_SUPABASE_ANON_KEY 설정중..."
npx vercel env add REACT_APP_SUPABASE_ANON_KEY production < <(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdWJ2dWhiaGl2Z2JsanJtanpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDc5MTgsImV4cCI6MjA3MTU4MzkxOH0.bxwGTwp-X6hkq8HUU1j0MUUJ141kaP-x93X7KLSbUdo")

echo "3/8 REACT_APP_ENVIRONMENT 설정중..."
npx vercel env add REACT_APP_ENVIRONMENT production < <(echo "production")

echo "4/8 NODE_ENV 설정중..."
npx vercel env add NODE_ENV production < <(echo "production")

echo "5/8 GENERATE_SOURCEMAP 설정중..."
npx vercel env add GENERATE_SOURCEMAP production < <(echo "false")

echo "6/8 REACT_APP_VERSION 설정중..."
npx vercel env add REACT_APP_VERSION production < <(echo "1.0.0")

echo "7/8 REACT_APP_PWA_ENABLED 설정중..."
npx vercel env add REACT_APP_PWA_ENABLED production < <(echo "true")

echo "8/8 REACT_APP_PUSH_NOTIFICATIONS_ENABLED 설정중..."
npx vercel env add REACT_APP_PUSH_NOTIFICATIONS_ENABLED production < <(echo "true")

echo ""
echo "✅ 모든 환경 변수 설정 완료!"
echo "확인: npx vercel env ls"