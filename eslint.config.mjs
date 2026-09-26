import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores([".next/**", ".vinext/**", "dist/**", "node_modules/**", "work/**"]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  {
    files: ["src/components/PortalScene.tsx", "src/components/StageCurtain.tsx", "src/components/CasinoFlorals.tsx"],
    // R3F JSX maps to Three objects; these properties are checked by TypeScript.
    rules: { "react/no-unknown-property": "off" },
  },
  {
    files: [
      "src/components/PortalScene.tsx",
      "src/lib/useArcade.ts",
      "src/CreativeWorkshop.tsx",
    ],
    // The presentation-only GSAP/Three store is intentionally mutable. The reducer
    // remains the immutable authority for access, input locks and session state.
    rules: { "react-hooks/immutability": "off" },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);

export default eslintConfig;
