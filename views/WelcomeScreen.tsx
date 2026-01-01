import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { GameButton } from '../components/GameButton';
import { Sparkles, Users, UserPlus } from 'lucide-react-native';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094' }}
            style={styles.background}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Sparkles size={64} color="#fbbf24" />
                    </View>
                    <Text style={styles.title}>QUESTNEST</Text>
                    <Text style={styles.tagline}>Where Little Heroes Grow</Text>

                    <View style={styles.buttonContainer}>
                        <GameButton
                            onPress={() => navigation.navigate('FamilySetup')}
                            variant="primary"
                            style={styles.button}
                        >
                            <Users color="#0f172a" size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>AİLE OLUŞTUR</Text>
                        </GameButton>

                        <GameButton
                            onPress={() => navigation.navigate('JoinFamily')}
                            variant="secondary"
                            style={styles.button}
                        >
                            <UserPlus color="#fff" size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.buttonTextSecondary}>AİLEYE KATIL</Text>
                        </GameButton>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 24 },
    content: { alignItems: 'center' },
    logoContainer: { marginBottom: 24, padding: 20, backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 32 },
    title: { fontSize: 42, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 4 },
    tagline: { fontSize: 14, color: '#94a3b8', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' },
    buttonContainer: { width: '100%', marginTop: 64, gap: 16 },
    button: { width: '100%', paddingVertical: 18, flexDirection: 'row' },
    buttonText: { fontWeight: 'bold', fontSize: 16, color: '#0f172a' },
    buttonTextSecondary: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
});
