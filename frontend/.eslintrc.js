module.exports = {
  extends: ["react-app", "react-app/jest"],
  rules: {
    // Disable rules that are causing issues
    "@typescript-eslint/no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "warn",
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
