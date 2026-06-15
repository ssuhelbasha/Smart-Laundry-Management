/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        accent: "#10B981",
        warning: "#F59E0B",
        background: "#F3F4F6",
        surface: "#FFFFFF",
        textPrimary: "#111827",
        textSecondary: "#6B7280"
      }
    },
  },
  plugins: [],
}
