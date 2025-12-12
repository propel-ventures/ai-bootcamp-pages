/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'propel': {
          'navy': '#0b1035',
          'blue': '#2254FE',
          'cyan': '#73DEFF',
          'cyan-light': '#8adcff',
          'orange': '#f9a500',
          'gray': '#f4f6fa',
        },
      },
      fontFamily: {
        'poppins': ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
