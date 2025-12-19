import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: parseInt(env.VITE_PORT) || 5173,
      historyApiFallback: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
