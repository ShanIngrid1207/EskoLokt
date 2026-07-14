/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // EskoLokt tokens live under --el-* so they never collide with the
        // existing hex custom properties in styles.css (old demo keeps working).
        background: "hsl(var(--el-background) / <alpha-value>)",
        foreground: "hsl(var(--el-foreground) / <alpha-value>)",
        "muted-foreground": "hsl(var(--el-muted-foreground) / <alpha-value>)",
        border: "hsl(var(--el-border) / <alpha-value>)",
        input: "hsl(var(--el-input) / <alpha-value>)",
        ring: "hsl(var(--el-ring) / <alpha-value>)",
        card: "hsl(var(--el-card) / <alpha-value>)",
        primary: "hsl(var(--el-primary) / <alpha-value>)",
        "primary-foreground": "hsl(var(--el-primary-foreground) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
