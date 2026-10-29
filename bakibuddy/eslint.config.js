import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      hooks.configs.flat.recommended,
    ],
  },
  { ignores: ["dist/**", "test-results/**"] },
]);
