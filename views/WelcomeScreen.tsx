import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swords, Users } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const itemsScale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(itemsScale, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background Layers */}
            <LinearGradient
                colors={['#1a1f2e', '#231d0f']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Ambient Gradient Overlay similar to the HTML design */}
            <LinearGradient
                colors={['rgba(30, 58, 138, 0.4)', 'rgba(88, 28, 135, 0.2)', 'transparent']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>

                {/* Hero Illustration */}
                <Animated.View style={[styles.heroContainer, { opacity: fadeAnim, transform: [{ scale: itemsScale }] }]}>
                    <View style={styles.heroGlow} />
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN7gIaM3Cr5-j10G8M8du5gKXWe1p1SRGmTj9N8HKu6CkP-rn56KdsZs_LlBJZS4jhUXnQUd8VEECTczAqjLv5FSOf0fpnoYSvJ-Jzo0ZjCdYFx7xNysUcCVqlRMf3JMMqDYIC245RJWWzdZGqEVNyqfurpDBk2WQJ0cxhdIvdgQ0ZSzcd8lr8nGpFT5TQW0HhCh2FxFT-cKe3fJ0JBk3rAp86EFaq_kcSCliZZluLJxZ9qgbGIguwUm-UuaGotqpEhUvy-EbF' }}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Header Text */}
                <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.title}>HeroQuest</Text>
                    <Text style={styles.subtitle}>Ev İşlerini Efsaneye Dönüştür.</Text>
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {/* Primary Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('FamilySetup')}
                        activeOpacity={0.8}
                    >
                        <Swords size={24} color="#231d0f" style={styles.buttonIcon} />
                        <Text style={styles.primaryButtonText}>Yeni Maceraya Başla</Text>
                    </TouchableOpacity>

                    {/* Secondary Button */}
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('JoinFamily')}
                        activeOpacity={0.8}
                    >
                        <Users size={24} color="#fbbd23" style={styles.buttonIcon} />
                        <Text style={styles.secondaryButtonText}>Mevcut Partiye Katıl</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <Text style={styles.footerText}>Zaten bir kahraman mısın? </Text>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Giriş Yap</Text>
                    </TouchableOpacity>
                </Animated.View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1f2e',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 16,
    },
    heroContainer: {
        width: width * 0.8,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    heroGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(251, 189, 35, 0.2)',
        borderRadius: width / 2,
        opacity: 0.6,
        transform: [{ scale: 0.8 }],
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 40,
        fontWeight: '800', // Close to 'font-extrabold'
        color: '#fbbd23', // Primary gold color from Tailwind config
        textAlign: 'center',
        textShadowColor: 'rgba(251, 189, 35, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        maxWidth: 400,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbbd23', // Primary
        height: 56,
        borderRadius: 28, // Rounded full
        shadowColor: '#fbbd23',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    primaryButtonText: {
        color: '#231d0f', // Background dark for contrast
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
        paddingVertical: 16,
    },
    footerText: {
        color: '#94a3b8', // Slate-400 equivalent
        fontSize: 14,
        fontWeight: '500',
    },
    linkText: {
        color: '#fbbd23',
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
