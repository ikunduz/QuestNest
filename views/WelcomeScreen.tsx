import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, Dimensions, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swords, Users, BookOpen, X, Smartphone, Zap, Crown, Sparkles } from 'lucide-react-native';

import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    // State
    const [showHowToPlay, setShowHowToPlay] = useState(false);

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
            <LinearGradient
                colors={['#1a1f2e', '#231d0f']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <LinearGradient
                colors={['rgba(30, 58, 138, 0.4)', 'rgba(88, 28, 135, 0.2)', 'transparent']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <Animated.View style={[styles.heroContainer, { opacity: fadeAnim, transform: [{ scale: itemsScale }] }]}>
                    <View style={styles.heroGlow} />
                    <Image
                        source={require('../assets/icon.png')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.title}>QuestNest</Text>
                    <Text style={styles.subtitle}>Kahraman Aile Görevleri</Text>
                </Animated.View>

                <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('FamilySetup')}
                        activeOpacity={0.8}
                    >
                        <Swords size={24} color="#231d0f" style={styles.buttonIcon} />
                        <Text style={styles.primaryButtonText}>Aile Oluştur</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('JoinFamily')}
                        activeOpacity={0.8}
                    >
                        <Users size={24} color="#fbbd23" style={styles.buttonIcon} />
                        <Text style={styles.secondaryButtonText}>Mevcut Aileye Katıl</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* New 'How to Play' Footer */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.howToPlayButton} onPress={() => setShowHowToPlay(true)}>
                        <BookOpen size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                        <Text style={styles.howToPlayText}>Bu Macera Nasıl Çalışır?</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Modal */}
                <Modal
                    visible={showHowToPlay}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowHowToPlay(false)}
                >
                    <View style={styles.modalContainer}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.modalContent}>
                            <LinearGradient
                                colors={['#1a1f2e', '#111827']}
                                style={styles.modalGradient}
                            >
                                {/* Header */}
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitleRow}>
                                        <BookOpen color="#fbbd23" size={24} />
                                        <Text style={styles.modalTitle}>KRALLIK REHBERİ</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowHowToPlay(false)} style={styles.closeButton}>
                                        <X color="#94a3b8" size={24} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView contentContainerStyle={styles.modalScroll}>

                                    {/* Card 1: Concept */}
                                    <View style={styles.guideCard}>
                                        <View style={styles.guideIconContainer}>
                                            <Crown color="#fbbd23" size={32} />
                                        </View>
                                        <Text style={styles.guideTitle}>Burası Senin Krallığın! 🏰</Text>
                                        <Text style={styles.guideText}>
                                            Ev işleri artık sıkıcı görevler değil, efsanevi maceralar!
                                            Odanı toplamak bir "Karanlık Zindan Temizliği", diş fırçalamak ise "İnci Kalkan Bakımı" olabilir.
                                        </Text>
                                    </View>

                                    {/* Card 2: Sync */}
                                    <View style={styles.guideCard}>
                                        <View style={[styles.guideIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                            <Smartphone color="#60a5fa" size={32} />
                                        </View>
                                        <Text style={[styles.guideTitle, { color: '#60a5fa' }]}>Büyülü Bağlantı ✨</Text>
                                        <Text style={styles.guideText}>
                                            Bir kişi "Aile Kodu" oluşturur, diğerleri bu kodla katılır!{'\n\n'}
                                            👑 Ebeveynler: Kod + PIN ile katılır{'\n'}
                                            🛡️ Çocuklar: Kod + İsim ile katılır{'\n\n'}
                                            Anne, Baba ve tüm çocuklar farklı cihazlardan aynı krallığa bağlanabilir.
                                        </Text>
                                    </View>

                                    {/* Card 3: Real Time */}
                                    <View style={styles.guideCard}>
                                        <View style={[styles.guideIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                            <Zap color="#34d399" size={32} />
                                        </View>
                                        <Text style={[styles.guideTitle, { color: '#34d399' }]}>Şimşek Hızı! ⚡</Text>
                                        <Text style={styles.guideText}>
                                            Kraliçe (Anne) bir görev verdiğinde, Küçük Kahramanın (Senin) ekranına anında düşer!
                                            Görevi tamamlayıp "Onaya Gönder" dediğinde, ebeveynlerine bildirim gider.
                                        </Text>
                                    </View>

                                    {/* Card 4: Roles */}
                                    <View style={styles.guideCard}>
                                        <View style={[styles.guideIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                                            <Sparkles color="#f472b6" size={32} />
                                        </View>
                                        <Text style={[styles.guideTitle, { color: '#f472b6' }]}>Kahramanlar ve Yöneticiler</Text>
                                        <Text style={styles.guideText}>
                                            • Ebeveynler: Görev verir, ödülleri onaylar ve altını yönetir.
                                            {'\n'}• Çocuklar: Maceralara atılır, altın kazanır ve seviye atlar!
                                        </Text>
                                    </View>

                                </ScrollView>

                                <TouchableOpacity style={styles.modalButton} onPress={() => setShowHowToPlay(false)}>
                                    <Text style={styles.modalButtonText}>ANLAŞILDI!</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1f2e' },
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
    heroImage: { width: '100%', height: '100%' },
    textContainer: { alignItems: 'center', marginBottom: 32 },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fbbd23',
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
    buttonContainer: { width: '100%', gap: 16, maxWidth: 400 },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbbd23',
        height: 56,
        borderRadius: 28,
        shadowColor: '#fbbd23',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    primaryButtonText: {
        color: '#231d0f',
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
    buttonIcon: { marginRight: 8 },

    // Footer styles
    footer: {
        marginTop: 'auto',
        paddingVertical: 20,
    },
    howToPlayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    howToPlayText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '90%',
        height: '80%',
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#fbbd23',
        shadowColor: '#fbbd23',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalGradient: {
        flex: 1,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fbbd23',
        letterSpacing: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalScroll: {
        gap: 16,
        paddingBottom: 24,
    },
    guideCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    guideIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    guideTitle: {
        color: '#fbbd23',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    guideText: {
        color: '#cbd5e1',
        fontSize: 14,
        lineHeight: 22,
    },
    modalButton: {
        backgroundColor: '#fbbd23',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    modalButtonText: {
        color: '#231d0f',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    }
});
