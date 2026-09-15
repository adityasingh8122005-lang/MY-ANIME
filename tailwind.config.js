/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#8b5cf6', // Violet-500
          hover: '#7c3aed', // Violet-600
        },
        dark: {
          base: '#09090b', // Zinc-950
          surface: '#18181b', // Zinc-900
          elevated: '#27272a', // Zinc-800
        }
      }
    },
  },
  plugins: [],
}
