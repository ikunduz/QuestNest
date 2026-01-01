import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Home, ShoppingCart, Hammer, Lock } from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { getTheme, ThemeType } from '../constants/themes';
import { supabase } from '../services/supabaseClient';

interface CastleScreenProps {
    userId: string;
    theme?: ThemeType;
}

const ROOMS = [
    { id: 'main_hall', name: 'Ana Salon', emoji: '🏠', cost: 0, unlocked: true },
    { id: 'bedroom', name: 'Yatak Odası', emoji: '🛏️', cost: 100, hours: 1 },
    { id: 'library', name: 'Kütüphane', emoji: '📚', cost: 250, hours: 2, bonus: '+10% Ders XP' },
    { id: 'kitchen', name: 'Mutfak', emoji: '🍳', cost: 500, hours: 4, bonus: 'Yaratık +Mutluluk' },
    { id: 'garden', name: 'Bahçe', emoji: '🌳', cost: 750, hours: 6, bonus: 'Günlük hediye+' },
    { id: 'treasury', name: 'Hazine Odası', emoji: '💰', cost: 1000, hours: 12, bonus: 'Altın bonusu' },
    { id: 'tower', name: 'Kule', emoji: '🗼', cost: 1500, hours: 24, bonus: 'Yaratık evrimi hızlanır' },
    { id: 'throne', name: 'Taht Odası', emoji: '👑', cost: 2500, hours: 48, bonus: 'Tüm bonuslar +5%' },
];

export const CastleScreen: React.FC<CastleScreenProps> = ({ userId, theme = 'hero' }) => {
    const [castle, setCastle] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const themeData = getTheme(theme);

    useEffect(() => {
        loadCastle();
    }, []);

    const loadCastle = async () => {
        try {
            // Kaleyi yükle veya oluştur
            let { data: castleData } = await supabase
                .from('castles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!castleData) {
                const { data: newCastle } = await supabase
                    .from('castles')
                    .insert({ user_id: userId, name: 'Benim Kalem', gold: 100 })
                    .select()
                    .single();
                castleData = newCastle;
            }

            setCastle(castleData);

            // Odaları yükle
            const { data: roomsData } = await supabase
                .from('castle_rooms')
                .select('*')
                .eq('castle_id', castleData.id);

            setRooms(roomsData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const isRoomUnlocked = (roomId: string) => {
        return rooms.some(r => r.room_type === roomId && r.is_unlocked);
    };

    const handleUnlockRoom = async (room: typeof ROOMS[0]) => {
        if (castle.gold < room.cost) {
            Alert.alert('Yetersiz Altın', `Bu oda için ${room.cost} ${themeData.currency.emoji} gerekli.`);
            return;
        }

        try {
            // Altını düş
            await supabase
                .from('castles')
                .update({ gold: castle.gold - room.cost })
                .eq('id', castle.id);

            // Odayı oluştur
            await supabase
                .from('castle_rooms')
                .insert({
                    castle_id: castle.id,
                    room_type: room.id,
                    is_unlocked: true,
                });

            Alert.alert('Tebrikler! 🎉', `${room.name} açıldı!`);
            loadCastle();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
                <Text style={{ color: '#fff' }}>Yükleniyor...</Text>
            </View>
        );
    }

    const structureEmoji = themeData.structure.emoji;
    const structureName = themeData.structure.name;

    return (
        <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: themeData.colors.accent }]}>
                    {structureEmoji} {castle?.name || structureName}
                </Text>
                <View style={styles.goldBadge}>
                    <Text style={styles.goldText}>{themeData.currency.emoji} {castle?.gold || 0}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.roomsGrid}>
                {ROOMS.map(room => {
                    const unlocked = room.unlocked || isRoomUnlocked(room.id);
                    return (
                        <TouchableOpacity
                            key={room.id}
                            style={[
                                styles.roomCard,
                                {
                                    backgroundColor: themeData.colors.cardBackground,
                                    borderColor: unlocked ? themeData.colors.accent : themeData.colors.border,
                                    opacity: unlocked ? 1 : 0.6,
                                }
                            ]}
                            onPress={() => !unlocked && handleUnlockRoom(room)}
                            disabled={unlocked}
                        >
                            <Text style={styles.roomEmoji}>{room.emoji}</Text>
                            <Text style={[styles.roomName, { color: unlocked ? themeData.colors.accent : '#94a3b8' }]}>
                                {room.name}
                            </Text>

                            {!unlocked && (
                                <View style={styles.lockInfo}>
                                    <Lock size={14} color="#94a3b8" />
                                    <Text style={styles.costText}>{room.cost} {themeData.currency.emoji}</Text>
                                </View>
                            )}

                            {room.bonus && unlocked && (
                                <Text style={styles.bonusText}>{room.bonus}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold' },
    goldBadge: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    goldText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16 },
    roomsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 100 },
    roomCard: {
        width: '48%',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
    },
    roomEmoji: { fontSize: 32, marginBottom: 8 },
    roomName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
    lockInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    costText: { color: '#94a3b8', fontSize: 12, marginLeft: 4 },
    bonusText: { color: '#22c55e', fontSize: 10, marginTop: 8, textAlign: 'center' },
});
