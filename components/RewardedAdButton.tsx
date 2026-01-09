/**
 * RewardedAdButton Component
 * 
 * A button that shows a rewarded video ad and grants gold to the user.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Play, Coins, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showRewardedAd, isRewardedAdReady, loadRewardedAd } from '../services/adService';
import i18n from '../i18n';

interface RewardedAdButtonProps {
    /** Callback when user earns reward */
    onReward: (goldAmount: number) => void;
    /** Custom gold reward amount (default: 50) */
    goldReward?: number;
    /** Whether to show the button (e.g., hide for premium users) */
    visible?: boolean;
}

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
    onReward,
    goldReward = 50,
    visible = true
}) => {
    const [loading, setLoading] = useState(false);
    const [adReady, setAdReady] = useState(false);
    const [cooldown, setCooldown] = useState(false);

    // Check ad availability periodically
    useEffect(() => {
        const checkAd = () => setAdReady(isRewardedAdReady());
        checkAd();
        const interval = setInterval(checkAd, 2000);
        return () => clearInterval(interval);
    }, []);

    // Ensure ad is loaded
    useEffect(() => {
        loadRewardedAd();
    }, []);

    const handlePress = async () => {
        if (cooldown || loading) return;

        setLoading(true);
        try {
            const reward = await showRewardedAd();
            if (reward > 0) {
                onReward(goldReward);
                Alert.alert(
                    '🎉 ' + i18n.t('common.success'),
                    `+${goldReward} ${i18n.t('common.gold')}!`
                );
                // Add cooldown to prevent spam
                setCooldown(true);
                setTimeout(() => setCooldown(false), 30000); // 30 second cooldown
            }
        } catch (error) {
            console.log('Rewarded ad error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <TouchableOpacity
            style={[styles.container, (!adReady || cooldown) && styles.disabled]}
            onPress={handlePress}
            disabled={!adReady || loading || cooldown}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={adReady && !cooldown ? ['#f59e0b', '#fbbf24'] : ['#475569', '#64748b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <View style={styles.iconContainer}>
                    {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                    ) : (
                        <Play size={20} color="#000" fill="#000" />
                    )}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {cooldown ? 'Bekleyin...' : 'Reklam İzle'}
                    </Text>
                    <View style={styles.rewardRow}>
                        <Coins size={14} color="#000" />
                        <Text style={styles.reward}>+{goldReward} Altın</Text>
                    </View>
                </View>

                <Gift size={24} color="rgba(0,0,0,0.3)" />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#f59e0b',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabled: {
        opacity: 0.6,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    reward: {
        color: 'rgba(0,0,0,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
});
