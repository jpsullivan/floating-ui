import angular from '@analogjs/vite-plugin-angular';
import {defineViteConfig} from 'config';

export default defineViteConfig({
  server: {
    port: 1234,
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    angular({
      jit: false,
      tsconfig: '../../tsconfig.app.json',
    }),
  ],
  root: './test/visual',
  test: {
    environment: 'jsdom',
    root: './test/unit',
    setupFiles: ['./setupTests.ts'],
    browser: {
      provider: 'playwright',
      enabled: process.env.TEST_ENV === 'browser',
      instances: [{browser: 'chromium'}],
    },
  },
});
