/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#F8FAFC',        // Clean light canvas (slate-50)
          surface: '#FFFFFF',   // Pure white card
          surfaceAlt: '#F1F5F9',// Subtle slate-100 background
          navy: {
            950: '#0A0F1D',
            900: '#0F172A',     // Primary brand deep navy (slate-900)
            800: '#1E293B',     // Secondary navy (slate-800)
            700: '#334155',     // Navy muted
            600: '#475569',
          },
          blue: {
            50: '#EFF6FF',      // Light blue tint
            100: '#DBEAFE',
            500: '#3B82F6',
            600: '#2563EB',     // Corporate fintech interactive blue
            700: '#1D4ED8',     // Hover blue
            800: '#1E40AF',
          },
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            500: '#14B8A6',
            600: '#0D9488',     // Trust & security teal
            700: '#0F766E',
          },
          border: '#E2E8F0',    // Clean slate-200 border
          borderLight: '#F1F5F9',
          borderDark: '#CBD5E1',
          text: '#0F172A',      // High-contrast primary text
          textMuted: '#475569', // WCAG AA compliant secondary text (>= 4.5:1)
          textSubtle: '#64748B',// Tertiary caption text
          danger: '#E11D48',    // FinTech crimson / rose
          dangerLight: '#FFF1F2',
          dangerBorder: '#FECDD3',
          dangerDark: '#9F1239',
          warning: '#D97706',   // FinTech amber
          warningLight: '#FFFBEB',
          warningBorder: '#FDE68A',
          warningDark: '#92400E',
          success: '#059669',   // FinTech emerald
          successLight: '#ECFDF5',
          successBorder: '#A7F3D0',
          successDark: '#065F46',
          info: '#0284C7',      // Sky
          infoLight: '#F0F9FF',
          infoBorder: '#BAE6FD',
          infoDark: '#075985',
        },
        // Mapped legacy aliases for seamless component styling
        cyber: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardHover: '#F8FAFC',
          border: '#E2E8F0',
          borderLight: '#CBD5E1',
          accent: '#2563EB',
          danger: '#E11D48',
          warning: '#D97706',
          success: '#059669',
          textMuted: '#475569',
          textBright: '#0F172A',
        }
      },
      boxShadow: {
        'fintech-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'fintech': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'fintech-md': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'fintech-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
        'fintech-card': '0 0 0 1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
