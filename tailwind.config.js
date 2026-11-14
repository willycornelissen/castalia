/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F6F6',
        ink: '#222222',
        muted: '#555555',
        borderline: '#D8D8D8',
        accent: '#15171A',
      },
      fontFamily: {
        masthead: ['"Chomsky"', 'serif'],
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        condensed: ['"Roboto Condensed"', 'sans-serif'],
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
