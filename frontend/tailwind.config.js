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
        // AI Security Operations Center (SOC) Master Color Palette
        soc: {
          bg: '#050A12',          // Deepest cinematic dark background
          secondary: '#071522',   // Secondary dark panel
          card: '#0C1B2A',        // Standard glassmorphism card
          elevated: '#102538',    // Elevated card / hover state
          border: '#16314D',      // Subtle dark blue-gray border
          borderGlow: '#00E5FF33', // Cyan subtle border glow
          cyan: '#00E5FF',        // Electric neon cyan
          teal: '#00F5C8',        // Vivid trust teal
          blue: '#1E6BFF',        // Deep cyber blue
          text: '#F5FAFF',        // Crisp white primary text
          textMuted: '#A6B6C7',   // Clean secondary silver-gray text
          textDim: '#5B7083',     // Tertiary subtle text
          danger: '#FF5263',      // High risk / critical anomaly
          warning: '#FFB547',     // Medium risk / caution
          success: '#24D6A0',     // Safe transaction / verified
        },
        // Backwards-compatible mapped tokens
        fintech: {
          bg: '#050A12',
          surface: '#0C1B2A',
          surfaceAlt: '#071522',
          navy: {
            950: '#03060B',
            900: '#050A12',
            800: '#071522',
            700: '#0C1B2A',
            600: '#102538',
          },
          blue: {
            50: '#071522',
            100: '#0C1B2A',
            500: '#00E5FF',
            600: '#00E5FF',
            700: '#00B8D4',
            800: '#0097A7',
          },
          teal: {
            50: '#071A21',
            100: '#0C2630',
            500: '#00F5C8',
            600: '#00F5C8',
            700: '#00C49F',
          },
          border: '#16314D',
          borderLight: '#1F4266',
          borderDark: '#0A1826',
          text: '#F5FAFF',
          textMuted: '#A6B6C7',
          textSubtle: '#5B7083',
          danger: '#FF5263',
          dangerLight: '#2A0E14',
          dangerBorder: '#5C1D26',
          dangerDark: '#E02E42',
          warning: '#FFB547',
          warningLight: '#261B0A',
          warningBorder: '#5C4118',
          warningDark: '#E09426',
          success: '#24D6A0',
          successLight: '#07241A',
          successBorder: '#145941',
          successDark: '#1BB886',
          info: '#00E5FF',
          infoLight: '#071F2B',
          infoBorder: '#104961',
          infoDark: '#00B8D4',
        },
        cyber: {
          bg: '#050A12',
          card: '#0C1B2A',
          cardHover: '#102538',
          border: '#16314D',
          borderLight: '#1F4266',
          accent: '#00E5FF',
          danger: '#FF5263',
          warning: '#FFB547',
          success: '#24D6A0',
          textMuted: '#A6B6C7',
          textBright: '#F5FAFF',
        }
      },
      boxShadow: {
        'soc-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'soc-glow-cyan': '0 0 25px rgba(0, 229, 255, 0.25)',
        'soc-glow-teal': '0 0 25px rgba(0, 245, 200, 0.25)',
        'soc-glow-lg': '0 0 50px rgba(0, 229, 255, 0.35)',
        'fintech-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'fintech': '0 4px 20px 0 rgba(0, 0, 0, 0.4)',
        'fintech-md': '0 8px 30px 0 rgba(0, 0, 0, 0.5)',
        'fintech-lg': '0 15px 40px 0 rgba(0, 0, 0, 0.6)',
        'fintech-card': '0 0 0 1px #16314D, 0 8px 24px 0 rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow-sweep': 'sweep 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        sweep: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
