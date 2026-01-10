import sharp from 'sharp';

const SOURCE = 'assets/final_source.png';
// Using a dark color that likely matches or blends with the user's glassmorphism style
const BG_COLOR = '#181825';

async function process() {
    console.log('🚀 Processing Final Assets...');

    // 1. Icon (512x512) - Standard
    await sharp(SOURCE)
        .resize(512, 512)
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/icon.png');
    console.log('✓ Icon created');

    // 2. Adaptive Icon (Safe padded)
    // We resize the logo to 360px (70% of 512) to stay within safe zone
    await sharp(SOURCE)
        .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({
            top: 76, bottom: 76, left: 76, right: 76,
            background: BG_COLOR
        })
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/adaptive-icon.png');
    console.log('✓ Adaptive Icon created');

    // 3. Splash (With Text)
    // SVG for the text "Kahraman Aile Görevleri"
    const textSvg = `
    <svg width="1024" height="1024">
        <style>
            .title { fill: #cbd5e1; font-size: 56px; font-family: sans-serif; font-weight: 500; letter-spacing: 1px; }
        </style>
        <text x="50%" y="92%" text-anchor="middle" class="title">Kahraman Aile Görevleri</text>
    </svg>
    `;

    // Resize source for splash center
    const splashLogo = await sharp(SOURCE)
        .resize(700, 700)
        .toBuffer();

    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: BG_COLOR
        }
    })
        .composite([
            { input: splashLogo, gravity: 'center' }, // Center the logo
            { input: Buffer.from(textSvg), top: 0, left: 0 } // Add text overlay
        ])
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/splash.png');
    console.log('✓ Splash created');

    // 4. Update Favicon too just in case
    await sharp(SOURCE)
        .resize(48, 48)
        .png({ compressionLevel: 9, force: true })
        .toFile('assets/favicon.png');
    console.log('✓ Favicon created');

    console.log('✅ Final Assets Ready!');
}

process().catch(err => console.error(err));
