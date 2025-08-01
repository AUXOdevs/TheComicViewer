import flowbite from "flowbite/plugin";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.js",
  ],
  theme: {
    extend: {
      rotate: {
        "y-20": "20deg",
        "-y-20": "-20deg",
      },
      perspective: {
        1000: "1000px",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".backface-hidden": {
          "backface-visibility": "hidden",
        },
        ".preserve-3d": {
          "transform-style": "preserve-3d",
        },
      });
    },
    flowbite,
  ],
};

export default config;
