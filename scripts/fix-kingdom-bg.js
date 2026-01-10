import sharp from 'sharp';

const KINGDOM_SOURCE = 'C:/Users/Asus/.gemini/antigravity/brain/f1c0c816-f8db-4414-93e4-d7c96cb4a05f/kingdom_bg_design_1768043477495.png';
const OUTPUT = 'assets/kingdom_bg.png';

async function processKingdomBg() {
    console.log('Processing Kingdom BG...');
    try {
        await sharp(KINGDOM_SOURCE)
            .resize(512, 512)
            .png({ compressionLevel: 9, force: true })
            .toFile(OUTPUT);
        console.log('✅ Kingdom BG processed successfully!');
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

processKingdomBg();
