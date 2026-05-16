import { readFileSync, writeFileSync } from 'fs';

const path = './dist/server/wrangler.json';
const config = JSON.parse(readFileSync(path, 'utf-8'));

// Remove ALL Pages-incompatible keys
delete config.assets;
delete config.rules;
delete config.images;
delete config.previews;
delete config.main;
delete config.triggers;
delete config.migrations;
delete config.jsx_factory;
delete config.jsx_fragment;
delete config.cloudchamber;
delete config.python_modules;
delete config.no_bundle;
delete config.dev;

writeFileSync(path, JSON.stringify(config, null, 2));
console.log('✅ wrangler.json patched successfully');