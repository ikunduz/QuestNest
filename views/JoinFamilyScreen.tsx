import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameButton } from '../components/GameButton';
import { Search, Users, Sparkles, Key } from 'lucide-react-native';
import { findFamilyByCode, createUser } from '../services/familyService';

export const JoinFamilyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundFamily, setFoundFamily] = useState<any>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const keyRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        ]).start();

        // Key wiggle animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(keyRotate, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(keyRotate, { toValue: -1, duration: 200, useNativeDriver: true }),
                Animated.timing(keyRotate, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.delay(2000),
            ])
        ).start();
    }, []);

    const keyRotateInterpolate = keyRotate.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-15deg', '0deg', '15deg'],
    });

    const handleSearch = async () => {
        if (code.length < 4) {
            Alert.alert("🔑", "Geçerli bir aile kodu gir!");
            return;
        }

        setLoading(true);
        try {
            const family = await findFamilyByCode(code);
            if (family) {
                setFoundFamily(family);
            } else {
                Alert.alert("😕", "Bu kodla eşleşen bir krallık bulunamadı.");
            }
        } catch (e) {
            Alert.alert("Hata", "Arama sırasında bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!userName.trim()) {
            Alert.alert("👤", "Lütfen adını gir!");
            return;
        }

        setLoading(true);
        try {
            const user = await createUser({
                family_id: foundFamily.id,
                name: userName.trim(),
                role: 'parent',
                parent_type: 'dad'
            });

            const userState = {
                id: user.id,
                family_id: foundFamily.id,
                role: 'parent',
                name: userName.trim(),
                xp: 0,
                level: 1,
                streak: 0,
                parent_type: 'dad'
            };
            await AsyncStorage.setItem('questnest_user', JSON.stringify(userState));

            Alert.alert(
                "🎉 HOŞ GELDİN!",
                `${foundFamily.name} krallığına katıldın!`,
                [{ text: "MACERAYA BAŞLA!", onPress: () => navigation.replace('Main', { initialUser: userState }) }]
            );
        } catch (error: any) {
            Alert.alert("Hata", "Katılırken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>

                {/* Icon */}
                <Animated.View style={[styles.iconContainer, { transform: [{ rotate: keyRotateInterpolate }] }]}>
                    <Key color="#fbbf24" size={48} />
                </Animated.View>

                <Text style={styles.title}>KRALLIĞA KATIL</Text>
                <Text style={styles.subtitle}>Aile kodunu girerek mevcut bir krallığa katıl</Text>

                {!foundFamily ? (
                    <>
                        {/* Code Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>AİLE KODU</Text>
                            <TextInput
                                style={styles.codeInput}
                                value={code}
                                onChangeText={(v) => setCode(v.toUpperCase())}
                                placeholder="XXXXX-XXXX"
                                placeholderTextColor="#475569"
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                        </View>

                        <GameButton onPress={handleSearch} loading={loading} style={styles.searchBtn}>
                            <Search color="#0f172a" size={20} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>KRALLIĞI BUL</Text>
                        </GameButton>
                    </>
                ) : (
                    <>
                        {/* Found Family */}
                        <View style={styles.foundCard}>
                            <Users color="#22c55e" size={32} />
                            <Text style={styles.foundTitle}>{foundFamily.name}</Text>
                            <Text style={styles.foundSub}>Krallık bulundu! 🎉</Text>
                        </View>

                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SENİN ADIN</Text>
                            <TextInput
                                style={styles.input}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Adın..."
                                placeholderTextColor="#475569"
                                autoFocus
                            />
                        </View>

                        <GameButton onPress={handleJoin} loading={loading} style={styles.joinBtn}>
                            <Sparkles color="#0f172a" size={20} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>KRALLIĞA KATIL!</Text>
                        </GameButton>
                    </>
                )}

                {/* Back Button */}
                <GameButton
                    variant="ghost"
                    onPress={() => foundFamily ? setFoundFamily(null) : navigation.goBack()}
                    style={styles.backBtn}
                >
                    ← GERİ
                </GameButton>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
    content: { alignItems: 'center' },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fbbf24',
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    inputGroup: { width: '100%', marginBottom: 24 },
    label: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    codeInput: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 18,
        color: '#fbbf24',
        fontSize: 24,
        borderWidth: 2,
        borderColor: '#334155',
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 18,
        color: '#fff',
        fontSize: 18,
        borderWidth: 2,
        borderColor: '#334155',
        textAlign: 'center',
    },
    searchBtn: { width: '100%', paddingVertical: 16, marginBottom: 16 },
    foundCard: {
        width: '100%',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    foundTitle: { fontSize: 20, fontWeight: 'bold', color: '#22c55e', marginTop: 12 },
    foundSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    joinBtn: { width: '100%', paddingVertical: 16, marginBottom: 16 },
    backBtn: { marginTop: 16 },
});
