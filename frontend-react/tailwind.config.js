/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a6b4a',
          dark: '#0f3d2e',
          light: '#25a06e',
        },
        accent: {
          DEFAULT: '#f5a623',
          dark: '#d4891e',
        },
        danger: '#e53e3e',
        success: '#38a169',
        warning: '#d69e2e',
        info: '#3182ce',
        bg: '#f0f7f4',
        text: {
          DEFAULT: '#1a2e23',
          muted: '#5a7a6a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'large': '12px',
        'small': '8px',
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 107, 74, 0.1)',
        'hard': '0 8px 32px rgba(26, 107, 74, 0.15)',
      },
    },
  },
  plugins: [],
}
