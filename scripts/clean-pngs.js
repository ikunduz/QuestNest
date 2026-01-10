import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const filesToProcess = [
    'assets/icon.png',
    'assets/adaptive-icon.png',
    'assets/game_terrain.png',
    'assets/kingdom_bg.png',
    'assets/splash.png',
    'assets/favicon.png'
];

filesToProcess.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filePath} - file not found`);
        return;
    }

    console.log(`Processing ${filePath}...`);

    const data = fs.readFileSync(filePath);
    const png = PNG.sync.read(data);

    // Rewrite the PNG with clean metadata
    const buffer = PNG.sync.write(png, {
        colorType: 6, // RGBA
        filterType: -1
    });

    fs.writeFileSync(filePath, buffer);
    console.log(`✓ ${filePath} cleaned (${Math.round(buffer.length / 1024)}KB)`);
});

console.log('\nDone! All PNG files have been cleaned.');
