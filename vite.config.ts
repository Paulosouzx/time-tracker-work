import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: 'react-bits',
        replacement: path.resolve(__dirname, 'node_modules/react-bits/lib/index.js'),
      },
      {
        find: 'react-native-web/dist/apis/StyleSheet/registry',
        replacement: path.resolve(__dirname, 'src/react-native-web-style-registry.ts'),
      },
    ],
  },
});