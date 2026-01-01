import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { Home, Lock, Unlock, Sparkles, Crown, BookOpen, UtensilsCrossed, TreeDeciduous, Coins, Castle as CastleIcon } from 'lucide-react-native';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { GameButton } from '../components/GameButton';
import { getTheme, ThemeType } from '../constants/themes';
import { supabase } from '../services/supabaseClient';

interface CastleScreenProps {
    userId: string;
    theme?: ThemeType;
}

const ROOMS = [
    { id: 'main_hall', name: 'Ana Salon', emoji: '🏠', icon: Home, cost: 0, unlocked: true, bonus: 'Hoş geldin!' },
    { id: 'bedroom', name: 'Yatak Odası', emoji: '🛏️', icon: Home, cost: 50, hours: 1, bonus: 'Enerji +10%' },
    { id: 'library', name: 'Kütüphane', emoji: '📚', icon: BookOpen, cost: 150, hours: 2, bonus: 'Ders XP +15%' },
    { id: 'kitchen', name: 'Mutfak', emoji: '🍳', icon: UtensilsCrossed, cost: 300, hours: 4, bonus: 'Yaratık mutluluğu+' },
    { id: 'garden', name: 'Bahçe', emoji: '🌳', icon: TreeDeciduous, cost: 500, hours: 6, bonus: 'Günlük bonus ödül' },
    { id: 'treasury', name: 'Hazine Odası', emoji: '💰', icon: Coins, cost: 800, hours: 12, bonus: 'Altın kazancı +20%' },
    { id: 'tower', name: 'Gözetleme Kulesi', emoji: '🗼', icon: CastleIcon, cost: 1200, hours: 24, bonus: 'Yaratık XP +25%' },
    { id: 'throne', name: 'Taht Odası', emoji: '👑', icon: Crown, cost: 2000, hours: 48, bonus: 'TÜM BONUSLAR +10%' },
];

export const CastleScreen: React.FC<CastleScreenProps> = ({ userId, theme = 'hero' }) => {
    const [castle, setCastle] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [unlockingRoom, setUnlockingRoom] = useState<string | null>(null);

    const themeData = getTheme(theme);

    useEffect(() => {
        loadCastle();
    }, []);

    const loadCastle = async () => {
        try {
            let { data: castleData } = await supabase
                .from('castles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!castleData) {
                const { data: newCastle } = await supabase
                    .from('castles')
                    .insert({ user_id: userId, name: `${themeData.structure.name}`, gold: 100 })
                    .select()
                    .single();
                castleData = newCastle;
            }

            setCastle(castleData);

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
        const room = ROOMS.find(r => r.id === roomId);
        if (room?.unlocked) return true;
        return rooms.some(r => r.room_type === roomId && r.is_unlocked);
    };

    const handleUnlockRoom = async (room: typeof ROOMS[0]) => {
        if (castle.gold < room.cost) {
            Alert.alert(
                '💰 Yetersiz Altın',
                `Bu oda için ${room.cost} ${themeData.currency.emoji} gerekiyor.\nMevcut: ${castle.gold} ${themeData.currency.emoji}`
            );
            return;
        }

        Alert.alert(
            `${room.emoji} ${room.name}`,
            `Bu odayı ${room.cost} ${themeData.currency.emoji} karşılığında açmak istiyor musun?\n\nBonus: ${room.bonus}`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'AÇ!',
                    onPress: async () => {
                        setUnlockingRoom(room.id);
                        try {
                            await supabase.from('castles').update({ gold: castle.gold - room.cost }).eq('id', castle.id);
                            await supabase.from('castle_rooms').insert({ castle_id: castle.id, room_type: room.id, is_unlocked: true });

                            setShowConfetti(true);
                            await loadCastle();

                            Alert.alert('🎉 Tebrikler!', `${room.name} artık senin!`);
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setUnlockingRoom(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
                <Text style={styles.loadingText}>Kale yükleniyor...</Text>
            </View>
        );
    }

    const unlockedCount = rooms.filter(r => r.is_unlocked).length + 1; // +1 for main hall

    return (
        <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
            <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.castleEmoji}>{themeData.structure.emoji}</Text>
                <View>
                    <Text style={[styles.title, { color: themeData.colors.accent }]}>
                        {castle?.name || themeData.structure.name}
                    </Text>
                    <Text style={styles.subtitle}>{unlockedCount}/{ROOMS.length} oda açık</Text>
                </View>
                <View style={styles.goldBadge}>
                    <Text style={styles.goldText}>{themeData.currency.emoji} {castle?.gold || 0}</Text>
                </View>
            </View>

            {/* Room Grid */}
            <ScrollView contentContainerStyle={styles.roomGrid}>
                {ROOMS.map((room, index) => {
                    const unlocked = isRoomUnlocked(room.id);
                    const isUnlocking = unlockingRoom === room.id;
                    const Icon = room.icon;

                    return (
                        <TouchableOpacity
                            key={room.id}
                            style={[
                                styles.roomCard,
                                {
                                    backgroundColor: unlocked ? themeData.colors.cardBackground : '#0f172a',
                                    borderColor: unlocked ? themeData.colors.accent : '#334155',
                                    opacity: unlocked ? 1 : 0.7,
                                },
                            ]}
                            onPress={() => !unlocked && handleUnlockRoom(room)}
                            disabled={unlocked || isUnlocking}
                        >
                            {/* Room Emoji */}
                            <Text style={styles.roomEmoji}>{room.emoji}</Text>

                            {/* Room Name */}
                            <Text style={[styles.roomName, { color: unlocked ? themeData.colors.accent : '#64748b' }]}>
                                {room.name}
                            </Text>

                            {/* Lock/Unlock Status */}
                            {!unlocked ? (
                                <View style={styles.lockInfo}>
                                    <Lock size={14} color="#64748b" />
                                    <Text style={styles.costText}>{room.cost} {themeData.currency.emoji}</Text>
                                </View>
                            ) : (
                                <View style={styles.bonusInfo}>
                                    <Sparkles size={12} color="#22c55e" />
                                    <Text style={styles.bonusText}>{room.bonus}</Text>
                                </View>
                            )}

                            {/* Unlocked Badge */}
                            {unlocked && (
                                <View style={[styles.unlockedBadge, { backgroundColor: themeData.colors.accent }]}>
                                    <Unlock size={12} color="#0f172a" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 100 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    castleEmoji: { fontSize: 48, marginRight: 16 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { color: '#64748b', fontSize: 12, marginTop: 2 },
    goldBadge: {
        marginLeft: 'auto',
        backgroundColor: '#1e293b',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fbbf24',
    },
    goldText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16 },
    roomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        paddingBottom: 100,
    },
    roomCard: {
        width: '46%',
        margin: '2%',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        minHeight: 140,
    },
    roomEmoji: { fontSize: 40, marginBottom: 8 },
    roomName: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    lockInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    costText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
    bonusInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bonusText: { color: '#22c55e', fontSize: 10, textAlign: 'center' },
    unlockedBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
