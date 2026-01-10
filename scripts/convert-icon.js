import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

// For JPG to PNG conversion, we'll use sharp
import sharp from 'sharp';

async function convertImages() {
    console.log('Converting icon.jpg to PNG format...');

    // Convert icon.jpg to icon.png
    await sharp('assets/icon.jpg')
        .resize(1024, 1024)
        .png()
        .toFile('assets/icon_new.png');
    console.log('✓ icon.png created');

    // Copy to adaptive-icon
    await sharp('assets/icon.jpg')
        .resize(1024, 1024)
        .png()
        .toFile('assets/adaptive-icon_new.png');
    console.log('✓ adaptive-icon.png created');

    // Rename files
    fs.renameSync('assets/icon_new.png', 'assets/icon.png');
    fs.renameSync('assets/adaptive-icon_new.png', 'assets/adaptive-icon.png');

    // Clean up
    fs.unlinkSync('assets/icon.jpg');

    console.log('\n✅ Done! Icons converted successfully.');
}

convertImages().catch(console.error);
