import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, ImageBackground } from 'react-native';
import { PlacedBuilding, BuildingType } from './types';
import { getBuildings, GRID_SIZE, TILE_SIZE } from './constants';
import { Lock, Hammer, X } from 'lucide-react-native';

interface GridSystemProps {
    buildings: PlacedBuilding[];
    onPlaceBuilding: (x: number, y: number) => void;
    selectedBuildingId: string | null;
    editMode: boolean;
    onSelectBuilding: (building: PlacedBuilding) => void;
}

export const GridSystem: React.FC<GridSystemProps> = ({
    buildings,
    onPlaceBuilding,
    selectedBuildingId,
    editMode,
    onSelectBuilding
}) => {
    const grid = Array(GRID_SIZE).fill(0).map((_, y) =>
        Array(GRID_SIZE).fill(0).map((_, x) => ({ x, y }))
    );

    const selectedBuildingType = getBuildings().find((b: BuildingType) => b.id === selectedBuildingId);

    const isOccupied = (x: number, y: number, w: number = 1, h: number = 1, ignoreId?: string) => {
        return buildings.some(b => {
            if (b.id === ignoreId) return false;
            const bType = getBuildings().find((t: BuildingType) => t.id === b.buildingId);
            if (!bType) return false;
            return (
                x < b.x + bType.width &&
                x + w > b.x &&
                y < b.y + bType.height &&
                y + h > b.y
            );
        });
    };

    const handleTilePress = (x: number, y: number) => {
        if (editMode && selectedBuildingType) {
            if (x + selectedBuildingType.width > GRID_SIZE || y + selectedBuildingType.height > GRID_SIZE) return;
            if (isOccupied(x, y, selectedBuildingType.width, selectedBuildingType.height)) return;
            onPlaceBuilding(x, y);
        }
    };

    return (
        <ScrollView horizontal style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.gridContainer, { width: GRID_SIZE * TILE_SIZE, height: GRID_SIZE * TILE_SIZE }]}>
                    <ImageBackground
                        source={require('../../assets/game_terrain.png')}
                        style={StyleSheet.absoluteFill}
                        resizeMode="repeat"
                        imageStyle={{ opacity: 0.8 }}
                    />
                    {grid.map((row, y) => (
                        <View key={`row-${y}`} style={styles.row}>
                            {row.map((tile, x) => (
                                <TouchableOpacity
                                    key={`tile-${x}-${y}`}
                                    style={[
                                        styles.tile,
                                        { width: TILE_SIZE, height: TILE_SIZE },
                                        editMode && { borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' }
                                    ]}
                                    onPress={() => handleTilePress(x, y)}
                                    activeOpacity={editMode ? 0.7 : 1}
                                />
                            ))}
                        </View>
                    ))}
                    {buildings.map(building => {
                        const bType = getBuildings().find((b: BuildingType) => b.id === building.buildingId);
                        if (!bType) return null;
                        return (
                            <TouchableOpacity
                                key={building.id}
                                style={[
                                    styles.building,
                                    {
                                        left: building.x * TILE_SIZE,
                                        top: building.y * TILE_SIZE,
                                        width: bType.width * TILE_SIZE,
                                        height: bType.height * TILE_SIZE,
                                    }
                                ]}
                                onPress={() => !editMode && onSelectBuilding(building)}
                            >
                                <View style={styles.buildingInner}>
                                    <Text style={[styles.buildingEmoji, { fontSize: Math.min(bType.width, bType.height) * TILE_SIZE * 0.6 }]}>
                                        {bType.emoji}
                                    </Text>
                                    {building.level > 1 && (
                                        <View style={styles.levelBadge}>
                                            <Text style={styles.levelText}>{building.level}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#102a43' },
    scrollContent: { padding: 20 },
    gridContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        position: 'relative',
        borderWidth: 4,
        borderColor: '#486581',
        borderRadius: 8,
        overflow: 'hidden',
    },
    row: { flexDirection: 'row' },
    tile: {},
    building: { position: 'absolute', padding: 2 },
    buildingInner: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buildingEmoji: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    levelBadge: {
        position: 'absolute', bottom: -5, right: -5,
        backgroundColor: '#fbbf24', width: 20, height: 20, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff',
    },
    levelText: { fontSize: 10, fontWeight: 'bold', color: '#000' }
});
