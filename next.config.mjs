// next.config.mjs
import withPWA from 'next-pwa';

// 1) Your normal Next.js config (ONLY Next options go here)
const nextConfig = {
  reactStrictMode: true,

  // allow your iPhone to hit dev server over LAN
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.196:3000', // your Mac’s LAN IP
  ],

  // (add other Next options as needed)
};

// 2) PWA/Workbox options go into withPWA(...)
const pwaOptions = {
  dest: 'public',
  // keep PWA mostly disabled in dev so you don’t fight caches
  disable: process.env.NODE_ENV === 'development',
  // you can add other next-pwa/workbox options here later (e.g. runtimeCaching)
};

// 3) Export Next config wrapped with PWA enhancer
export default withPWA(pwaOptions)(nextConfig);