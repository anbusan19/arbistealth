import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored WebGL/canvas design-system components (TechText, shaders/*):
    // untouched third-party-style code, never linted in its original project.
    "src/shaders/**",
    "src/components/TechText.tsx",
    "src/components/DecryptedText.tsx",
  ]),
]);

export default eslintConfig;
