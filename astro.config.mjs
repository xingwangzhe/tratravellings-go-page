// @ts-check
import { defineConfig } from 'astro/config';
import singleFile from './single-file-integration.js';

// https://astro.build/config
export default defineConfig({
	integrations: [singleFile()],
    output: 'static'
});