import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import noSecrets from 'eslint-plugin-no-secrets';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.aws-sam/**',
      'coverage/**',
      '*.config.js',
    ],
  },

  // Base recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Security plugin configuration
  {
    plugins: {
      security,
      'no-secrets': noSecrets,
    },
    rules: {
      'no-secrets/no-secrets': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
    },
  },

  // Overrides for test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/api/mock/**/*.ts'],
    rules: {
      'no-secrets/no-secrets': 'off',
      'security/detect-non-literal-fs-filename': 'off',
    },
  },

  // Override for visual_crossing.ts
  {
    files: ['src/api/weather/visual_crossing.ts'],
    rules: {
      'no-secrets/no-secrets': 'off',
    },
  },
);
