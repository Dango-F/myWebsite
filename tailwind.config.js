/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                github: {
                    blue: '#0366d6',
                    gray: '#586069',
                    dark: '#24292e',
                    green: '#2cbe4e'
                }
            },
        },
    },
    plugins: [],
} 