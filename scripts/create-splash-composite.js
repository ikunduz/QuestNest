import sharp from 'sharp';

const ARTIFACT_DIR = 'C:/Users/Asus/.gemini/antigravity/brain/f1c0c816-f8db-4414-93e4-d7c96cb4a05f';
const SPLASH_BG_SOURCE = `${ARTIFACT_DIR}/splash_bg_text_only_1768044977766.png`;
const ICON_SOURCE = 'assets/source_icon.jpg'; // User's original logo

async function compositeSplash() {
    console.log('🎨 Compositing Splash Screen...');

    // 1. Prepare Logo: Resize and Rounded Corners
    const iconBuffer = await sharp(ICON_SOURCE)
        .resize(500, 500)
        .composite([{
            input: Buffer.from('<svg><rect x="0" y="0" width="500" height="500" rx="100" ry="100" /></svg>'),
            blend: 'dest-in'
        }])
        .png()
        .toBuffer();

    // 2. Composite onto Background
    // The background is 1024x1024. Center is 512,512.
    // Icon is 500x500. Top-left of icon should be at (512 - 250) = 262.
    // However, the text is at the bottom, so maybe move it up slightly?
    // Let's vertically center it slightly higher to avoid text overlap.
    // Target Y center: 450 (slightly up). 450 - 250 = 200.

    await sharp(SPLASH_BG_SOURCE)
        .resize(1024, 1024)
        .composite([
            {
                input: iconBuffer,
                top: 220, // Vertically centered roughly in the top part
                left: 262  // Horizontally centered: (1024 - 500) / 2 = 262
            }
        ])
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/splash.png');

    console.log('✅ Splash screen created with original logo!');
}

compositeSplash().catch(err => console.error(err));
