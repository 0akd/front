import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://arjundubey.com',

  vite: {
    plugins: [tailwindcss()],
  },
});