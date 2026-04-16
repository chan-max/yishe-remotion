import { config } from "@remotion/eslint-config-flat";

export default [
  {
    ignores: ["release/**", "dist/**"],
  },
  ...config,
];
