import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Easing, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    Lock, Hammer, Coins, ChevronsUp, Sparkles, Shield, Sword, BookOpen, Home, X, Check, ArrowUp
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Building Data with Levels and Costs
const BUILDINGS_DATA = [
    {
        id: 'keep',
        name: 'Ana Kale',
        emoji: '🏰',
        category: 'defense',
        description: 'Krallığının kalbi. Yükselt ve tüm bonusları artır!',
        baseX: 0.5,
        baseY: 0.28,
        size: 100,
        unlockLevel: 1,
        bonusType: 'defense',
        bonusPerLevel: 10,
    },
    {
        id: 'barracks',
        name: 'Kışla',
        emoji: '⚔️',
        category: 'military',
        description: 'Askerlerini eğit. Her seviye +5% savaş gücü!',
        baseX: 0.25,
        baseY: 0.45,
        size: 80,
        unlockLevel: 1,
        bonusType: 'attack',
        bonusPerLevel: 5,
    },
    {
        id: 'library',
        name: 'Kütüphane',
        emoji: '📚',
        category: 'knowledge',
        description: 'Bilgi güçtür! Her seviye +3% görev ödülü.',
        baseX: 0.75,
        baseY: 0.42,
        size: 75,
        unlockLevel: 2,
        bonusType: 'wisdom',
        bonusPerLevel: 3,
    },
    {
        id: 'goldmine',
        name: 'Altın Madeni',
        emoji: '⛏️',
        category: 'economy',
        description: 'Pasif altın üretimi. Her seviye +2 altın/saat.',
        baseX: 0.2,
        baseY: 0.65,
        size: 70,
        unlockLevel: 3,
        bonusType: 'gold',
        bonusPerLevel: 2,
    },
    {
        id: 'tower',
        name: 'Gözetleme Kulesi',
        emoji: '🗼',
        category: 'defense',
        description: 'Düşmanı erken gör! Her seviye +5 savunma.',
        baseX: 0.8,
        baseY: 0.6,
        size: 65,
        unlockLevel: 4,
        bonusType: 'defense',
        bonusPerLevel: 5,
    },
];

// Calculate upgrade cost based on level
const getUpgradeCost = (level: number) => Math.floor(50 + (level * 25));

// Calculate total kingdom level
const getKingdomLevel = (buildings: Record<string, number>) => {
    const totalLevels = Object.values(buildings).reduce((sum, lvl) => sum + lvl, 0);
    return Math.floor(totalLevels / 3) + 1;
};

interface CastleScreenProps {
    userId: string;
    theme?: string;
    userGold?: number;
    onSpendGold?: (amount: number) => void;
}

export const CastleScreen: React.FC<CastleScreenProps> = ({
    userId,
    theme,
    userGold = 500, // Default for testing
    onSpendGold
}) => {
    // Building levels state (would be persisted in real app)
    const [buildingLevels, setBuildingLevels] = useState<Record<string, number>>({
        keep: 3,
        barracks: 2,
        library: 1,
        goldmine: 0,
        tower: 0
    });

    const [selectedBuilding, setSelectedBuilding] = useState<typeof BUILDINGS_DATA[0] | null>(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Animations
    const floatAnims = useRef(BUILDINGS_DATA.map(() => new Animated.Value(0))).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const upgradeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start floating animations for all buildings
        floatAnims.forEach((anim, index) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -5 - (index % 3),
                        duration: 2000 + (index * 200),
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 2000 + (index * 200),
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        });

        // Pulse animation for selected building
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const kingdomLevel = getKingdomLevel(buildingLevels);

    const handleUpgrade = (building: typeof BUILDINGS_DATA[0]) => {
        const currentLevel = buildingLevels[building.id] || 0;
        const cost = getUpgradeCost(currentLevel);

        if (userGold < cost) {
            Alert.alert('💰 Yetersiz Altın!', `Bu yükseltme için ${cost} Altın gerekiyor.`);
            return;
        }

        setIsUpgrading(true);

        // Upgrade animation
        Animated.timing(upgradeAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        }).start(() => {
            // Apply upgrade
            setBuildingLevels(prev => ({
                ...prev,
                [building.id]: (prev[building.id] || 0) + 1
            }));

            if (onSpendGold) {
                onSpendGold(cost);
            }

            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                setIsUpgrading(false);
                upgradeAnim.setValue(0);
            }, 2000);

            Alert.alert(
                '🎉 Yükseltme Tamamlandı!',
                `${building.name} artık Seviye ${(buildingLevels[building.id] || 0) + 1}!`
            );
        });
    };

    const isUnlocked = (building: typeof BUILDINGS_DATA[0]) => {
        return kingdomLevel >= building.unlockLevel;
    };

    const getBuildingLevel = (buildingId: string) => buildingLevels[buildingId] || 0;

    return (
        <View style={styles.container}>
            {/* Fantasy Kingdom Background */}
            <Image
                source={require('../assets/kingdom_bg.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                defaultSource={{ uri: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800' }}
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
                style={StyleSheet.absoluteFill}
            />

            {/* Confetti Effect */}
            {showConfetti && (
                <View style={styles.confettiContainer}>
                    {[...Array(20)].map((_, i) => (
                        <Animated.Text
                            key={i}
                            style={[
                                styles.confetti,
                                {
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 50}%`,
                                    transform: [{ rotate: `${Math.random() * 360}deg` }]
                                }
                            ]}
                        >
                            {['✨', '🌟', '⭐', '💫'][i % 4]}
                        </Animated.Text>
                    ))}
                </View>
            )}

            {/* Kingdom Stats Header */}
            <BlurView intensity={40} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    {/* Kingdom Level */}
                    <View style={styles.kingdomBadge}>
                        <Text style={styles.kingdomEmoji}>👑</Text>
                        <View>
                            <Text style={styles.kingdomLabel}>KRALLIK</Text>
                            <Text style={styles.kingdomLevel}>Seviye {kingdomLevel}</Text>
                        </View>
                    </View>

                    {/* Gold Balance */}
                    <View style={styles.goldBadge}>
                        <Text style={styles.goldEmoji}>🪙</Text>
                        <Text style={styles.goldValue}>{userGold}</Text>
                    </View>
                </View>
            </BlurView>

            {/* Buildings on Map */}
            <View style={styles.mapContainer}>
                {BUILDINGS_DATA.map((building, index) => {
                    const level = getBuildingLevel(building.id);
                    const unlocked = isUnlocked(building);
                    const isSelected = selectedBuilding?.id === building.id;

                    // Scale based on level
                    const sizeMultiplier = 1 + (level * 0.1);
                    const actualSize = building.size * sizeMultiplier;

                    return (
                        <TouchableOpacity
                            key={building.id}
                            style={[
                                styles.buildingTouchable,
                                {
                                    left: `${building.baseX * 100}%`,
                                    top: `${building.baseY * 100}%`,
                                    marginLeft: -actualSize / 2,
                                    marginTop: -actualSize / 2,
                                }
                            ]}
                            onPress={() => setSelectedBuilding(building)}
                            activeOpacity={0.8}
                        >
                            <Animated.View
                                style={[
                                    styles.buildingContainer,
                                    {
                                        width: actualSize,
                                        height: actualSize,
                                        transform: [
                                            { translateY: floatAnims[index] },
                                            { scale: isSelected ? pulseAnim : 1 }
                                        ]
                                    }
                                ]}
                            >
                                {/* Building Glow */}
                                {isSelected && (
                                    <View style={[styles.buildingGlow, { backgroundColor: unlocked ? 'rgba(251,191,36,0.3)' : 'rgba(100,100,100,0.3)' }]} />
                                )}

                                {/* Building Emoji/Icon */}
                                <View style={[
                                    styles.buildingVisual,
                                    !unlocked && styles.buildingLocked
                                ]}>
                                    <Text style={[styles.buildingEmoji, { fontSize: actualSize * 0.5 }]}>
                                        {building.emoji}
                                    </Text>

                                    {/* Level Badge */}
                                    {unlocked && level > 0 && (
                                        <View style={styles.levelBadge}>
                                            <Text style={styles.levelText}>{level}</Text>
                                        </View>
                                    )}

                                    {/* Lock Overlay */}
                                    {!unlocked && (
                                        <View style={styles.lockOverlay}>
                                            <Lock size={24} color="#fff" />
                                            <Text style={styles.unlockText}>Svye {building.unlockLevel}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Building Name */}
                                <View style={styles.buildingNameTag}>
                                    <Text style={styles.buildingName}>{building.name}</Text>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Building Detail Modal */}
            <Modal
                visible={selectedBuilding !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedBuilding(null)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={50} tint="dark" style={styles.modalContent}>
                        {selectedBuilding && (
                            <>
                                {/* Close Button */}
                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setSelectedBuilding(null)}
                                >
                                    <X size={24} color="#fff" />
                                </TouchableOpacity>

                                {/* Building Header */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalEmoji}>{selectedBuilding.emoji}</Text>
                                    <View>
                                        <Text style={styles.modalTitle}>{selectedBuilding.name}</Text>
                                        <Text style={styles.modalSubtitle}>
                                            {isUnlocked(selectedBuilding)
                                                ? `Seviye ${getBuildingLevel(selectedBuilding.id)}`
                                                : `🔒 Krallık Seviye ${selectedBuilding.unlockLevel} gerekli`
                                            }
                                        </Text>
                                    </View>
                                </View>

                                {/* Description */}
                                <Text style={styles.modalDescription}>
                                    {selectedBuilding.description}
                                </Text>

                                {/* Stats */}
                                {isUnlocked(selectedBuilding) && (
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>MEVCUT BONUS</Text>
                                            <Text style={styles.statValue}>
                                                +{getBuildingLevel(selectedBuilding.id) * selectedBuilding.bonusPerLevel}%
                                            </Text>
                                            <Text style={styles.statType}>{selectedBuilding.bonusType.toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>SONRAKİ SEVİYE</Text>
                                            <Text style={[styles.statValue, { color: '#4ade80' }]}>
                                                +{(getBuildingLevel(selectedBuilding.id) + 1) * selectedBuilding.bonusPerLevel}%
                                            </Text>
                                            <Text style={styles.statType}>{selectedBuilding.bonusType.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Upgrade Button */}
                                {isUnlocked(selectedBuilding) ? (
                                    <TouchableOpacity
                                        style={[
                                            styles.upgradeBtn,
                                            userGold < getUpgradeCost(getBuildingLevel(selectedBuilding.id)) && styles.upgradeBtnDisabled
                                        ]}
                                        onPress={() => handleUpgrade(selectedBuilding)}
                                        disabled={isUpgrading || userGold < getUpgradeCost(getBuildingLevel(selectedBuilding.id))}
                                    >
                                        {isUpgrading ? (
                                            <Text style={styles.upgradeBtnText}>⏳ Yükseltiliyor...</Text>
                                        ) : (
                                            <>
                                                <View style={styles.upgradeBtnContent}>
                                                    <Hammer size={20} color="#0f172a" />
                                                    <Text style={styles.upgradeBtnText}>YÜKSELT</Text>
                                                </View>
                                                <View style={styles.upgradeCost}>
                                                    <Text style={styles.upgradeCostText}>
                                                        🪙 {getUpgradeCost(getBuildingLevel(selectedBuilding.id))}
                                                    </Text>
                                                </View>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.lockedInfo}>
                                        <Lock size={20} color="#94a3b8" />
                                        <Text style={styles.lockedText}>
                                            Krallığını Seviye {selectedBuilding.unlockLevel}'e yükselt!
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        paddingTop: 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    kingdomBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(251,191,36,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(251,191,36,0.3)',
    },
    kingdomEmoji: {
        fontSize: 24,
    },
    kingdomLabel: {
        color: '#fbbf24',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    kingdomLevel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    goldBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    goldEmoji: {
        fontSize: 20,
    },
    goldValue: {
        color: '#fbbf24',
        fontSize: 18,
        fontWeight: '800',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    buildingTouchable: {
        position: 'absolute',
    },
    buildingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    buildingGlow: {
        position: 'absolute',
        width: '120%',
        height: '120%',
        borderRadius: 100,
    },
    buildingVisual: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    buildingLocked: {
        opacity: 0.5,
        backgroundColor: 'rgba(100,100,100,0.3)',
    },
    buildingEmoji: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    levelBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fbbf24',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    levelText: {
        color: '#0f172a',
        fontSize: 12,
        fontWeight: '800',
    },
    lockOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 16,
        padding: 8,
    },
    unlockText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    buildingNameTag: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    buildingName: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        pointerEvents: 'none',
    },
    confetti: {
        position: 'absolute',
        fontSize: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    modalEmoji: {
        fontSize: 56,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    modalSubtitle: {
        color: '#fbbf24',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    modalDescription: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statValue: {
        color: '#fbbf24',
        fontSize: 28,
        fontWeight: '800',
    },
    statType: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    upgradeBtn: {
        backgroundColor: '#fbbf24',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    upgradeBtnDisabled: {
        backgroundColor: '#4b5563',
        opacity: 0.7,
    },
    upgradeBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    upgradeBtnText: {
        color: '#0f172a',
        fontSize: 18,
        fontWeight: '800',
    },
    upgradeCost: {
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    upgradeCostText: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '800',
    },
    lockedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 16,
        borderRadius: 16,
    },
    lockedText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
});
