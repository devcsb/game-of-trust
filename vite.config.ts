/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base는 GitHub Pages 프로젝트 사이트 경로(https://<user>.github.io/game-of-trust/).
// 루트(user.github.io)로 배포하면 '/'로 바꾼다. base 누락이 자산 404의 가장 흔한 원인.
export default defineConfig({
  base: '/game-of-trust/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
})
