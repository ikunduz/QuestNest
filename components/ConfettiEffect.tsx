import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
    x: Animated.Value;
    y: Animated.Value;
    rotate: Animated.Value;
    color: string;
    size: number;
}

interface ConfettiEffectProps {
    active: boolean;
    onComplete?: () => void;
    duration?: number;
}

const COLORS = ['#fbbf24', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
    active,
    onComplete,
    duration = 2000,
}) => {
    const pieces = useRef<ConfettiPiece[]>([]);
    const [, forceUpdate] = React.useState({});

    useEffect(() => {
        if (active) {
            // Create confetti pieces
            pieces.current = Array.from({ length: 50 }, () => ({
                x: new Animated.Value(Math.random() * width),
                y: new Animated.Value(-50),
                rotate: new Animated.Value(0),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 8 + Math.random() * 12,
            }));
            forceUpdate({});

            // Animate each piece
            const animations = pieces.current.map((piece, i) => {
                const delay = i * 30;
                const fallDuration = duration + Math.random() * 1000;

                return Animated.parallel([
                    Animated.timing(piece.y, {
                        toValue: height + 50,
                        duration: fallDuration,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(piece.x, {
                        toValue: piece.x._value + (Math.random() - 0.5) * 200,
                        duration: fallDuration,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(piece.rotate, {
                        toValue: Math.random() * 10 - 5,
                        duration: fallDuration,
                        delay,
                        useNativeDriver: true,
                    }),
                ]);
            });

            Animated.parallel(animations).start(() => {
                pieces.current = [];
                forceUpdate({});
                onComplete?.();
            });
        }
    }, [active]);

    if (!active || pieces.current.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.current.map((piece, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.piece,
                        {
                            width: piece.size,
                            height: piece.size,
                            backgroundColor: piece.color,
                            borderRadius: Math.random() > 0.5 ? piece.size / 2 : 2,
                            transform: [
                                { translateX: piece.x },
                                { translateY: piece.y },
                                {
                                    rotate: piece.rotate.interpolate({
                                        inputRange: [-5, 5],
                                        outputRange: ['-180deg', '180deg'],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    piece: {
        position: 'absolute',
    },
});
