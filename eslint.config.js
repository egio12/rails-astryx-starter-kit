import pluginJs from "@eslint/js"
import eslintReact from "@eslint-react/eslint-plugin"
import prettierConfig from "eslint-config-prettier/flat"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import { importX } from "eslint-plugin-import-x"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import { configs as tseslintConfigs } from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["app/javascript/**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  {
    ignores: [
      "app/javascript/components/ui/**",
      "app/javascript/routes/**",
      "app/javascript/types/serializers/**",
    ],
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  pluginJs.configs.recommended,
  reactHooks.configs.flat.recommended,
  ...tseslintConfigs.stylisticTypeChecked,
  ...tseslintConfigs.recommendedTypeChecked,
  {
    files: ["app/javascript/**/*.{ts,tsx}"],
    ...eslintReact.configs["recommended-typescript"],
  },
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  prettierConfig,
  {
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    rules: {
      "import-x/order": [
        "error",
        {
          pathGroups: [
            {
              pattern: "@/**",
              group: "external",
              position: "after",
            },
          ],
          "newlines-between": "always",
          named: true,
          alphabetize: { order: "asc" },
        },
      ],
      "import-x/first": "error",
      "import-x/extensions": [
        "error",
        "always",
        {
          js: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.js"],
    ...tseslintConfigs.disableTypeChecked,
  },
]
