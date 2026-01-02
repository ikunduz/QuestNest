import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BUILDINGS } from './constants';
import { BuildingType } from './types';
import { Coins, X } from 'lucide-react-native';

interface BuildingMenuProps {
    onSelectBuilding: (buildingId: string) => void;
    onClose: () => void;
    userGold: number;
}

export const BuildingMenu: React.FC<BuildingMenuProps> = ({ onSelectBuilding, onClose, userGold }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>İnşa Et</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            <ScrollView horizontal contentContainerStyle={styles.list} showsHorizontalScrollIndicator={false}>
                {BUILDINGS.map(building => {
                    const canAfford = userGold >= building.cost;
                    return (
                        <TouchableOpacity
                            key={building.id}
                            style={[styles.card, !canAfford && styles.cardDisabled]}
                            onPress={() => canAfford && onSelectBuilding(building.id)}
                            disabled={!canAfford}
                        >
                            <View style={styles.emojiContainer}><Text style={styles.emoji}>{building.emoji}</Text></View>
                            <Text style={styles.name}>{building.name}</Text>
                            <View style={styles.costContainer}>
                                <Coins size={12} color="#fbbf24" />
                                <Text style={[styles.cost, !canAfford && styles.costRed]}>{building.cost}</Text>
                            </View>
                            <Text style={styles.size}>{building.width}x{building.height}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 20, position: 'absolute', bottom: 0, left: 0, right: 0,
        elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3, shadowRadius: 5,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155',
    },
    title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    closeButton: { padding: 4 },
    list: { padding: 16, gap: 12 },
    card: {
        backgroundColor: '#334155', borderRadius: 12, padding: 12, width: 100,
        alignItems: 'center', borderWidth: 1, borderColor: '#475569',
    },
    cardDisabled: { opacity: 0.5 },
    emojiContainer: {
        width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emoji: { fontSize: 24 },
    name: {
        color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center',
        marginBottom: 4, height: 32,
    },
    costContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, marginBottom: 4,
    },
    cost: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
    costRed: { color: '#f87171' },
    size: { color: '#94a3b8', fontSize: 10 }
});
