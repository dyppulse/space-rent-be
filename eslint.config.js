import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import globals from 'globals'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      js,
      prettier: eslintPluginPrettier,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      'prettier/prettier': 'warn',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node.js built-ins
            'external', // npm modules
            'internal', // aliases (like @/)
            ['parent', 'sibling', 'index'], // relative imports
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ignores: ['node_modules', 'dist', 'build'],
  },
  prettier,
])
