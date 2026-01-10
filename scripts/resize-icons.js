import fs from 'fs';
import sharp from 'sharp';

async function resizeImages() {
    console.log('Resizing and centering icons...');

    // Background color (Dark Navy from your theme)
    const BACKGROUND_COLOR = '#0f172a';
    const CANVAS_SIZE = 512;
    const ICON_SIZE = 300; // ~60% of canvas size to ensure it's centered and not cut off

    // Create background
    const background = await sharp({
        create: {
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            channels: 4,
            background: BACKGROUND_COLOR
        }
    }).png().toBuffer();

    // Process icon.png (Center it)
    const inputIconBuffer = await sharp('assets/icon.png')
        .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    await sharp(background)
        .composite([{ input: inputIconBuffer, gravity: 'center' }])
        .png({ compressionLevel: 9 })
        .toFile('assets/icon_resized.png');

    console.log('✅ Created centered icon_resized.png');

    // Process adaptive-icon.png (Center it)
    // For adaptive icon, we might want the same logic if the input is the same full-bleed logo
    const inputAdaptiveBuffer = await sharp('assets/adaptive-icon.png')
        .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    await sharp(background)
        .composite([{ input: inputAdaptiveBuffer, gravity: 'center' }])
        .png({ compressionLevel: 9 })
        .toFile('assets/adaptive-icon_resized.png');

    console.log('✅ Created centered adaptive-icon_resized.png');

    // Replace originals
    // We'll create a backup first just in case
    if (!fs.existsSync('assets/icon_backup.png')) {
        fs.copyFileSync('assets/icon.png', 'assets/icon_backup.png');
    }
    if (!fs.existsSync('assets/adaptive-icon_backup.png')) {
        fs.copyFileSync('assets/adaptive-icon.png', 'assets/adaptive-icon_backup.png');
    }

    try {
        fs.unlinkSync('assets/icon.png');
        fs.unlinkSync('assets/adaptive-icon.png');
    } catch (e) {
        // Ignore if files don't exist (unlikely)
    }

    fs.renameSync('assets/icon_resized.png', 'assets/icon.png');
    fs.renameSync('assets/adaptive-icon_resized.png', 'assets/adaptive-icon.png');

    console.log('✅ Done! Icons updated (Backups saved as *_backup.png).');
}

resizeImages().catch(console.error);
