export default {
  plugins:
    process.env.NODE_ENV === "test"
      ? {}
      : {
          "@tailwindcss/postcss": {},
          autoprefixer: {},
        },
};
