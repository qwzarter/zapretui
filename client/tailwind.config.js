// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Указывает Tailwind, какие файлы сканировать на наличие классов Tailwind
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Сканирует все JS/JSX/TS/TSX файлы в папке src
    "./public/index.html",        // Сканирует public/index.html
  ],
  theme: {
    extend: {}, // Здесь можно расширять стандартную тему Tailwind
  },
  plugins: [], // Здесь можно добавлять плагины Tailwind
}
