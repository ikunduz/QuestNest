import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Easing, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    Plus, Minus, Settings, Info, ArrowUp, Users, X, Map, Castle, User, Lock, Hammer, Coins, ChevronsUp
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Mock Data for Buildings
const BUILDINGS = [
    {
        id: 'keep',
        name: 'Ana Kale',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJJp7o1qehUTI5sy5UseIOeH2kBbn-nusK_8e3ALN66WqlRwsqZQ-MQW0LX7nBmFCRFRsyc2GTYlmOfGNofJQqYjTarDcBExnVUh_Y57MgiYJz1fArJGAkhV34mDXKb5_V2ayBQrpNG381S9L5hVDJinktZIj6XIam9PSe9uWM0cG6Utn-3ouM3gIIzFixUZE__eTnG3IiJb7qyUw7fApahFq2JgBrB-tynioPvGyg0Nt6-rW8yR7DkqvcrPqtlklXVxeMiUB0',
        top: '30%',
        left: '50%',
        width: 200,
        height: 200,
        locked: false,
        level: 5,
        description: 'Karargah'
    },
    {
        id: 'barracks',
        name: 'Kışla',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaKLNiHQXlzvmN1tI6Sf_qWloZlQl3eKcNbpkc9581W494AQCxbRVqwXEMtqR-xcPOf19c3FePt1sjyMEKn6nVM1h_hsAPAga2uNdtRCMU7HXRWSXPCSjeDO4QUiktm5IOCn1inOjIjVM7DJolmcKgamc73yW2UDO_IxFSX8YLqu_zl8KS6TsEzHpk-qcv-apIDvY9s1sRrwLGBiU3adq3NGkJaU_bjSmad3d1CIJo0FqsRyFIMaWt0dilsnXonxab-j4HF_gN',
        top: '50%',
        left: '20%',
        width: 160,
        height: 160,
        locked: false,
        level: 2,
        description: 'Seviye 2 • Aktif Eğitim'
    },
    {
        id: 'library',
        name: 'Kütüphane',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6SBxkcQNBtEMJD784Ugp5WvuML6ALe3RpAsHZU8S1FCzSRKMH4LrqAek73vWgNl7FG3htZdHuPweS5BQEVHKGBiF5_SEmIG2292jyiiWJz9Tgo_4X0DWtICocuMlqe7qV7e_0_J-20lJutUbL0OxMVz1oaCWcpGkFJCZMsA0T504Hw6sGSKH8c5QhL-M1lkjKuxavUzSfzeyQNnfUt127PeL6VxB1rIRXsGkobBaFI0TreUKTSl2LBHPz1xvo1jUIHyeY0yef',
        top: '45%',
        left: '80%', // Adjusted for RN coords relative to center/screen logic
        right: '10%',
        width: 140,
        height: 140,
        locked: true,
        level: 1,
        description: 'Bilgi Merkezi'
    }
];

interface CastleScreenProps {
    userId: string;
    theme?: string;
    onBack?: () => void;
}

export const CastleScreen: React.FC<CastleScreenProps> = ({ userId, theme, onBack }) => {
    const [selectedBuilding, setSelectedBuilding] = useState<typeof BUILDINGS[0] | null>(BUILDINGS[1]); // Default select Barracks as per design
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Background Layer */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw0wSnmDCBUtJC55vjhrzlYjKyqK_iE1daq9PtnbyzmB-EhfqprLtRIhXTNSKw5LDYTbuLBBNcPpzglhJRAZpbXlfSRGupFdosCnIsooZOIGmJt0GeHHHwBycuo2ZOptUhaQAe6XT8tDbVJnjGgu7-Pb6JroaDhtgyFj66bHbvw7_kgICdWkCrjqBY91ihiSAgyhPa5avbVwg-y53Vvnq1PseKsIMeG58uK0Y_cC4r8ctdE0YpNTFGK6mGSJg9D8Aia8ORfTU4' }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(35, 29, 15, 0.4)' }]} />
            </View>

            {/* Isometric Map Layer */}
            <View style={styles.mapLayer}>
                {BUILDINGS.map((building) => {
                    const isSelected = selectedBuilding?.id === building.id;
                    const isLocked = building.locked;

                    return (
                        <TouchableOpacity
                            key={building.id}
                            style={[
                                styles.buildingWrapper,
                                {
                                    top: building.top as any,
                                    left: building.left ? building.left as any : undefined,
                                    right: building.right ? building.right as any : undefined,
                                    width: building.width,
                                    height: building.height,
                                    transform: [{ translateX: -building.width / 2 }, { translateY: -building.height / 2 }] // Center anchor
                                }
                            ]}
                            onPress={() => !isLocked && setSelectedBuilding(building)}
                            activeOpacity={0.9}
                        >
                            {/* Glow for selected */}
                            {isSelected && (
                                <View style={styles.selectionGlow} />
                            )}

                            {/* Floating Animation */}
                            <Animated.View style={{ transform: [{ translateY: isSelected ? floatAnim : 0 }] }}>
                                <Image
                                    source={{ uri: building.image }}
                                    style={[
                                        styles.buildingImage,
                                        isLocked && styles.buildingLocked
                                    ]}
                                    resizeMode="contain"
                                />

                                {/* Selection Indicator Ring */}
                                {isSelected && (
                                    <View style={styles.selectionRing} />
                                )}

                                {/* Selection Arrow */}
                                {isSelected && (
                                    <View style={styles.selectionArrowContainer}>
                                        <ArrowUp size={30} color="#fbbd23" style={{ transform: [{ rotate: '180deg' }] }} />
                                    </View>
                                )}

                                {/* Lock Indicator */}
                                {isLocked && (
                                    <View style={styles.lockBadge}>
                                        <Lock size={16} color="#ef4444" />
                                    </View>
                                )}
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}

                {/* Construction Site Placeholder */}
                <TouchableOpacity style={styles.constructionSite}>
                    <View style={styles.constructionBox}>
                        <Plus size={32} color="rgba(255,255,255,0.4)" />
                    </View>
                </TouchableOpacity>
            </View>


            {/* UI Overlay */}
            <View style={styles.uiOverlay}>

                {/* Top HUD */}
                <BlurView intensity={30} tint="dark" style={styles.topHud}>
                    <View style={styles.hudLeft}>
                        <View style={styles.resourceBadge}>
                            <View style={styles.resourceIcon}>
                                <Hammer size={12} color="#fbbd23" />
                                <Text style={styles.resourceLabel}>İNŞA PUANI</Text>
                            </View>
                            <Text style={styles.resourceValue}>1,250</Text>
                        </View>

                        <View style={styles.levelBadge}>
                            <View style={styles.resourceIcon}>
                                <ChevronsUp size={12} color="#60a5fa" />
                                <Text style={styles.resourceLabel}>SEVİYE 5</Text>
                            </View>
                            <View style={styles.levelBarTrack}>
                                <View style={[styles.levelBarFill, { width: '65%' }]} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.hudRight}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Settings size={20} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.zoomControls}>
                            <TouchableOpacity style={[styles.zoomBtn, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                                <Plus size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.zoomBtn}>
                                <Minus size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>

                {/* Bottom Sheet - Building Details */}
                {selectedBuilding && (
                    <BlurView intensity={40} tint="dark" style={styles.bottomSheet}>
                        <View style={styles.sheetHandle} />

                        <View style={styles.sheetHeader}>
                            <View>
                                <Text style={styles.sheetTitle}>{selectedBuilding.name}</Text>
                                <Text style={styles.sheetSubtitle}>{selectedBuilding.description}</Text>
                            </View>
                            <TouchableOpacity style={styles.infoBtn}>
                                <Info size={16} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressLabels}>
                                <Text style={styles.progressLabel}>YÜKSELTME İLERLEMESİ</Text>
                                <Text style={styles.progressValue}>150 / 200 XP</Text>
                            </View>
                            <View style={styles.progressBarTrack}>
                                <LinearGradient
                                    colors={['#fbbd23', '#f59e0b']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: '75%' }]}
                                />
                            </View>
                        </View>

                        <View style={styles.actionsGrid}>
                            <View style={styles.statsRow}>
                                {/* Mock Stats */}
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxLabel}>GÜÇ</Text>
                                    <View style={styles.statBoxValueRow}>
                                        <ArrowUp size={14} color="#4ade80" />
                                        <Text style={[styles.statBoxValue, { color: '#4ade80' }]}>+5</Text>
                                    </View>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statBoxLabel}>KAPASİTE</Text>
                                    <View style={styles.statBoxValueRow}>
                                        <Users size={14} color="rgba(255,255,255,0.5)" />
                                        <Text style={styles.statBoxValue}>12</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.upgradeBtn}>
                                <Text style={styles.upgradeBtnText}>Yükselt</Text>
                                <View style={styles.upgradeCostBadge}>
                                    <Hammer size={12} color="#0f172a" />
                                    <Text style={styles.upgradeCostText}>50</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedBuilding(null)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                )}

                {/* Bottom Nav Dock */}
                <View style={styles.bottomDockContainer}>
                    <BlurView intensity={30} tint="dark" style={styles.bottomDock}>
                        <TouchableOpacity style={styles.dockItem}>
                            <View style={styles.dockIconCircle}>
                                <Map size={20} color="rgba(255,255,255,0.6)" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dockItemMain}>
                            <View style={styles.dockMainCircle}>
                                <Castle size={28} color="#0f172a" fill="#0f172a" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dockItem}>
                            <View style={styles.dockIconCircle}>
                                <User size={20} color="rgba(255,255,255,0.6)" />
                            </View>
                        </TouchableOpacity>
                    </BlurView>
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#231d0f' },
    mapLayer: { flex: 1, position: 'relative' },

    buildingWrapper: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    buildingImage: { width: '100%', height: '100%' },
    buildingLocked: { opacity: 0.6, tintColor: 'gray' }, // Simple grayscale effect simulation

    selectionGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(251, 189, 35, 0.2)',
        borderRadius: 100
    },
    selectionRing: {
        position: 'absolute',
        bottom: 20,
        width: 100,
        height: 40,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#fbbd23',
        backgroundColor: 'rgba(251, 189, 35, 0.1)',
        alignSelf: 'center'
    },
    selectionArrowContainer: { position: 'absolute', top: -40, alignSelf: 'center' },
    lockBadge: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -16,
        marginTop: -16,
        width: 32,
        height: 32,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)'
    },

    constructionSite: {
        position: 'absolute',
        bottom: '25%',
        right: '30%',
        width: 96,
        height: 96,
        transform: [{ rotate: '45deg' }, { skewX: '12deg' }]
    },
    constructionBox: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        borderStyle: 'dashed',
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    uiOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingBottom: 140, pointerEvents: 'box-none' },

    topHud: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0
    },
    hudLeft: { flexDirection: 'row', gap: 12 },
    resourceBadge: {
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    resourceIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    resourceLabel: { color: '#cdbb8e', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    resourceValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 },

    levelBadge: {
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 80,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    levelBarTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
    levelBarFill: { height: '100%', backgroundColor: '#60a5fa', borderRadius: 3 },

    hudRight: { gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(20, 20, 20, 0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    zoomControls: { borderRadius: 20, backgroundColor: 'rgba(20, 20, 20, 0.6)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    zoomBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

    bottomSheet: {
        marginHorizontal: 16,
        borderRadius: 32,
        padding: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(20,20,20,0.6)'
    },
    sheetHandle: { width: 48, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginTop: 12 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
    sheetTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    sheetSubtitle: { color: '#cdbb8e', fontSize: 14, fontWeight: '500' },
    infoBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

    progressSection: { paddingHorizontal: 24, paddingBottom: 16 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    progressValue: { color: '#fbbd23', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' },
    progressBarTrack: { height: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 6 },

    actionsGrid: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
    statsRow: { flexDirection: 'row', gap: 12, flex: 1 },
    statBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 10, flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statBoxLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
    statBoxValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statBoxValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    upgradeBtn: {
        flex: 2,
        height: 56,
        backgroundColor: '#fbbd23',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20
    },
    upgradeBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
    upgradeCostBadge: { backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    upgradeCostText: { color: '#0f172a', fontWeight: '800', fontSize: 14 },

    closeBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    bottomDockContainer: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
    bottomDock: { flexDirection: 'row', alignItems: 'center', gap: 32, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(20, 20, 20, 0.6)' },
    dockItem: { alignItems: 'center' },
    dockIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    dockItemMain: { marginTop: -24 },
    dockMainCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fbbd23', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#2d2616', shadowColor: '#fbbd23', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }
});
