import tseslint from 'typescript-eslint'

export default tseslint.config(
  // src/vendor is byte-identical upstream code (see each VENDORED.md) — never linted, never edited
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'src/vendor/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // 02: no <form> tags — a native submit can navigate and destroy an uncommitted capture
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='form']",
          message: 'no <form> tags (canon 02); use explicit key handling',
        },
      ],
    },
  },
  {
    // 02: framework-free core — the data model outlives any renderer
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*', '@react-three/*', 'three', 'three/*', 'zustand', 'zustand/*'],
              message: 'src/core is framework-free (canon 02)',
            },
          ],
        },
      ],
    },
  },
)
