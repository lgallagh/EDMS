import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //To deploy in IIS, the 'base' should be set to the path the application is running under
  base: '/edms/frontend',
  server: {
    host: "127.0.0.1",
    port: 3010, // Customize your development server port if needed
  },
  build: {
    sourcemap: true, // Enable sourcemaps for debugging
  },
  esbuild: {
    sourcemap: true, // Enable sourcemaps in esbuild
  }
});
