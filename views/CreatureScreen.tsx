import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Heart, Zap, Dna, Utensils, Gamepad2, Moon, Sun, Coins, Lock, Timer, Sparkles } from 'lucide-react-native';
import { UserState, PetState, EvolutionStage } from '../types';

const { width } = Dimensions.get('window');

interface CreatureScreenProps {
    user: UserState;
    onUpdateUser: (updates: Partial<UserState>) => void;
    pet: PetState;
    onUpdatePet: (updates: Partial<PetState>) => void;
}

// Evolution Stage Configuration
const STAGE_CONFIG: Record<EvolutionStage, {
    goal: number;
    label: string;
    img: string;
    next?: EvolutionStage
}> = {
    egg: {
        goal: 500,
        label: 'EJDERHA YUMURTASI',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYF_kG8r3ZlJ6o5UuE9Y6zD8RjF7d0V9A9I9q9B9C9D9E9F9G9H9I9J9K9L9M9N9O9P9Q9R9S9T9U9V9W9X9Y9Z', // Egg Placeholder
        next: 'hatching'
    },
    hatching: {
        goal: 0,
        label: 'YUMURTA ÇATLIYOR...',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_egg_hatching_placeholder', // Hatching placeholder
        next: 'baby'
    },
    baby: {
        goal: 1500,
        label: 'BEBEK EJDERHA',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtesTw0DmY0QUEiFlom1NAGjy49QWDhjWlrxBWEypzxTUqgmCw5Jq6vEUd527lJtDk97cmWYh9zcD7hzF6dpeUasOUVcJre9k-87hoMyGcGKJXqVpdPZVMs_SYrjOj4gqFJtrw9oN_myx5gDOV84WmZmRwRNKnjbIAcROIDmxudMht (Small Ignis)',
        next: 'teen'
    },
    teen: {
        goal: 3000,
        label: 'GENÇ EJDERHA',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuTeenIgnisPlaceholder',
        next: 'adult'
    },
    adult: {
        goal: 10000,
        label: 'YETİŞKİN EJDERHA',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdultIgnisPlaceholder'
    }
};

// Evolution Duration (24 hours in MS)
const EVOLUTION_DURATION = 24 * 60 * 60 * 1000;
// const TEST_DURATION = 60 * 1000; // 1 minute for testing

export const CreatureScreen: React.FC<CreatureScreenProps> = ({ user, onUpdateUser, pet, onUpdatePet }) => {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const config = STAGE_CONFIG[pet.stage];

    // Handle Floating Animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -15, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Handle Evolution Timer
    useEffect(() => {
        if (pet.evolutionStartTime) {
            const interval = setInterval(() => {
                const now = Date.now();
                const diff = (pet.evolutionStartTime! + EVOLUTION_DURATION) - now;

                if (diff <= 0) {
                    clearInterval(interval);
                    setTimeLeft(0);
                    // Automatically evolve to baby if hatching is done
                    if (pet.stage === 'hatching') {
                        onUpdatePet({ stage: 'baby', evolutionStartTime: undefined, goldSpent: 0, evolution: 0 });
                    }
                } else {
                    setTimeLeft(diff);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [pet.evolutionStartTime, pet.stage]);

    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFeed = () => {
        if (pet.stage === 'hatching') return;

        const cost = 50;
        const currentGold = user.xp * 5;

        if (currentGold < cost) {
            Alert.alert("Yetersiz Altın!", "Gidip biraz görev tamamlamalıyız!");
            return;
        }

        // Deduct XP (currency)
        onUpdateUser({ xp: Math.max(0, user.xp - (cost / 5)) });

        // Update Pet
        const newGoldSpent = pet.goldSpent + cost;
        const progress = Math.min(100, (newGoldSpent / config.goal) * 100);

        let updates: Partial<PetState> = {
            goldSpent: newGoldSpent,
            evolution: progress,
            happiness: Math.min(100, pet.happiness + 10)
        };

        if (progress >= 100 && config.next) {
            updates.stage = config.next as EvolutionStage;
            updates.evolutionStartTime = Date.now();
            Alert.alert("EVRİM BAŞLIYOR!", "Yeterli altın harcandı! 24 saat sonra bir sonraki evrede görüşürüz.");
        } else {
            Alert.alert("Miam!", "Ignis beslendi! Bir sonraki evreye yaklaşıyoruz.");
        }

        onUpdatePet(updates);
    };

    const handlePlay = () => {
        if (pet.stage === 'hatching' || pet.stage === 'egg') {
            Alert.alert("Henüz Değil", "Bu evrede oyun oynayamazsın!");
            return;
        }
        if (pet.energy < 20) {
            Alert.alert("Yorgun", "Ignis'in dinlenmesi lazım.");
            return;
        }
        onUpdatePet({
            energy: Math.max(0, pet.energy - 20),
            happiness: Math.min(100, pet.happiness + 20)
        });
    };

    const handleRest = () => {
        onUpdatePet({ energy: 100 });
        Alert.alert("Zzz...", "Enerji toplandı!");
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1e1b4b', '#0f172a', '#020617']} style={StyleSheet.absoluteFill} />

            {/* HUD */}
            <View style={styles.hudLayer}>
                <BlurView intensity={30} tint="dark" style={styles.hudCard}>
                    <View style={styles.hudProfile}>
                        <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.hudLvl}>
                            <Text style={styles.hudLvlText}>{pet.level}</Text>
                        </LinearGradient>
                        <View>
                            <Text style={styles.hudName}>{pet.name}</Text>
                            <Text style={styles.hudType}>{config.label}</Text>
                        </View>
                    </View>
                    <View style={styles.hudGold}>
                        <Text style={styles.hudGoldText}>{user.xp * 5}</Text>
                        <Coins size={16} color="#fbbf24" fill="#fbbf24" />
                    </View>
                </BlurView>
            </View>

            {/* Main Visual */}
            <View style={styles.scene}>
                <View style={styles.glowEffect} />
                <Animated.View style={[styles.creatureContainer, { transform: [{ translateY: bounceAnim }] }]}>
                    {pet.stage === 'egg' ? (
                        <View style={styles.eggContainer}>
                            <Text style={{ fontSize: 120 }}>🥚</Text>
                            <Sparkles size={40} color="#fbbf24" style={styles.eggSparkle} />
                        </View>
                    ) : (
                        <Image source={{ uri: config.img }} style={styles.creatureImage} resizeMode="contain" />
                    )}
                </Animated.View>
                <View style={styles.shadow} />
            </View>

            {/* Evolution Info Card */}
            <View style={styles.evolutionCardContainer}>
                <BlurView intensity={40} tint="dark" style={styles.evolutionCard}>
                    {pet.stage === 'hatching' ? (
                        <View style={styles.timerSection}>
                            <Timer size={32} color="#fbbf24" />
                            <Text style={styles.timerValue}>{timeLeft ? formatTime(timeLeft) : '00:00:00'}</Text>
                            <Text style={styles.timerSub}>GELİŞİM TAMAMLANIYOR...</Text>
                        </View>
                    ) : (
                        <View style={styles.goalSection}>
                            <View style={styles.goalHeader}>
                                <Text style={styles.goalTitle}>GELİŞİM HEDEFİ</Text>
                                <Text style={styles.goalValue}>{pet.goldSpent} / {config.goal} 🪙</Text>
                            </View>
                            <View style={styles.goalBarBG}>
                                <View style={[styles.goalBarFill, { width: `${pet.evolution}%` }]}>
                                    <LinearGradient colors={['#fbbf24', '#f59e0b']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                                </View>
                            </View>
                        </View>
                    )}
                </BlurView>
            </View>

            {/* Action Panel */}
            <View style={styles.bottomSection}>
                <View style={styles.actionRow}>
                    <View style={styles.sideActionContainer}>
                        <TouchableOpacity
                            style={[styles.miniActionBtn, pet.stage === 'hatching' && styles.disabledBtn]}
                            onPress={handleFeed}
                            disabled={pet.stage === 'hatching'}
                        >
                            <BlurView intensity={30} tint="light" style={styles.miniActionInner}>
                                <Utensils size={20} color="#f59e0b" />
                            </BlurView>
                        </TouchableOpacity>
                        <Text style={styles.miniLabel}>BESLE</Text>
                        <Text style={styles.miniCost}>50g</Text>
                    </View>

                    <View style={styles.mainActionContainer}>
                        <TouchableOpacity
                            style={[styles.playBtn, (pet.stage === 'hatching' || pet.stage === 'egg') && styles.disabledBtn]}
                            onPress={handlePlay}
                            disabled={pet.stage === 'hatching' || pet.stage === 'egg'}
                        >
                            <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.playInner}>
                                {(pet.stage === 'hatching' || pet.stage === 'egg') ? <Lock size={28} color="#000" /> : <Gamepad2 size={28} color="#000" />}
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={styles.playLabel}>OYNA</Text>
                        {(pet.stage === 'hatching' || pet.stage === 'egg') && (
                            <Text style={styles.lockHint}>Yumurtadan çıkınca açılır!</Text>
                        )}
                    </View>

                    <View style={styles.sideActionContainer}>
                        <TouchableOpacity
                            style={[styles.miniActionBtn, pet.stage === 'hatching' && styles.disabledBtn]}
                            onPress={handleRest}
                            disabled={pet.stage === 'hatching'}
                        >
                            <BlurView intensity={30} tint="light" style={styles.miniActionInner}>
                                <Moon size={20} color="#a855f7" />
                            </BlurView>
                        </TouchableOpacity>
                        <Text style={styles.miniLabel}>DİNLEN</Text>
                        <Text style={styles.miniCost}>Bedava</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    hudLayer: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 100 },
    hudCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    hudProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hudLvl: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    hudLvlText: { color: '#000', fontWeight: '900', fontSize: 16 },
    hudName: { color: '#fff', fontSize: 16, fontWeight: '800' },
    hudType: { color: '#fbbf24', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    hudGold: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
    hudGoldText: { color: '#fbbf24', fontWeight: '800', fontSize: 16 },

    scene: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 280 },
    glowEffect: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(251, 191, 36, 0.1)', shadowColor: '#fbbf24', shadowOpacity: 0.5, shadowRadius: 60 },
    creatureContainer: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    creatureImage: { width: '100%', height: '100%' },
    eggContainer: { justifyContent: 'center', alignItems: 'center' },
    eggSparkle: { position: 'absolute', top: 0, right: 20 },
    shadow: { width: 140, height: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 100, marginTop: -40, transform: [{ scaleY: 0.5 }] },

    evolutionCardContainer: { position: 'absolute', bottom: 210, left: 20, right: 20, zIndex: 100 },
    evolutionCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    goalSection: { gap: 12 },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    goalValue: { color: '#fff', fontSize: 14, fontWeight: '800' },
    goalBarBG: { height: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    goalBarFill: { height: '100%', borderRadius: 8 },

    timerSection: { alignItems: 'center', gap: 8 },
    timerValue: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
    timerSub: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

    bottomSection: { position: 'absolute', bottom: 110, left: 16, right: 16, zIndex: 100 },
    actionRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 20 },

    sideActionContainer: { alignItems: 'center', gap: 6 },
    miniActionBtn: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden' },
    miniActionInner: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    miniLabel: { color: '#fff', fontSize: 10, fontWeight: '900' },
    miniCost: { color: '#fbbf24', fontSize: 9, fontWeight: '700' },

    mainActionContainer: { alignItems: 'center', gap: 8 },
    playBtn: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden' },
    playInner: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#fbbf24', shadowOpacity: 0.5, shadowRadius: 15, elevation: 12 },
    playLabel: { color: '#fff', fontSize: 13, fontWeight: '900' },
    lockHint: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', position: 'absolute', bottom: -20, width: 150, textAlign: 'center' },

    disabledBtn: { opacity: 0.5 },

});
