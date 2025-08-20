// generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = './public/icons';
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Required sizes from manifest
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Source image (adjust path if needed)
sharp('src/logo.png')
  .resize(512, 512)
  .toFile('./public/icons/icon-512x512.png')
  .then(() => {
    console.log('512x512 icon generated');
    // Generate all sizes from the required list
    sizes.forEach(size => {
      sharp('src/logo.png')
        .resize(size, size)
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
        .then(() => {
          console.log(`${size}x${size} icon generated`);
        })
        .catch(err => {
          console.error(`Error generating ${size}x${size}:`, err);
        });
    });
  })
  .catch(err => {
    console.error('Error generating base icon:', err);
  });