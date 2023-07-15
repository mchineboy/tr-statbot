import { build } from 'esbuild';
// imprt {  } from 'esbuild-node-tsc';

build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    treeShaking: true,

    minify: true,
    sourcemap: true,
    outfile: 'dist/index.js',
    // plugins: [nodeResolvePlugin()],
    external: [
        "sqlite3",
        "better-sqlite3",
        "tedious",
        "mysql2",
        "oracledb",
        "pg-native",
        "mysql",
        "pg-query-stream"
    ],
    platform: 'node',
    target: 'node18',
}).catch(() => process.exit(1));
