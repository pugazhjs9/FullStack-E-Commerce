/* eslint-env node */

const isTest = process.env.NODE_ENV === "test";

export default {
  plugins: isTest
    ? []
    : {
        tailwindcss: {},
        autoprefixer: {},
      },
};