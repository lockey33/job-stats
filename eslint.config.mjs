import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import unusedImports from 'eslint-plugin-unused-imports'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  // Global code style and hygiene
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // No semicolons across the codebase
      semi: ['error', 'never'],
      'no-extra-semi': 'error',
      // Keep imports tidy and avoid unused ones
      'unused-imports/no-unused-imports': 'error',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      // Enforce that all import declarations appear at the top of the file
      // (i.e., no import declarations after other statements)
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Program > :not(ImportDeclaration, TSImportEqualsDeclaration, ExpressionStatement[directive]) ~ ImportDeclaration',
          message: 'Import declarations must be at the top of the file (after directives).',
        },
        {
          selector: 'TSImportType',
          message:
            "Do not use inline import('module').Type. Use 'import type { Type } from \"module\"' at the top of the file.",
        },
      ],
      // If require() is ever used, enforce it to be top-level only
      'global-require': 'error',
      // Improve readability with vertical spacing between logical blocks
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
      ],
    },
  },
  // Forbid importing server-only modules in known client-only layers
  {
    files: [
      'src/shared/ui/components/**/*.{ts,tsx}',
      // Protect feature UI and hooks from server imports
      'src/features/**/ui/**/*.{ts,tsx}',
      'src/features/**/hooks/**/*.{ts,tsx}',
      // App Router client-only surfaces (common patterns)
      'src/app/**/*client.tsx',
      'src/app/**/error.tsx',
      'src/app/**/global-error.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/providers.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // Avoid any accidental server/runtime imports in client layers
          patterns: ['@/server/*'],
          paths: ['next/server', 'server-only'],
        },
      ],
    },
  },
  // Allow server imports under API routes (server-only runtime)
  {
    files: ['src/app/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]

export default eslintConfig
