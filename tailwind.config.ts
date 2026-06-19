import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#050817", stardust: "#b6a3ff", gold: "#e9c97b" }, fontFamily: { sans: ["var(--font-manrope)"], display: ["var(--font-space)"] } } },
  plugins: []
};
export default config;
