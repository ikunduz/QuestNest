import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, Check } from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { THEMES, ThemeType, Theme } from '../constants/themes';
import { supabase } from '../services/supabaseClient';

interface ThemeSelectionScreenProps {
    userId: string;
    currentTheme?: ThemeType;
    onThemeSelected: (theme: ThemeType) => void;
}

export const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({
    userId,
    currentTheme = 'hero',
    onThemeSelected,
}) => {
    const [selectedTheme, setSelectedTheme] = useState<ThemeType>(currentTheme);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await supabase
                .from('users')
                .update({ theme: selectedTheme })
                .eq('id', userId);

            onThemeSelected(selectedTheme);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const themes = Object.values(THEMES);

    return (
        <View style={styles.container}>
            <Sparkles size={48} color="#fbbf24" style={{ alignSelf: 'center' }} />
            <Text style={styles.title}>KRALLIĞINI SEÇ!</Text>
            <Text style={styles.subtitle}>Her tema farklı bir macera sunar</Text>

            <ScrollView contentContainerStyle={styles.themeGrid}>
                {themes.map((theme: Theme) => (
                    <TouchableOpacity
                        key={theme.id}
                        style={[
                            styles.themeCard,
                            {
                                backgroundColor: theme.colors.cardBackground,
                                borderColor: selectedTheme === theme.id ? theme.colors.accent : theme.colors.border,
                            },
                            selectedTheme === theme.id && styles.themeCardSelected,
                        ]}
                        onPress={() => setSelectedTheme(theme.id)}
                    >
                        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                        <Text style={[styles.themeName, { color: theme.colors.accent }]}>{theme.name}</Text>

                        <View style={styles.themeDetails}>
                            <Text style={styles.themeDetail}>{theme.structure.emoji} {theme.structure.name}</Text>
                            <Text style={styles.themeDetail}>{theme.currency.emoji} {theme.currency.name}</Text>
                        </View>

                        {selectedTheme === theme.id && (
                            <View style={[styles.checkBadge, { backgroundColor: theme.colors.accent }]}>
                                <Check color="#0f172a" size={16} />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <GameButton
                onPress={handleConfirm}
                loading={loading}
                style={styles.confirmButton}
            >
                MACERANI BAŞLAT
            </GameButton>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fbbf24', textAlign: 'center', marginTop: 16 },
    subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 32 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 100 },
    themeCard: {
        width: '48%',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
    },
    themeCardSelected: {
        transform: [{ scale: 1.02 }],
    },
    themeEmoji: { fontSize: 48, marginBottom: 12 },
    themeName: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    themeDetails: { alignItems: 'center' },
    themeDetail: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    checkBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButton: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20
    },
});
