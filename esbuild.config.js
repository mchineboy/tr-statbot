import { build } from 'esbuild';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve'
// imprt {  } from 'esbuild-node-tsc';

build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    treeShaking: false,
    minify: false,
    sourcemap: true,
    outdir: 'dist',
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
    plugins: [
        NodeResolvePlugin({
            extensions: ['.ts', '.js'],
            onResolved: (resolved) => {
                if (resolved.includes('node_modules')) {
                    return {
                        external: true,
                    }
                }
                return resolved
            },
        }),
    ],
    target: 'node18',
}).catch(() => process.exit(1));
