module.exports = {
  theme: {
    extend: {
      backfaceVisibility: ["responsive"],
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".backface-hidden": {
          "backface-visibility": "hidden",
        },
      });
    },
  ],
};