import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface XPGainAnimationProps {
    amount: number;
    visible: boolean;
    onComplete?: () => void;
}

export const XPGainAnimation: React.FC<XPGainAnimationProps> = ({
    amount,
    visible,
    onComplete,
}) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (visible && amount > 0) {
            // Reset
            translateY.setValue(0);
            opacity.setValue(0);
            scale.setValue(0.5);

            // Animate
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1.2,
                    duration: 300,
                    easing: Easing.out(Easing.back(2)),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Float up and fade
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 1000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 1000,
                        delay: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 0.8,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onComplete?.();
                });
            });
        }
    }, [visible, amount]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
            pointerEvents="none"
        >
            <Text style={styles.xpText}>+{amount} XP</Text>
            <Text style={styles.starEmoji}>⭐</Text>
        </Animated.View>
    );
};

// Floating hearts for blessing
interface FloatingHeartsProps {
    visible: boolean;
    from?: 'mom' | 'dad';
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({ visible, from }) => {
    const hearts = useRef<Animated.Value[]>([]);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        if (visible) {
            hearts.current = Array.from({ length: 8 }, () => new Animated.Value(0));
            forceUpdate({});

            const animations = hearts.current.map((heart, i) => {
                return Animated.sequence([
                    Animated.delay(i * 100),
                    Animated.timing(heart, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]);
            });

            Animated.parallel(animations).start(() => {
                hearts.current = [];
                forceUpdate({});
            });
        }
    }, [visible]);

    if (!visible || hearts.current.length === 0) return null;

    return (
        <View style={styles.heartsContainer} pointerEvents="none">
            {hearts.current.map((anim, i) => (
                <Animated.Text
                    key={i}
                    style={[
                        styles.floatingHeart,
                        {
                            left: `${15 + Math.random() * 70}%`,
                            opacity: anim.interpolate({
                                inputRange: [0, 0.3, 1],
                                outputRange: [0, 1, 0],
                            }),
                            transform: [
                                {
                                    translateY: anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [100, -200],
                                    }),
                                },
                                {
                                    scale: anim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.5, 1.2, 0.8],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {from === 'mom' ? '💕' : '💙'}
                </Animated.Text>
            ))}
            <Text style={styles.blessingText}>
                {from === 'mom' ? '👸 Anneden Lütuf!' : '🤴 Babadan Lütuf!'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
    xpText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fbbf24',
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    starEmoji: {
        fontSize: 32,
        marginTop: 8,
    },
    heartsContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingHeart: {
        position: 'absolute',
        fontSize: 40,
        bottom: 100,
    },
    blessingText: {
        position: 'absolute',
        bottom: 50,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
});
