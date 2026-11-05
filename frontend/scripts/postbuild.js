import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('postbuild.js: dist/index.html does not exist!');
  process.exit(1);
}

const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

// 1. Create dist/404.html for Vercel SPA fallback
fs.writeFileSync(path.join(distDir, '404.html'), htmlContent);
console.log('Created dist/404.html');

// 2. Pre-generate physical directories for each SPA route so Vercel CDN returns HTTP 200 directly
const routes = [
  'signin',
  'signup',
  'sandbox',
  'checkout',
  'transactions',
  'insights',
  'settings',
  'forgot-password',
  'reset-password'
];

routes.forEach((route) => {
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent);
  console.log(`Created dist/${route}/index.html`);
});

console.log('Postbuild static routing complete.');
