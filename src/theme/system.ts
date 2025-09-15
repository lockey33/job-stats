import { createSystem, defaultConfig } from '@chakra-ui/react'

// Light-only Design System tokens
export const system = createSystem(defaultConfig, {
  theme: {
    semanticTokens: {
      colors: {
        surface: { value: '{colors.white}' },
        surfaceMuted: { value: '{colors.neutral.50}' },
        border: { value: '{colors.neutral.200}' },
        textMuted: { value: '{colors.neutral.600}' },
      },
    },
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' },
        },
        // Optional neutrals (keep Chakra defaults for gray, add neutral scale if needed)
        neutral: {
          50: { value: '#f8fafc' },
          100: { value: '#f1f5f9' },
          200: { value: '#e2e8f0' },
          300: { value: '#cbd5e1' },
          400: { value: '#94a3b8' },
          500: { value: '#64748b' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1f2937' },
          900: { value: '#0f172a' },
        },
      },
      fonts: {
        heading: {
          value:
            "var(--font-geist-sans), Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        },
        body: {
          value:
            "var(--font-geist-sans), Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        },
        mono: {
          value:
            "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        },
      },
      radii: {
        sm: { value: '6px' },
        md: { value: '10px' },
        lg: { value: '14px' },
        xl: { value: '20px' },
      },
      shadows: {
        sm: { value: '0 1px 2px rgba(16, 24, 40, 0.05)' },
        md: { value: '0 4px 8px rgba(16, 24, 40, 0.08)' },
        lg: { value: '0 12px 24px rgba(16, 24, 40, 0.12)' },
      },
      // Spacing (T-shirt sizes only)
      spacing: {
        xs: { value: '0.25rem' }, // 4px
        sm: { value: '0.5rem' }, // 8px
        md: { value: '1rem' }, // 16px
        lg: { value: '1.5rem' }, // 24px
        xl: { value: '2rem' }, // 32px
        '2xl': { value: '3rem' }, // 48px
      },
      fontSizes: {
        xs: { value: '0.75rem' },
        sm: { value: '0.875rem' },
        md: { value: '1rem' },
        lg: { value: '1.125rem' },
        xl: { value: '1.25rem' },
        '2xl': { value: '1.5rem' },
      },
    },
  },
})
