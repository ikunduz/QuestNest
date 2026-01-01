import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Heart, Utensils, Gamepad2, MessageCircle, Gift } from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { getTheme, ThemeType } from '../constants/themes';
import { supabase } from '../services/supabaseClient';

interface CreatureScreenProps {
    userId: string;
    theme?: ThemeType;
}

const CREATURE_TYPES = {
    hero: { type: 'dragon', emoji: '🐉', name: 'Ejderha' },
    fairy: { type: 'butterfly', emoji: '🦋', name: 'Kelebek' },
    magical: { type: 'unicorn', emoji: '🦄', name: 'Unicorn' },
    ocean: { type: 'dolphin', emoji: '🐬', name: 'Yunus' },
};

const STAGES = ['🥚', '🐣', '🐲', '🐉', '👑'];

export const CreatureScreen: React.FC<CreatureScreenProps> = ({ userId, theme = 'hero' }) => {
    const [creature, setCreature] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const themeData = getTheme(theme);
    const creatureType = CREATURE_TYPES[theme];

    useEffect(() => {
        loadCreature();
    }, []);

    const loadCreature = async () => {
        try {
            const { data } = await supabase
                .from('creatures')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setCreature(data);
            } else {
                // İlk defa - yaratık oluştur
                const { data: newCreature } = await supabase
                    .from('creatures')
                    .insert({
                        user_id: userId,
                        creature_type: creatureType.type,
                        name: creatureType.name,
                        stage: 1,
                        happiness: 100,
                        hunger: 100,
                        energy: 100,
                    })
                    .select()
                    .single();
                setCreature(newCreature);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const canDoAction = (lastActionAt: string | null, hoursRequired: number) => {
        if (!lastActionAt) return true;
        const diff = Date.now() - new Date(lastActionAt).getTime();
        return diff >= hoursRequired * 60 * 60 * 1000;
    };

    const handleFeed = async () => {
        if (!canDoAction(creature?.last_fed_at, 4)) {
            Alert.alert('Bekle', 'Yaratığın henüz aç değil!');
            return;
        }
        try {
            await supabase
                .from('creatures')
                .update({
                    hunger: Math.min(100, creature.hunger + 20),
                    last_fed_at: new Date().toISOString()
                })
                .eq('id', creature.id);
            loadCreature();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePlay = async () => {
        if (!canDoAction(creature?.last_played_at, 2)) {
            Alert.alert('Bekle', 'Yaratığın dinlenmeli!');
            return;
        }
        try {
            await supabase
                .from('creatures')
                .update({
                    happiness: Math.min(100, creature.happiness + 15),
                    xp: creature.xp + 10,
                    last_played_at: new Date().toISOString()
                })
                .eq('id', creature.id);
            loadCreature();
        } catch (e) {
            console.error(e);
        }
    };

    const handleTalk = async () => {
        if (!canDoAction(creature?.last_talked_at, 1)) {
            Alert.alert('Bekle', 'Yaratığın seni dinledi, biraz bekle!');
            return;
        }
        try {
            await supabase
                .from('creatures')
                .update({
                    energy: Math.min(100, creature.energy + 10),
                    last_talked_at: new Date().toISOString()
                })
                .eq('id', creature.id);
            loadCreature();
            Alert.alert('💬', 'Yaratığın seninle konuşmaktan çok mutlu!');
        } catch (e) {
            console.error(e);
        }
    };

    if (loading || !creature) {
        return (
            <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
                <Text style={{ color: '#fff' }}>Yükleniyor...</Text>
            </View>
        );
    }

    const stageEmoji = STAGES[Math.min(creature.stage - 1, STAGES.length - 1)];

    return (
        <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
            <Text style={[styles.title, { color: themeData.colors.accent }]}>
                {creatureType.emoji} {creature.name || creatureType.name}
            </Text>
            <Text style={styles.stage}>Seviye {creature.stage} • {stageEmoji}</Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                    <Heart color="#f43f5e" size={20} />
                    <Text style={styles.statLabel}>Mutluluk</Text>
                    <View style={styles.statBar}>
                        <View style={[styles.statFill, { width: `${creature.happiness}%`, backgroundColor: '#f43f5e' }]} />
                    </View>
                </View>
                <View style={styles.statRow}>
                    <Utensils color="#22c55e" size={20} />
                    <Text style={styles.statLabel}>Tokluk</Text>
                    <View style={styles.statBar}>
                        <View style={[styles.statFill, { width: `${creature.hunger}%`, backgroundColor: '#22c55e' }]} />
                    </View>
                </View>
                <View style={styles.statRow}>
                    <Gift color="#3b82f6" size={20} />
                    <Text style={styles.statLabel}>Enerji</Text>
                    <View style={styles.statBar}>
                        <View style={[styles.statFill, { width: `${creature.energy}%`, backgroundColor: '#3b82f6' }]} />
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleFeed}>
                    <Utensils color={themeData.colors.accent} size={24} />
                    <Text style={styles.actionText}>BESLE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handlePlay}>
                    <Gamepad2 color={themeData.colors.accent} size={24} />
                    <Text style={styles.actionText}>OYNA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleTalk}>
                    <MessageCircle color={themeData.colors.accent} size={24} />
                    <Text style={styles.actionText}>KONUŞ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    stage: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 32 },
    statsContainer: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, marginBottom: 32 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    statLabel: { color: '#94a3b8', fontSize: 12, width: 70, marginLeft: 12 },
    statBar: { flex: 1, height: 12, backgroundColor: '#334155', borderRadius: 6, overflow: 'hidden' },
    statFill: { height: '100%', borderRadius: 6 },
    actions: { flexDirection: 'row', justifyContent: 'space-around' },
    actionButton: {
        width: 80,
        height: 80,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    actionText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 8 },
});
