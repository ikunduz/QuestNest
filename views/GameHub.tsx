import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PawPrint, Castle, Users, User, Shield } from 'lucide-react-native';
import { CreatureScreen } from './CreatureScreen';
import { CastleScreen } from './CastleScreen';
import { UserState, PetState, Role } from '../types';
import i18n from '../i18n';

interface GameHubProps {
    user: UserState;
    pet: PetState;
    onUpdateUser: (updates: Partial<UserState>) => void;
    onUpdatePet: (updates: Partial<PetState>) => void;
}

type GameTab = 'creature' | 'castle';

export const GameHub: React.FC<GameHubProps> = ({
    user, pet, onUpdateUser, onUpdatePet
}) => {
    const [activeSubTab, setActiveSubTab] = useState<GameTab>('creature');

    return (
        <View style={styles.container}>
            {/* Top Bar - Tabs Only */}
            <View style={styles.header}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeSubTab === 'creature' && styles.tabButtonActive]}
                        onPress={() => setActiveSubTab('creature')}
                    >
                        <PawPrint size={16} color={activeSubTab === 'creature' ? '#fbbf24' : '#94a3b8'} />
                        <Text style={[styles.tabText, activeSubTab === 'creature' && styles.tabTextActive]}>{i18n.t('tabs.creature')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeSubTab === 'castle' && styles.tabButtonActive]}
                        onPress={() => setActiveSubTab('castle')}
                    >
                        <Castle size={16} color={activeSubTab === 'castle' ? '#fbbf24' : '#94a3b8'} />
                        <Text style={[styles.tabText, activeSubTab === 'castle' && styles.tabTextActive]}>{i18n.t('tabs.castle')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {activeSubTab === 'creature' ? (
                    <CreatureScreen
                        user={user}
                        onUpdateUser={onUpdateUser}
                        pet={pet}
                        onUpdatePet={onUpdatePet}
                    />
                ) : (
                    <CastleScreen
                        userId={user.id}
                        theme="hero"
                        userGold={user.xp}
                        onSpendGold={(amount) => onUpdateUser({ xp: user.xp - amount })}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center', // Centered
        alignItems: 'center',
        paddingTop: 8, // Reduced padding
        paddingHorizontal: 16,
        paddingBottom: 8, // Reduced padding
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        gap: 4
    },
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6
    },
    tabButtonActive: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
    },
    tabText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: '#fbbf24',
    },
    content: {
        flex: 1,
    }
});
