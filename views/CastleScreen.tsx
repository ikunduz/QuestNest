import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hammer, Coins, Plus, Info } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import i18n from '../i18n';

import { GridSystem } from '../components/CastleGame/GridSystem';
import { BuildingMenu } from '../components/CastleGame/BuildingMenu';
import { PlacedBuilding } from '../components/CastleGame/types';
import { getBuildings } from '../components/CastleGame/constants';

interface CastleScreenProps {
    userId: string;
    theme?: string;
    userGold?: number;
    onSpendGold?: (amount: number) => void;
}

export const CastleScreen: React.FC<CastleScreenProps> = ({
    userId,
    userGold = 500,
    onSpendGold
}) => {
    const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [selectedPlacedBuilding, setSelectedPlacedBuilding] = useState<PlacedBuilding | null>(null);

    useEffect(() => {
        const loadBuildings = async () => {
            try {
                const stored = await AsyncStorage.getItem(`@castle_buildings_${userId}`);
                if (stored) {
                    setBuildings(JSON.parse(stored));
                } else {
                    setBuildings([
                        { id: 'init-1', buildingId: 'castle', x: 8, y: 8, level: 1, createdAt: Date.now() }
                    ]);
                }
            } catch (e) { console.error(e); }
        };
        loadBuildings();
    }, [userId]);

    useEffect(() => {
        const saveBuildings = async () => {
            try {
                await AsyncStorage.setItem(`@castle_buildings_${userId}`, JSON.stringify(buildings));
            } catch (e) { console.error(e); }
        };
        saveBuildings();
    }, [buildings, userId]);

    const handlePlaceBuilding = (x: number, y: number) => {
        if (!selectedBuildingId) return;
        const buildingType = getBuildings().find(b => b.id === selectedBuildingId);
        if (!buildingType) return;

        if (userGold < buildingType.cost) {
            Alert.alert(i18n.t('castle.insufficientGold'), i18n.t('castle.noGoldForBuilding'));
            return;
        }

        const newBuilding: PlacedBuilding = {
            id: Date.now().toString(),
            buildingId: selectedBuildingId,
            x,
            y,
            level: 1,
            createdAt: Date.now()
        };

        setBuildings(prev => [...prev, newBuilding]);
        if (onSpendGold) onSpendGold(buildingType.cost);
        setSelectedBuildingId(null);
        setEditMode(false);
        Alert.alert(i18n.t('castle.success'), `${buildingType.name} ${i18n.t('castle.built')}`);
    };

    const handleUpgradeBuilding = () => {
        if (!selectedPlacedBuilding) return;
        const upgradeCost = selectedPlacedBuilding.level * 100;

        if (userGold < upgradeCost) {
            Alert.alert(i18n.t('castle.insufficientGold'), `${i18n.t('castle.upgradeRequired')} ${upgradeCost}`);
            return;
        }

        const updatedBuildings = buildings.map(b => {
            if (b.id === selectedPlacedBuilding.id) return { ...b, level: b.level + 1 };
            return b;
        });

        setBuildings(updatedBuildings);
        if (onSpendGold) onSpendGold(upgradeCost);
        setSelectedPlacedBuilding(null);
        Alert.alert(i18n.t('castle.upgraded'), i18n.t('castle.levelIncreased'));
    };

    const handleDeleteBuilding = () => {
        if (!selectedPlacedBuilding) return;
        Alert.alert(
            i18n.t('castle.destroyBuilding'),
            i18n.t('castle.destroyConfirm'),
            [
                { text: i18n.t('castle.cancel'), style: 'cancel' },
                {
                    text: i18n.t('castle.destroy'),
                    style: 'destructive',
                    onPress: () => {
                        setBuildings(prev => prev.filter(b => b.id !== selectedPlacedBuilding.id));
                        setSelectedPlacedBuilding(null);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={30} tint="dark" style={styles.header}>
                <View style={styles.statContainer}>
                    <Text style={styles.statLabel}>{i18n.t('castle.population')}</Text>
                    <Text style={styles.statValue}>{buildings.length * 5}</Text>
                </View>
                <View style={[styles.statContainer, styles.goldContainer]}>
                    <Coins size={16} color="#fbbf24" />
                    <Text style={styles.goldValue}>{userGold}</Text>
                </View>
            </BlurView>

            <GridSystem
                buildings={buildings}
                onPlaceBuilding={handlePlaceBuilding}
                selectedBuildingId={selectedBuildingId}
                editMode={editMode}
                onSelectBuilding={setSelectedPlacedBuilding}
            />

            {!editMode && !selectedPlacedBuilding && (
                <TouchableOpacity style={styles.buildButton} onPress={() => setEditMode(true)}>
                    <Hammer size={24} color="#0f172a" />
                    <Text style={styles.buildButtonText}>{i18n.t('castle.build')}</Text>
                </TouchableOpacity>
            )}

            {editMode && (
                <BuildingMenu
                    userGold={userGold}
                    onSelectBuilding={setSelectedBuildingId}
                    onClose={() => { setEditMode(false); setSelectedBuildingId(null); }}
                />
            )}

            <Modal
                visible={selectedPlacedBuilding !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedPlacedBuilding(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedPlacedBuilding && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {getBuildings().find(b => b.id === selectedPlacedBuilding.buildingId)?.name}
                                    </Text>
                                    <Text style={styles.modalLevel}>{i18n.t('castle.level')} {selectedPlacedBuilding.level}</Text>
                                </View>
                                <Text style={styles.modalDesc}>
                                    {getBuildings().find(b => b.id === selectedPlacedBuilding.buildingId)?.description}
                                </Text>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={handleUpgradeBuilding}>
                                        <Text style={styles.actionBtnText}>{i18n.t('castle.upgrade')} ({selectedPlacedBuilding.level * 100} 🪙)</Text>
                                    </TouchableOpacity>
                                    {selectedPlacedBuilding.buildingId !== 'castle' && (
                                        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeleteBuilding}>
                                            <Text style={[styles.actionBtnText, styles.deleteBtnText]}>{i18n.t('castle.destroy')}</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={[styles.actionBtn, styles.closeBtn]} onPress={() => setSelectedPlacedBuilding(null)}>
                                        <Text style={styles.closeBtnText}>{i18n.t('castle.close')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', padding: 16,
        paddingTop: 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    },
    statContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 12, alignItems: 'center',
    },
    goldContainer: {
        flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
    statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    goldValue: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold' },
    buildButton: {
        position: 'absolute', bottom: 24, right: 24, backgroundColor: '#fbbf24',
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16,
        paddingHorizontal: 24, borderRadius: 32, shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    buildButtonText: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b', borderRadius: 24, padding: 24, width: '100%',
        maxWidth: 400, borderWidth: 1, borderColor: '#334155',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    modalLevel: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold' },
    modalDesc: { color: '#94a3b8', fontSize: 16, marginBottom: 24 },
    modalActions: { gap: 12 },
    actionBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' },
    deleteBtnText: { color: '#ef4444' },
    closeBtn: { backgroundColor: 'transparent' },
    closeBtnText: { color: '#94a3b8' },
});
