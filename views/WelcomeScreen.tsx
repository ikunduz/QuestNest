import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { GameButton } from '../components/GameButton';
import { Sparkles, Users, UserPlus, Crown, Shield, Star } from 'lucide-react-native';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    // Animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const buttonsSlide = useRef(new Animated.Value(50)).current;
    const starRotate = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Logo appears with bounce
        Animated.spring(logoScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
        }).start();

        // Title fades in
        Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 800,
            delay: 300,
            useNativeDriver: true,
        }).start();

        // Buttons slide up
        Animated.timing(buttonsSlide, {
            toValue: 0,
            duration: 600,
            delay: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
        }).start();

        // Star rotation loop
        Animated.loop(
            Animated.timing(starRotate, {
                toValue: 1,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation for logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotateInterpolate = starRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Background decorations */}
            <Animated.View style={[styles.floatingStar, styles.star1, { transform: [{ rotate: rotateInterpolate }] }]}>
                <Star color="rgba(251, 191, 36, 0.2)" size={40} />
            </Animated.View>
            <Animated.View style={[styles.floatingStar, styles.star2, { transform: [{ rotate: rotateInterpolate }] }]}>
                <Sparkles color="rgba(251, 191, 36, 0.15)" size={30} />
            </Animated.View>
            <Animated.View style={[styles.floatingStar, styles.star3, { transform: [{ rotate: rotateInterpolate }] }]}>
                <Star color="rgba(251, 191, 36, 0.1)" size={50} />
            </Animated.View>

            <View style={styles.content}>
                {/* Animated Logo */}
                <Animated.View style={[
                    styles.logoContainer,
                    { transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }] }
                ]}>
                    <View style={styles.logoInner}>
                        <Crown color="#fbbf24" size={50} />
                    </View>
                    <View style={styles.shieldBadge}>
                        <Shield color="#fbbf24" size={24} fill="rgba(251, 191, 36, 0.2)" />
                    </View>
                </Animated.View>

                {/* Title */}
                <Animated.View style={{ opacity: titleOpacity }}>
                    <Text style={styles.title}>QUESTNEST</Text>
                    <Text style={styles.tagline}>Küçük Kahramanların Büyüdüğü Yer</Text>
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Sparkles color="#fbbf24" size={16} />
                        <View style={styles.dividerLine} />
                    </View>
                </Animated.View>

                {/* Buttons */}
                <Animated.View style={[
                    styles.buttonContainer,
                    { transform: [{ translateY: buttonsSlide }], opacity: titleOpacity }
                ]}>
                    <GameButton
                        onPress={() => navigation.navigate('FamilySetup')}
                        variant="primary"
                        style={styles.button}
                    >
                        <Users color="#0f172a" size={22} style={{ marginRight: 10 }} />
                        <Text style={styles.buttonText}>YENİ AİLE OLUŞTUR</Text>
                    </GameButton>

                    <GameButton
                        onPress={() => navigation.navigate('JoinFamily')}
                        variant="secondary"
                        style={styles.buttonSecondary}
                    >
                        <UserPlus color="#fbbf24" size={22} style={{ marginRight: 10 }} />
                        <Text style={styles.buttonTextSecondary}>AİLEYE KATIL</Text>
                    </GameButton>
                </Animated.View>

                {/* Footer */}
                <Animated.Text style={[styles.footer, { opacity: titleOpacity }]}>
                    Çocuğunuzun görevleri tamamlamasını oyunlaştırın! 🎮
                </Animated.Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    floatingStar: { position: 'absolute' },
    star1: { top: 60, right: 30 },
    star2: { top: 150, left: 20 },
    star3: { bottom: 200, right: 50 },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 3,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    logoInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shieldBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#0f172a',
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: 'rgba(251, 191, 36, 0.5)',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fbbf24',
        letterSpacing: 6,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 8,
        letterSpacing: 1,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 12,
    },
    dividerLine: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(251, 191, 36, 0.3)',
        borderRadius: 1,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 48,
        gap: 16,
    },
    button: {
        width: '100%',
        paddingVertical: 18,
        flexDirection: 'row',
        borderRadius: 20,
    },
    buttonSecondary: {
        width: '100%',
        paddingVertical: 18,
        flexDirection: 'row',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fbbf24',
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#0f172a',
        letterSpacing: 1,
    },
    buttonTextSecondary: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#fbbf24',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 48,
        color: '#64748b',
        fontSize: 12,
        textAlign: 'center',
    },
});
