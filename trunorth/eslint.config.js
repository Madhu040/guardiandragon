import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist-server/**", "dist/**", "node_modules/**", "public/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "server/**/*.ts", "api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
