import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { 'index': 'src/index.ts' },
  outDir: '.',
  format: 'esm',
  clean: false,
  outputOptions: {
    entryFileNames: '[name].es',
  },
  deps: {
    neverBundle: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-redux',
      'reselect',
      'lodash',
      'electron',
      'path-extra',
      'i18next',
      'react-i18next',
      'views/utils/selectors',
      'views/create-store',
      'views/services/utils',
      '@blueprintjs/core',
      '@blueprintjs/icons',
    ],
  },
})
