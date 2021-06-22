import babel from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";
import copy from "rollup-plugin-copy";
import { name } from "./package.json";

const isProduction = process.env.NODE_ENV === 'production';

const destBase = 'lib/ts-normalizr';
const destExtension = `${isProduction ? '.min' : ''}.js`;

export default [
  {
    input: 'src/index.js',
    output: [
      { file: `${destBase}${destExtension}`, format: 'cjs' },
      { file: `${destBase}.es${destExtension}`, format: 'es' },
      { file: `${destBase}.umd${destExtension}`, format: 'umd', name },
      { file: `${destBase}.amd${destExtension}`, format: 'amd', name },
      { file: `${destBase}.browser${destExtension}`, format: 'iife', name: 'tsnormalizr' },
    ],
    plugins: [
      babel({ babelHelpers: 'bundled' }),
      typescript({
        tsconfigOverride: {
          exclude: ['index.d.ts', '**/*.test.ts']
        }
      }),
      copy({
        targets: [{
          src: 'src/index.d.ts',
          dest: 'lib/',
          rename: 'ts-normalizr.d.ts'
        }]
      })
    ]
  }
];
