import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, Alert, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Utensils, Moon, Sun, Heart, Zap, Timer, Coins, Sparkles, Hand } from 'lucide-react-native';
import { UserState, PetState, EvolutionStage } from '../types';
import i18n from '../i18n';

const { width, height } = Dimensions.get('window');

interface CreatureScreenProps {
    user: UserState;
    onUpdateUser: (updates: Partial<UserState>) => void;
    pet: PetState;
    onUpdatePet: (updates: Partial<PetState>) => void;
}

const getStageConfig = (): Record<EvolutionStage, { goal: number; label: string; next?: EvolutionStage }> => ({
    egg: { goal: 500, label: i18n.t('creature.egg').toUpperCase(), next: 'hatching' },
    hatching: { goal: 0, label: i18n.t('creature.hatching'), next: 'baby' },
    baby: { goal: 1500, label: i18n.t('creature.baby').toUpperCase(), next: 'teen' },
    teen: { goal: 3000, label: i18n.t('creature.teen').toUpperCase(), next: 'adult' },
    adult: { goal: 10000, label: i18n.t('creature.adult').toUpperCase() }
});

const EVOLUTION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const CreatureScreen: React.FC<CreatureScreenProps> = ({ user, onUpdateUser, pet, onUpdatePet }) => {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSleeping, setIsSleeping] = useState(false);
    const config = getStageConfig()[pet.stage];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -12, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (pet.evolutionStartTime) {
            const interval = setInterval(() => {
                const diff = (pet.evolutionStartTime! + EVOLUTION_DURATION) - Date.now();
                if (diff <= 0) {
                    clearInterval(interval);
                    setTimeLeft(0);
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
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handlePet = () => {
        if (isSleeping) { Alert.alert(i18n.t('creature.sleeping'), i18n.t('creature.sleepingMessage')); return; }
        Vibration.vibrate(50);
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        onUpdatePet({ happiness: Math.min(100, pet.happiness + 5) });
    };

    const handleFeed = () => {
        if (isSleeping || pet.stage === 'hatching') return;
        const cost = 50;
        if (user.xp * 5 < cost) { Alert.alert(i18n.t('creature.needMoreGold'), i18n.t('creature.completeQuests')); return; }
        onUpdateUser({ xp: Math.max(0, user.xp - 10) });
        const newGoldSpent = pet.goldSpent + cost;
        const progress = Math.min(100, (newGoldSpent / config.goal) * 100);
        let updates: Partial<PetState> = { goldSpent: newGoldSpent, evolution: progress, happiness: Math.min(100, pet.happiness + 5) };
        if (progress >= 100 && config.next) {
            updates.stage = config.next as EvolutionStage;
            updates.evolutionStartTime = Date.now();
            Alert.alert(i18n.t('creature.evolution'), i18n.t('creature.evolutionMessage'));
        }
        onUpdatePet(updates);
    };

    const handleSleep = () => {
        if (pet.stage === 'hatching') return;
        setIsSleeping(!isSleeping);
        if (!isSleeping) onUpdatePet({ energy: 100 });
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={isSleeping ? ['#020617', '#0f172a'] : ['#1e1b4b', '#0f172a']} style={StyleSheet.absoluteFill} />

            {/* ===== TOP HUD ===== */}
            <View style={styles.topHud}>
                <BlurView intensity={40} tint="dark" style={styles.hudCard}>
                    <View style={styles.hudLeft}>
                        <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.levelBadge}>
                            <Text style={styles.levelText}>{pet.level}</Text>
                        </LinearGradient>
                        <View>
                            <Text style={styles.petName}>{pet.name}</Text>
                            <Text style={styles.petStage}>{config.label}</Text>
                        </View>
                    </View>
                    <View style={styles.goldBadge}>
                        <Text style={styles.goldText}>{user.xp * 5}</Text>
                        <Coins size={16} color="#fbbf24" />
                    </View>
                </BlurView>
            </View>

            {/* ===== STATS BARS ===== */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Heart size={18} color="#ef4444" fill={pet.happiness > 20 ? "#ef4444" : "transparent"} />
                    <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${pet.happiness}%`, backgroundColor: '#ef4444' }]} />
                    </View>
                </View>
                <View style={styles.statItem}>
                    <Zap size={18} color="#fbbf24" fill={pet.energy > 20 ? "#fbbf24" : "transparent"} />
                    <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${pet.energy}%`, backgroundColor: '#fbbf24' }]} />
                    </View>
                </View>
            </View>

            {/* ===== MAIN CREATURE AREA ===== */}
            <View style={styles.creatureArea}>
                <TouchableOpacity activeOpacity={0.9} onPress={handlePet}>
                    <Animated.View style={[styles.creatureWrapper, { transform: [{ translateY: bounceAnim }, { scale: scaleAnim }] }]}>
                        <View style={styles.glowCircle} />
                        {/* Stage-based creature visuals */}
                        {pet.stage === 'egg' && <Text style={styles.eggEmoji}>🥚</Text>}
                        {pet.stage === 'hatching' && <Text style={styles.eggEmoji}>🥚✨</Text>}
                        {pet.stage === 'baby' && <Text style={styles.eggEmoji}>🐣</Text>}
                        {pet.stage === 'teen' && <Text style={styles.eggEmoji}>🐉</Text>}
                        {pet.stage === 'adult' && <Text style={styles.eggEmoji}>🔥🐲</Text>}
                        <Sparkles size={36} color="#fbbf24" style={styles.sparkle} />
                        {isSleeping && <Text style={styles.zzz}>Zzz...</Text>}
                    </Animated.View>
                </TouchableOpacity>
                <View style={styles.shadowEllipse} />
            </View>

            {/* ===== EVOLUTION PROGRESS ===== */}
            <View style={styles.evolutionSection}>
                <BlurView intensity={50} tint="dark" style={styles.evolutionCard}>
                    {pet.stage === 'hatching' ? (
                        <View style={styles.timerRow}>
                            <Timer size={24} color="#fbbf24" />
                            <Text style={styles.timerText}>{timeLeft ? formatTime(timeLeft) : '00:00:00'}</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.goalLabel}>{i18n.t('creature.evolutionGoal')}</Text>
                            <View style={styles.progressBarBg}>
                                <LinearGradient colors={['#fbbf24', '#f59e0b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressBarFill, { width: `${pet.evolution}%` }]} />
                            </View>
                            <Text style={styles.goalValue}>{pet.goldSpent} / {config.goal} 🪙</Text>
                        </>
                    )}
                </BlurView>
            </View>

            {/* ===== BOTTOM ACTION DOCK ===== */}
            <View style={styles.actionDock}>
                <TouchableOpacity style={styles.actionButton} onPress={handleFeed}>
                    <BlurView intensity={60} tint="light" style={styles.actionCircle}>
                        <Utensils size={26} color="#f59e0b" />
                    </BlurView>
                    <Text style={styles.actionLabel}>{i18n.t('creature.feed').toUpperCase()}</Text>
                    <Text style={styles.actionCost}>50g</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainActionButton} onPress={handlePet}>
                    <LinearGradient colors={['#ec4899', '#db2777']} style={styles.mainActionCircle}>
                        <Hand size={32} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.mainActionLabel}>{i18n.t('creature.pet').toUpperCase()}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleSleep}>
                    <BlurView intensity={60} tint={isSleeping ? "dark" : "light"} style={styles.actionCircle}>
                        {isSleeping ? <Sun size={26} color="#fbbf24" /> : <Moon size={26} color="#818cf8" />}
                    </BlurView>
                    <Text style={styles.actionLabel}>{isSleeping ? i18n.t('creature.wake').toUpperCase() : i18n.t('creature.sleep').toUpperCase()}</Text>
                    <Text style={styles.actionCost}>{i18n.t('creature.free')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },

    // TOP HUD
    topHud: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10 },
    hudCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    hudLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    levelBadge: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    levelText: { color: '#000', fontWeight: '900', fontSize: 16 },
    petName: { color: '#fff', fontWeight: '800', fontSize: 16 },
    petStage: { color: '#fbbf24', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    goldBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    goldText: { color: '#fbbf24', fontWeight: '800', fontSize: 15 },

    // STATS
    statsContainer: { position: 'absolute', top: 130, left: 24, right: 24, gap: 8, zIndex: 10 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statBarBg: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' },
    statBarFill: { height: '100%', borderRadius: 5 },

    // CREATURE AREA
    creatureArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, marginBottom: 100 },
    creatureWrapper: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
    glowCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(251,191,36,0.08)' },
    eggEmoji: { fontSize: 120 },
    sparkle: { position: 'absolute', top: 10, right: 20 },
    zzz: { position: 'absolute', top: -20, right: 10, color: '#fff', fontSize: 20, fontWeight: 'bold', opacity: 0.7 },
    shadowEllipse: { width: 140, height: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 70, marginTop: -20, transform: [{ scaleY: 0.5 }] },

    // EVOLUTION SECTION
    evolutionSection: { position: 'absolute', bottom: 150, left: 24, right: 24, zIndex: 10 },
    evolutionCard: { padding: 16, borderRadius: 20, alignItems: 'center', gap: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    goalLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
    progressBarBg: { width: '100%', height: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 7, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 7 },
    goalValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    timerText: { color: '#fbbf24', fontSize: 26, fontWeight: '900', fontFamily: 'monospace' },

    // ACTION DOCK
    actionDock: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 20, zIndex: 20 },
    actionButton: { alignItems: 'center', gap: 6, width: 70 },
    actionCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    actionLabel: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    actionCost: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
    mainActionButton: { alignItems: 'center', width: 90 },
    mainActionCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(236,72,153,0.3)', shadowColor: '#ec4899', shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
    mainActionLabel: { color: '#ec4899', fontSize: 13, fontWeight: '900', marginTop: 8 },
});
