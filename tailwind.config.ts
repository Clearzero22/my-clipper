/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./newtab.html", "./popup.html", "./options.html"],
  theme: {
    extend: {
      colors: {
        paper: "var(--c-paper)",
        paper2: "var(--c-paper2)",
        ink: "var(--c-ink)",
        inksoft: "var(--c-inksoft)",
        line: "var(--c-line)",
        brick: "var(--c-brick)",
        forest: "var(--c-forest)",
        inkHover: "var(--c-ink-hover)",
        brickSoft: "var(--c-brick-soft)",
        tileFrom: "var(--c-tile-from)",
        tileTo: "var(--c-tile-to)",
      },
      fontFamily: {
        serif: [
          "Fraunces",
          "Newsreader",
          "Georgia",
          "Songti SC",
          "STSong",
          "Noto Serif CJK SC",
          "serif",
        ],
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      boxShadow: {
        tile: "0 1px 2px rgba(28,26,23,0.06), 0 6px 18px rgba(28,26,23,0.05)",
        lift: "0 4px 10px rgba(28,26,23,0.10), 0 14px 30px rgba(28,26,23,0.08)",
        panel: "0 8px 40px rgba(28,26,23,0.18)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 360ms cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
