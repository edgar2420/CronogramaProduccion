/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f5f6ff",
          100: "#ebeaff",
          200: "#d9d7ff",
          300: "#b9b5ff",
          400: "#8f88ff",
          500: "#6b63f6",
          600: "#574fde",
          700: "#453fbb",
          800: "#3a3598",
          900: "#302c7a",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(30, 35, 90, 0.10)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
}
