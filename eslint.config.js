import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'legacy', 'playwright-report', 'test-results', '.claude'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      // All audio goes through AudioManager (docs/DECISIONS.md D3).
      'no-restricted-globals': ['error', 'speechSynthesis', 'localStorage'],
      'no-restricted-syntax': ['error', { selector: "NewExpression[callee.name='Audio']", message: 'Use say(id) from core/audio.' }],
    },
  },
  {
    // The studio previews raw recordings that have no phrase file yet.
    files: ['src/core/audio/**', 'src/core/storage/**', 'src/tools/studio/**'],
    rules: { 'no-restricted-globals': 'off', 'no-restricted-syntax': 'off' },
  },
)
