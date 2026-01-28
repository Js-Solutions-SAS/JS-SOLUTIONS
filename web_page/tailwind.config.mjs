/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        "brand-black": "#0a0a0a",
        "brand-charcoal": "#121212",
        "brand-gold": "#D4AF37",
        "brand-gold-light": "#C5A028",
        "brand-white": "#FFFFFF",
        "brand-off-white": "#E5E5E5",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(to right, #D4AF37, #C5A028)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
