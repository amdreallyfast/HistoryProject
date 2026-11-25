module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // The project does not use PropTypes (no `prop-types` dependency); props are
    // documented by destructuring. Every report was noise.
    'react/prop-types': 'off',
    // react-three-fiber JSX elements (<mesh>, <meshBasicMaterial>, <spotLight>, ...)
    // take three.js object properties as props. The rule only knows DOM attributes,
    // so list the R3F props used here. Typos on real DOM elements are still caught.
    'react/no-unknown-property': ['error', {
      ignore: [
        'args', 'attach', 'geometry', 'material', 'object', 'position', 'rotation',
        'scale', 'intensity', 'angle', 'side', 'transparent', 'wireframe',
        'vertexShader', 'fragmentShader', 'uniforms', 'blending',
      ],
    }],
    // Allow deliberately unused function parameters when prefixed with `_`
    // (e.g. Redux reducers or event handlers whose signature is fixed).
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
