import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["**/lib/**", "**/build/**", "**/node_modules/**", "**/*.d.ts"],
  },

  // Base recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Node.js environment for lang package
  {
    files: ["lang/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Mocha globals for test files
  {
    files: ["**/tests/**/*.ts", "**/*.test.ts"],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },

  // React configuration for demo and react-editor packages
  {
    files: ["demo/**/*.{ts,tsx}", "react-editor/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // Disable rules that conflict with Prettier
  eslintConfigPrettier,

  // Custom rule overrides
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
