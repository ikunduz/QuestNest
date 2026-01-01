import { Audio } from 'expo-av';

// Ses dosyaları - require ile yüklenir
const SOUNDS = {
    click: require('../assets/sounds/click.mp3'),
    questComplete: require('../assets/sounds/quest_complete.mp3'),
    levelUp: require('../assets/sounds/level_up.mp3'),
    xpGain: require('../assets/sounds/xp_gain.mp3'),
    blessing: require('../assets/sounds/blessing.mp3'),
    feed: require('../assets/sounds/feed.mp3'),
    error: require('../assets/sounds/error.mp3'),
};

type SoundName = keyof typeof SOUNDS;

class SoundService {
    private sounds: Map<SoundName, Audio.Sound> = new Map();
    private isEnabled: boolean = true;

    async init() {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
        } catch (e) {
            console.error('Audio init error:', e);
        }
    }

    async preload() {
        try {
            for (const [name, source] of Object.entries(SOUNDS)) {
                const { sound } = await Audio.Sound.createAsync(source);
                this.sounds.set(name as SoundName, sound);
            }
        } catch (e) {
            console.error('Sound preload error:', e);
        }
    }

    async play(name: SoundName) {
        if (!this.isEnabled) return;

        try {
            const sound = this.sounds.get(name);
            if (sound) {
                await sound.replayAsync();
            } else {
                // Lazy load if not preloaded
                const source = SOUNDS[name];
                if (source) {
                    const { sound: newSound } = await Audio.Sound.createAsync(source);
                    await newSound.playAsync();
                    this.sounds.set(name, newSound);
                }
            }
        } catch (e) {
            console.error(`Play sound error (${name}):`, e);
        }
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    async cleanup() {
        for (const sound of this.sounds.values()) {
            await sound.unloadAsync();
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
