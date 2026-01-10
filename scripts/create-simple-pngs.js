import fs from 'fs';
import { PNG } from 'pngjs';

// Create a simple solid green terrain PNG (256x256)
console.log('Creating game_terrain.png...');
const terrain = new PNG({ width: 256, height: 256 });
for (let y = 0; y < terrain.height; y++) {
    for (let x = 0; x < terrain.width; x++) {
        const idx = (terrain.width * y + x) << 2;
        terrain.data[idx] = 100;     // R
        terrain.data[idx + 1] = 180; // G - green
        terrain.data[idx + 2] = 80;  // B
        terrain.data[idx + 3] = 255; // A
    }
}
const terrainBuffer = PNG.sync.write(terrain);
fs.writeFileSync('assets/game_terrain.png', terrainBuffer);
console.log(`✓ game_terrain.png created (${Math.round(terrainBuffer.length / 1024)}KB)`);

// Create a simple dark blue icon PNG (512x512)
console.log('Creating icon.png...');
const icon = new PNG({ width: 512, height: 512 });
for (let y = 0; y < icon.height; y++) {
    for (let x = 0; x < icon.width; x++) {
        const idx = (icon.width * y + x) << 2;
        icon.data[idx] = 30;      // R
        icon.data[idx + 1] = 41;  // G
        icon.data[idx + 2] = 59;  // B - dark blue
        icon.data[idx + 3] = 255; // A
    }
}
const iconBuffer = PNG.sync.write(icon);
fs.writeFileSync('assets/icon.png', iconBuffer);
fs.writeFileSync('assets/adaptive-icon.png', iconBuffer);
console.log(`✓ icon.png created (${Math.round(iconBuffer.length / 1024)}KB)`);

console.log('\nDone! Simple placeholder PNGs created.');
