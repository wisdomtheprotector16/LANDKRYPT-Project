module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // outline: {
      //   gradient: {
      //     to: {
      //       r: 'linear-gradient(to right, transparent, var(--tw-gradient-from), linear-gradient(to right, var(--tw-gradient-via), linear-gradient(to right, var(--tw-gradient-to))',
      //       l: 'linear-gradient(to left, transparent, var(--tw-gradient-from), linear-gradient(to left, var(--tw-gradient-via), linear-gradient(to left, var(--tw-gradient-to))'
      //     }
      //   }
      // },
      colors: {
        bgdarker: "#1D1F20",
        bgdark: "#181A1B",
        dark: "#0f0f1a",
        // 'dark-alt': '#1a1a2e',
        light: "#f5f5ff",
        accent: "#ff6b6b",
        success: "#4ade80",
        warning: "#fbbf24",
        info: "#60a5fa",
      },
    },
  },
  plugins: [],
};
