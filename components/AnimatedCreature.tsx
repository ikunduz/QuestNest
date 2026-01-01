import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';

interface AnimatedCreatureProps {
    emoji: string;
    stage: number;
    happiness: number;
    isFeeding?: boolean;
    isPlaying?: boolean;
    size?: number;
}

export const AnimatedCreature: React.FC<AnimatedCreatureProps> = ({
    emoji,
    stage,
    happiness,
    isFeeding = false,
    isPlaying = false,
    size = 120,
}) => {
    // Breathing animation (idle)
    const breathAnim = useRef(new Animated.Value(1)).current;
    // Bounce animation (happy)
    const bounceAnim = useRef(new Animated.Value(0)).current;
    // Shake animation (playing)
    const shakeAnim = useRef(new Animated.Value(0)).current;
    // Pulse animation (feeding)
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Idle breathing animation
    useEffect(() => {
        const breathe = Animated.loop(
            Animated.sequence([
                Animated.timing(breathAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(breathAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        breathe.start();
        return () => breathe.stop();
    }, []);

    // Bounce when happy (happiness > 80)
    useEffect(() => {
        if (happiness > 80) {
            const bounce = Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: -15,
                        duration: 400,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 400,
                        easing: Easing.bounce,
                        useNativeDriver: true,
                    }),
                    Animated.delay(1500),
                ])
            );
            bounce.start();
            return () => bounce.stop();
        }
    }, [happiness]);

    // Shake when playing
    useEffect(() => {
        if (isPlaying) {
            const shake = Animated.loop(
                Animated.sequence([
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                    Animated.delay(500),
                ])
            );
            shake.start();
            return () => shake.stop();
        }
    }, [isPlaying]);

    // Pulse when feeding
    useEffect(() => {
        if (isFeeding) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [isFeeding]);

    // Glow color based on happiness
    const getGlowColor = () => {
        if (happiness > 80) return '#fbbf24';
        if (happiness > 50) return '#22c55e';
        if (happiness > 25) return '#f59e0b';
        return '#ef4444';
    };

    const stageSize = size + (stage - 1) * 20;

    return (
        <View style={styles.container}>
            {/* Glow effect */}
            <View style={[styles.glow, {
                width: stageSize + 60,
                height: stageSize + 60,
                backgroundColor: getGlowColor(),
                opacity: 0.2,
            }]} />

            {/* Creature */}
            <Animated.View
                style={[
                    styles.creature,
                    {
                        width: stageSize,
                        height: stageSize,
                        transform: [
                            { scale: Animated.multiply(breathAnim, pulseAnim) },
                            { translateY: bounceAnim },
                            { translateX: shakeAnim },
                        ],
                    },
                ]}
            >
                <Text style={[styles.emoji, { fontSize: stageSize * 0.7 }]}>{emoji}</Text>
            </Animated.View>

            {/* Stage indicator */}
            <View style={styles.stageIndicator}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <View
                        key={s}
                        style={[
                            styles.stageDot,
                            s <= stage && styles.stageDotActive,
                        ]}
                    />
                ))}
            </View>

            {/* Happiness hearts */}
            {happiness > 90 && (
                <Animated.View style={[styles.hearts, { opacity: 0.8 }]}>
                    <Text style={styles.heartEmoji}>💕</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    glow: {
        position: 'absolute',
        borderRadius: 999,
    },
    creature: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 999,
        borderWidth: 4,
        borderColor: '#334155',
    },
    emoji: {
        textAlign: 'center',
    },
    stageIndicator: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    stageDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#334155',
    },
    stageDotActive: {
        backgroundColor: '#fbbf24',
    },
    hearts: {
        position: 'absolute',
        top: -20,
        right: 0,
    },
    heartEmoji: {
        fontSize: 24,
    },
});
