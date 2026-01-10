import fs from 'fs';
import { PNG } from 'pngjs';

// Create simple placeholder PNGs

// Favicon (32x32 dark blue)
console.log('Creating favicon.png...');
const favicon = new PNG({ width: 32, height: 32 });
for (let y = 0; y < favicon.height; y++) {
    for (let x = 0; x < favicon.width; x++) {
        const idx = (favicon.width * y + x) << 2;
        favicon.data[idx] = 30;
        favicon.data[idx + 1] = 41;
        favicon.data[idx + 2] = 59;
        favicon.data[idx + 3] = 255;
    }
}
fs.writeFileSync('assets/favicon.png', PNG.sync.write(favicon));
console.log('✓ favicon.png created');

// Splash (1024x1024 dark gradient)
console.log('Creating splash.png...');
const splash = new PNG({ width: 512, height: 512 });
for (let y = 0; y < splash.height; y++) {
    for (let x = 0; x < splash.width; x++) {
        const idx = (splash.width * y + x) << 2;
        const gradient = Math.floor(y / splash.height * 30);
        splash.data[idx] = 15 + gradient;
        splash.data[idx + 1] = 23 + gradient;
        splash.data[idx + 2] = 42 + gradient;
        splash.data[idx + 3] = 255;
    }
}
fs.writeFileSync('assets/splash.png', PNG.sync.write(splash));
console.log('✓ splash.png created');

// Kingdom bg (256x256 gradient)
console.log('Creating kingdom_bg.png...');
const kingdom = new PNG({ width: 256, height: 256 });
for (let y = 0; y < kingdom.height; y++) {
    for (let x = 0; x < kingdom.width; x++) {
        const idx = (kingdom.width * y + x) << 2;
        const gradient = Math.floor(y / kingdom.height * 40);
        kingdom.data[idx] = 20 + gradient;
        kingdom.data[idx + 1] = 30 + gradient;
        kingdom.data[idx + 2] = 50 + gradient;
        kingdom.data[idx + 3] = 255;
    }
}
fs.writeFileSync('assets/kingdom_bg.png', PNG.sync.write(kingdom));
console.log('✓ kingdom_bg.png created');

console.log('\nAll placeholder PNGs created!');
