import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Heart, Utensils, Gamepad2, MessageCircle, Gift, Sparkles } from 'lucide-react-native';
import { AnimatedCreature } from '../components/AnimatedCreature';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { GameButton } from '../components/GameButton';
import { getTheme, ThemeType } from '../constants/themes';
import { supabase } from '../services/supabaseClient';

interface CreatureScreenProps {
    userId: string;
    theme?: ThemeType;
}

const CREATURE_TYPES = {
    hero: { type: 'dragon', emoji: '🐉', name: 'Ejderha', babyEmoji: '🐣', eggEmoji: '🥚' },
    fairy: { type: 'butterfly', emoji: '🦋', name: 'Kelebek', babyEmoji: '🐛', eggEmoji: '🥚' },
    magical: { type: 'unicorn', emoji: '🦄', name: 'Unicorn', babyEmoji: '🐴', eggEmoji: '🥚' },
    ocean: { type: 'dolphin', emoji: '🐬', name: 'Yunus', babyEmoji: '🐟', eggEmoji: '🥚' },
};

const STAGE_EMOJIS = ['🥚', '🐣', '🐲', '🐉', '👑'];

export const CreatureScreen: React.FC<CreatureScreenProps> = ({ userId, theme = 'hero' }) => {
    const [creature, setCreature] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFeeding, setIsFeeding] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

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
                        xp: 0,
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

    const checkEvolution = async () => {
        if (!creature) return;
        // Her 100 XP'de seviye atla
        const newStage = Math.min(5, Math.floor((creature.xp || 0) / 100) + 1);
        if (newStage > creature.stage) {
            setShowConfetti(true);
            await supabase
                .from('creatures')
                .update({ stage: newStage })
                .eq('id', creature.id);
            Alert.alert('🎉 EVRİM!', `${creature.name} yeni bir seviyeye ulaştı!`);
        }
    };

    const handleFeed = async () => {
        if (!canDoAction(creature?.last_fed_at, 4)) {
            Alert.alert('🍽️ Tok!', 'Yaratığın şu an aç değil. Biraz bekle!');
            return;
        }

        setIsFeeding(true);
        try {
            await supabase
                .from('creatures')
                .update({
                    hunger: Math.min(100, creature.hunger + 25),
                    xp: (creature.xp || 0) + 5,
                    last_fed_at: new Date().toISOString()
                })
                .eq('id', creature.id);

            await loadCreature();
            await checkEvolution();
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setIsFeeding(false), 1000);
        }
    };

    const handlePlay = async () => {
        if (!canDoAction(creature?.last_played_at, 2)) {
            Alert.alert('😴 Yorgun!', 'Yaratığın biraz dinlenmeli!');
            return;
        }

        setIsPlaying(true);
        try {
            await supabase
                .from('creatures')
                .update({
                    happiness: Math.min(100, creature.happiness + 20),
                    xp: (creature.xp || 0) + 10,
                    last_played_at: new Date().toISOString()
                })
                .eq('id', creature.id);

            await loadCreature();
            await checkEvolution();
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setIsPlaying(false), 2000);
        }
    };

    const handleTalk = async () => {
        if (!canDoAction(creature?.last_talked_at, 1)) {
            Alert.alert('💤', 'Yaratığın şu an dinleniyor!');
            return;
        }

        try {
            await supabase
                .from('creatures')
                .update({
                    energy: Math.min(100, creature.energy + 15),
                    xp: (creature.xp || 0) + 3,
                    last_talked_at: new Date().toISOString()
                })
                .eq('id', creature.id);

            await loadCreature();

            const messages = [
                '💕 Yaratığın seni çok seviyor!',
                '🎵 Yaratığın mutlu şarkılar söylüyor!',
                '✨ Yaratığın gözleri parlıyor!',
                '🌟 Harika bir dostluğunuz var!',
            ];
            Alert.alert('💬', messages[Math.floor(Math.random() * messages.length)]);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
                <Text style={styles.loadingText}>Yaratığın uyanıyor...</Text>
            </View>
        );
    }

    if (!creature) {
        return (
            <View style={[styles.container, { backgroundColor: themeData.colors.background }]}>
                <Text style={styles.loadingText}>Yaratık bulunamadı</Text>
            </View>
        );
    }

    const currentEmoji = creature.stage <= 1 ? creatureType.eggEmoji :
        creature.stage === 2 ? creatureType.babyEmoji :
            creatureType.emoji;

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeData.colors.background }]}>
            <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Header */}
            <View style={styles.header}>
                <Sparkles color={themeData.colors.accent} size={24} />
                <Text style={[styles.title, { color: themeData.colors.accent }]}>
                    {creature.name || creatureType.name}
                </Text>
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>⭐ {creature.xp || 0} XP</Text>
                </View>
            </View>

            {/* Animated Creature */}
            <AnimatedCreature
                emoji={currentEmoji}
                stage={creature.stage}
                happiness={creature.happiness}
                isFeeding={isFeeding}
                isPlaying={isPlaying}
                size={140}
            />

            <Text style={styles.stageText}>
                {STAGE_EMOJIS[creature.stage - 1]} Aşama {creature.stage}/5
            </Text>

            {/* Stats */}
            <View style={styles.statsCard}>
                <View style={styles.statRow}>
                    <View style={styles.statIcon}>
                        <Heart color="#f43f5e" size={18} />
                    </View>
                    <Text style={styles.statLabel}>Mutluluk</Text>
                    <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${creature.happiness}%`, backgroundColor: '#f43f5e' }]} />
                    </View>
                    <Text style={styles.statValue}>{creature.happiness}%</Text>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.statIcon}>
                        <Utensils color="#22c55e" size={18} />
                    </View>
                    <Text style={styles.statLabel}>Tokluk</Text>
                    <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${creature.hunger}%`, backgroundColor: '#22c55e' }]} />
                    </View>
                    <Text style={styles.statValue}>{creature.hunger}%</Text>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.statIcon}>
                        <Gift color="#3b82f6" size={18} />
                    </View>
                    <Text style={styles.statLabel}>Enerji</Text>
                    <View style={styles.statBarBg}>
                        <View style={[styles.statBarFill, { width: `${creature.energy}%`, backgroundColor: '#3b82f6' }]} />
                    </View>
                    <Text style={styles.statValue}>{creature.energy}%</Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#22c55e' }]}
                    onPress={handleFeed}
                >
                    <Utensils color="#22c55e" size={28} />
                    <Text style={[styles.actionLabel, { color: '#22c55e' }]}>BESLE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnMain, { backgroundColor: themeData.colors.accent }]}
                    onPress={handlePlay}
                >
                    <Gamepad2 color="#0f172a" size={32} />
                    <Text style={[styles.actionLabel, { color: '#0f172a' }]}>OYNA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#8b5cf6' }]}
                    onPress={handleTalk}
                >
                    <MessageCircle color="#8b5cf6" size={28} />
                    <Text style={[styles.actionLabel, { color: '#8b5cf6' }]}>KONUŞ</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 100 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        gap: 8,
    },
    title: { fontSize: 24, fontWeight: 'bold' },
    xpBadge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 'auto',
    },
    xpText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12 },
    stageText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 8,
    },
    statsCard: {
        backgroundColor: '#1e293b',
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 24,
        padding: 20,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        color: '#94a3b8',
        fontSize: 12,
        width: 60,
        marginLeft: 12,
    },
    statBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: '#334155',
        borderRadius: 5,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    statBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    statValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'right',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
        gap: 16,
    },
    actionBtn: {
        width: 80,
        height: 90,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#334155',
    },
    actionBtnMain: {
        width: 100,
        height: 100,
        borderWidth: 0,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 1,
    },
});
