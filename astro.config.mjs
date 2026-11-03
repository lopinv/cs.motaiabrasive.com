import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://cs.motaiabrasive.com',
  trailingSlash: 'always'
});
