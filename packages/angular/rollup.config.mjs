// @ts-check
import {defineRollupConfig} from 'config';

export default defineRollupConfig({
  input: [
    {
      name: 'angular',
      path: './src/index.ts',
      globalVariableName: 'FloatingUIAngular',
    },
  ],
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    '@floating-ui/core': 'FloatingUICore',
    '@floating-ui/dom': 'FloatingUIDOM',
    '@floating-ui/utils': 'FloatingUIUtils',
    '@floating-ui/utils/dom': 'FloatingUIUtilsDOM',
    rxjs: 'rxjs',
    'rxjs/operators': 'rxjs.operators',
  },
  outputs: {
    cjs: false,
    browser: false,
    umd: {
      globals: {
        '@angular/core': 'ng.core',
        '@angular/common': 'ng.common',
        '@floating-ui/core': 'FloatingUICore',
        '@floating-ui/dom': 'FloatingUIDOM',
        rxjs: 'rxjs',
      },
    },
  },
});
