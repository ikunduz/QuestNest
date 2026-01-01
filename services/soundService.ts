import { Audio } from 'expo-av';

type SoundName = 'click' | 'questComplete' | 'levelUp' | 'xpGain' | 'blessing' | 'feed' | 'error';

class SoundService {
    private sounds: Map<SoundName, Audio.Sound> = new Map();
    private isEnabled: boolean = true;
    private initialized: boolean = false;

    async init() {
        if (this.initialized) return;

        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
            this.initialized = true;
        } catch (e) {
            console.log('Audio init skipped (no audio mode support)');
        }
    }

    // Placeholder sound player - uses system beep or silent
    async play(name: SoundName) {
        if (!this.isEnabled) return;

        // Ses dosyaları eklendiğinde burada yüklenecek
        // Şimdilik sadece console log
        console.log(`🔊 Sound: ${name}`);

        // Haptic feedback alternatifi (import edilirse)
        // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    async cleanup() {
        for (const sound of this.sounds.values()) {
            try {
                await sound.unloadAsync();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        this.sounds.clear();
    }
}

export const soundService = new SoundService();

// Kolaylık fonksiyonları
export const playClick = () => soundService.play('click');
export const playQuestComplete = () => soundService.play('questComplete');
export const playLevelUp = () => soundService.play('levelUp');
export const playXpGain = () => soundService.play('xpGain');
export const playBlessing = () => soundService.play('blessing');
export const playFeed = () => soundService.play('feed');
export const playError = () => soundService.play('error');
