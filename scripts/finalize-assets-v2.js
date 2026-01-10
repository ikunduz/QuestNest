import fs from 'fs';
import sharp from 'sharp';

const ASSETS_DIR = 'assets';
const ARTIFACT_DIR = 'C:/Users/Asus/.gemini/antigravity/brain/f1c0c816-f8db-4414-93e4-d7c96cb4a05f';

// Source Files
const ICON_SOURCE = 'assets/source_icon.jpg';
// Use the newest generated splash
const SPLASH_SOURCE = `${ARTIFACT_DIR}/splash_final_1768044800076.png`;
// Use previously generated terrain
const TERRAIN_SOURCE = `${ARTIFACT_DIR}/game_terrain_design_1768043312144.png`;
// Use previously generated kingdom bg
const KINGDOM_SOURCE = `${ARTIFACT_DIR}/kingdom_bg_design_1768043477495.png`;

async function processAssets() {
    console.log('🔄 Starting asset processing...');

    // 1. Process Icon (512x512) - Full Bleed
    console.log('📦 Processing Icon (Store)...');
    await sharp(ICON_SOURCE)
        .resize(512, 512, { fit: 'cover' })
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/icon.png');

    // 2. Process Adaptive Icon (512x512) - With Padding to prevent cut-off
    // Android adaptive icons circle crop the center 72dp of 108dp.
    // So we need clear padding. Roughly 66% scale.
    console.log('📦 Processing Adaptive Icon with Padding...');
    await sharp(ICON_SOURCE)
        .resize(340, 340, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 0 } }) // Resize logo to smaller
        .extend({
            top: 86, bottom: 86, left: 86, right: 86, // Pad to 512
            background: { r: 15, g: 23, b: 42, alpha: 1 } // Dark blue background
        })
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/adaptive-icon.png');

    // 3. Process Splash Screen (Contain/Resize)
    console.log('📦 Processing Splash Screen...');
    await sharp(SPLASH_SOURCE)
        .resize(1024, 1024, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/splash.png');

    // 4. Process Game Terrain (512x512)
    console.log('📦 Processing Game Terrain...');
    if (fs.existsSync(TERRAIN_SOURCE)) {
        await sharp(TERRAIN_SOURCE)
            .resize(512, 512)
            .png({ compressionLevel: 9, force: true })
            .toFile('assets/game_terrain.png');
    }

    // 5. Kingdom BG
    console.log('📦 Processing Kingdom BG...');
    if (fs.existsSync(KINGDOM_SOURCE)) {
        await sharp(KINGDOM_SOURCE)
            .resize(512, 512)
            .png({ compressionLevel: 9, force: true })
            .toFile('assets/kingdom_bg.png');
    }

    // 6. Favicon (48x48)
    console.log('📦 Processing Favicon...');
    await sharp(ICON_SOURCE)
        .resize(48, 48)
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/favicon.png');

    console.log('✅ All assets processed and optimized!');
}

processAssets().catch(err => {
    console.error('❌ Error processing assets:', err);
    process.exit(1);
});
