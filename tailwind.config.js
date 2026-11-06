/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': 'var(--color-bg)',
        'app-surface': 'var(--color-surface)',
        'app-surface-hover': 'var(--color-surface-hover)',
        'app-primary': 'var(--color-primary)',
        'app-primary-hover': 'var(--color-primary-hover)',
        'app-text': 'var(--color-text)',
        'app-text-muted': 'var(--color-text-muted)',
        'app-border': 'var(--color-border)',
      },
    },
  },
  plugins: [],
};
