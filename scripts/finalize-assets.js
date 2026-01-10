import fs from 'fs';
import sharp from 'sharp';

const ASSETS_DIR = 'assets';
const ARTIFACT_DIR = 'C:/Users/Asus/.gemini/antigravity/brain/f1c0c816-f8db-4414-93e4-d7c96cb4a05f';

// Source Files
const ICON_SOURCE = 'assets/source_icon.jpg';
const SPLASH_SOURCE = `${ARTIFACT_DIR}/splash_screen_design_1768043297994.png`;
const TERRAIN_SOURCE = `${ARTIFACT_DIR}/game_terrain_design_1768043312144.png`;

async function processAssets() {
    console.log('🔄 Starting asset processing...');

    // 1. Process Icon (512x512)
    console.log('📦 Processing Icon...');
    await sharp(ICON_SOURCE)
        .resize(512, 512)
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/icon.png');

    // 2. Process Adaptive Icon (512x512)
    console.log('📦 Processing Adaptive Icon...');
    await sharp(ICON_SOURCE)
        .resize(512, 512)
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/adaptive-icon.png');

    // 3. Process Splash Screen (Contain/Resize)
    console.log('📦 Processing Splash Screen...');
    // If source exists, use it. Otherwise create a placeholder from icon.
    if (fs.existsSync(SPLASH_SOURCE)) {
        await sharp(SPLASH_SOURCE)
            .resize(1024, 1024, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
            .png({ compressionLevel: 9, force: true })
            .toFile('assets/splash.png');
    } else {
        console.log('⚠️ Splash source not found, generating fallback.');
        await sharp(ICON_SOURCE)
            .resize(512, 512)
            .extend({
                top: 256, bottom: 256, left: 256, right: 256,
                background: { r: 15, g: 23, b: 42, alpha: 1 }
            })
            .png({ compressionLevel: 9, force: true })
            .toFile('assets/splash.png');
    }

    // 4. Process Game Terrain (512x512)
    console.log('📦 Processing Game Terrain...');
    if (fs.existsSync(TERRAIN_SOURCE)) {
        await sharp(TERRAIN_SOURCE)
            .resize(512, 512)
            .png({ compressionLevel: 9, force: true })
            .toFile('assets/game_terrain.png');
    } else {
        console.log('⚠️ Terrain source not found, using placeholder.');
        // Fallback or leave as is if generated before
    }

    // 5. Kingdom BG (From Splash Background)
    console.log('📦 Processing Kingdom BG...');
    // Extract a region from splash or generate simple color
    await sharp({
        create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 15, g: 23, b: 42, alpha: 1 }
        }
    })
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/kingdom_bg.png');


    // 6. Favicon (32x32)
    console.log('📦 Processing Favicon...');
    await sharp(ICON_SOURCE)
        .resize(32, 32)
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/favicon.png');

    console.log('✅ All assets processed and optimized!');
}

processAssets().catch(err => {
    console.error('❌ Error processing assets:', err);
    process.exit(1);
});
