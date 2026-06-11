import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react'; // 1. Import React

export default defineConfig({
  output: 'static',
  site: 'https://arjundubey.com',

  // 2. Add the React integration array
  integrations: [
    react(),
  ],

  // 3. Keep your Tailwind Vite plugin exactly as is
  vite: {
    plugins: [tailwindcss()],
  },
});