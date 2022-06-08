// replace `process.env.${k}` when building with variables from .env file
require('dotenv').config({ override: true })
const envVars = {};
for (const k in process.env) {
    envVars[`process.env.${k}`] = JSON.stringify(process.env[k]);
}

// extra defines
const extraDefines = {
    'global': 'window', // https://github.com/evanw/esbuild/issues/73
}

require('esbuild').build({
    entryPoints: ['./src/index.jsx'],
    target: ['es6'],
    bundle: true,
    outfile: './public/bundle.js',
    minify: false,
    sourcemap: true,
    loader: {
        '.js': 'jsx',
        '.png': 'file'
    },
    define: {
        ...envVars,
        ...extraDefines,
    },
}).catch(() => process.exit(1))
