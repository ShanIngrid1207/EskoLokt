/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // These reference the HSL channel variables defined in mobile.css.
        // The color-mix / opacity modifiers (e.g. bg-border/60) work because
        // Tailwind v3 generates opacity utilities via CSS custom properties.
        background:         "hsl(var(--tw-bg))",
        foreground:         "hsl(var(--tw-fg))",
        border:             "hsl(var(--tw-border))",
        input:              "hsl(var(--tw-input))",
        ring:               "hsl(var(--tw-ring))",
        "muted-foreground": "hsl(var(--tw-muted-fg))",
        "primary-foreground": "hsl(var(--tw-primary-fg))",
        primary: {
          DEFAULT: "hsl(var(--tw-primary))",
          foreground: "hsl(var(--tw-primary-fg))",
        },
      },
      fontFamily: {
        sans:    ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["Geist Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
        heading: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

