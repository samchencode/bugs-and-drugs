import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import url from '@rollup/plugin-url';
import copy from 'rollup-plugin-copy';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn(
        'npm',
        ['run', 'start', '--', '--dev'],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        }
      );

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/main.ts',
  output: [
    {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'public/build/bundle.js',
    },
    {
      sourcemap: false,
      format: 'iife',
      name: 'app',
      file: 'docs/build/bundle.js',
      globals: {
        production,
      },
    },
  ],
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: 'bundle.css' }),

    url({
      limit: 0,
      include: ['**/*.csv'],
      fileName: '/data/[name][extname]',
      emitFiles: false,
    }),

    copy({
      targets: [
        { src: 'src/data/**/*', dest: ['public/data', 'docs/data'] },
        {
          src: ['public/global.css', 'public/favicon.png'],
          dest: 'docs',
        },
        { src: 'public/build/bundle.css', dest: 'docs/build' },
      ],
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),
    alias({
      resolve: ['.js', '.jsx', '.ts', '.tsx', '.svelte', '.csv'],
      entries: [{ find: /@/, replacement: path.resolve(__dirname, './src') }],
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
