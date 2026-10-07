import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf1ff',
          100: '#dce5ff',
          200: '#c0d0ff',
          500: '#3659e3',
          600: '#2848c7',
          700: '#1e38a3',
        },
      },
    },
  },
  plugins: [],
};

export default config;
