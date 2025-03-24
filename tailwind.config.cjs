module.exports = {
  content: [
    './app/**/*.js',
    './components/**/*.js',
    './app/**/*.jsx',
    './components/**/*.jsx',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
