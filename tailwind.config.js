/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{vue,js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        "mars-red": "#e53935",
        "mars-red-dark": "#d32f2f",
        "mars-red-light": "#ef5350",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
};
