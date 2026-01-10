import fs from 'fs';
import sharp from 'sharp';

async function resizeImages() {
    console.log('Resizing icons to 512x512...');

    // Resize icon.png
    await sharp('assets/icon.png')
        .resize(512, 512)
        .png({ compressionLevel: 9 })
        .toFile('assets/icon_resized.png');

    // Resize adaptive-icon.png
    await sharp('assets/adaptive-icon.png')
        .resize(512, 512)
        .png({ compressionLevel: 9 })
        .toFile('assets/adaptive-icon_resized.png');

    // Replace originals
    fs.unlinkSync('assets/icon.png');
    fs.unlinkSync('assets/adaptive-icon.png');
    fs.renameSync('assets/icon_resized.png', 'assets/icon.png');
    fs.renameSync('assets/adaptive-icon_resized.png', 'assets/adaptive-icon.png');

    console.log('✅ Done! Icons resized to 512x512.');
}

resizeImages().catch(console.error);
