import { defineConfig, EnvironmentModuleGraph } from "vite"; 
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/browser/index.ts'),
            name: 'Keysync',
            fileName: (format) => `keysync-browser.${format}.js`,
            formats: ['es', 'umd']
        },
        rollupOptions: {
            external: ['essentia.js', 'audio-decode'],
            output: {
                globals: {
                    'essentia.js': 'EssentiaJS',
                    'audio-decode': 'AudioDecode'
                }
            }
        },
        minify: true,
        target: 'es2020'
    }
});