import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  {
    ignores: [".next/**", "dist/**", "node_modules/**", "build/**", "**/generated/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-useless-catch": "off",
      "no-empty": "off",
      "no-undef": "off", // Many files use globals like document, process, fetch
      "prefer-const": "off",
    }
  }
];


