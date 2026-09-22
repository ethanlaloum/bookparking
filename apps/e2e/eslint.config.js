import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['test-results', 'playwright-report', '.e2e'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'page',
          property: 'route',
          message:
            "Rien n'est simulé à ce barreau : page.route() ferait revenir le barreau mocké par la fenêtre.",
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/data-testid/]",
          message:
            "Les locators passent par les noms accessibles. Un élément introuvable par son nom accessible est un défaut d'accessibilité, pas un besoin de testid.",
        },
      ],
    },
  },
);
