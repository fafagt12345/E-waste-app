/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './*.{js,jsx,ts,tsx}',
        './pages/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
        './context/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                dlh: {
                    green: {
                        50: "#f0fdf4",
                        100: "#dcfce7",
                        200: "#bbf7d0",
                        300: "#86efac",
                        400: "#4ade80",
                        500: "#22c55e",
                        600: "#16a34a",
                        700: "#15803d",
                        800: "#166534",
                        900: "#14532d",
                    },
                    blue: {
                        50: "#f0f9ff",
                        100: "#e0f2fe",
                        200: "#bae6fd",
                        300: "#7dd3fc",
                        400: "#38bdf8",
                        500: "#0284c7",
                        600: "#0369a1",
                        700: "#075985",
                        800: "#1e3a8a",
                        900: "#0f172a",
                    },
                    yellow: {
                        50: "#fefce8",
                        100: "#fef9c3",
                        200: "#fef08a",
                        300: "#fde047",
                        400: "#facc15",
                        500: "#eab308",
                        600: "#ca8a04",
                        700: "#a16207",
                        800: "#854d0e",
                        900: "#713f12",
                    }
                }
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}