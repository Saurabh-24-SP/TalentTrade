/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 24px 80px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(99, 102, 241, 0.15), 0 24px 60px rgba(99, 102, 241, 0.25)",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 10s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        slideUp: 'slideUp 0.8s ease-out both',
      },
    },
  },
  plugins: [],
}