import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameButton } from '../components/GameButton';
import { Shield, Crown, Heart, Star, Sparkles } from 'lucide-react-native';
import { createFamily, createUser } from '../services/familyService';

export const FamilySetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [familyName, setFamilyName] = useState('');
    const [parentName, setParentName] = useState('');
    const [childName, setChildName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        ]).start();
    }, [step]);

    const handleNext = () => {
        if (step === 1 && !familyName) {
            Alert.alert("🏰", "Lütfen krallığına bir isim ver!");
            return;
        }
        if (step === 2 && !parentName) {
            Alert.alert("👑", "Adını girmeyi unuttun!");
            return;
        }
        if (step === 3 && !childName) {
            Alert.alert("🦸", "Kahramanın adını gir!");
            return;
        }

        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        setStep(step + 1);
    };

    const handleSetup = async () => {
        if (pin.length !== 4) {
            Alert.alert("🔐", "PIN 4 haneli olmalı!");
            return;
        }

        setLoading(true);
        try {
            const { family, familyCode } = await createFamily(familyName, childName);

            const parent = await createUser({
                family_id: family.id,
                name: parentName,
                role: 'parent',
                parent_type: 'mom',
                pin_hash: pin
            });

            const child = await createUser({
                family_id: family.id,
                name: childName,
                role: 'child',
                hero_class: 'knight'
            });

            const userState = {
                id: child.id,
                family_id: family.id,
                role: 'child',
                name: childName,
                xp: 0,
                level: 1,
                streak: 0,
                heroClass: 'knight',
                pin_hash: pin
            };
            await AsyncStorage.setItem('questnest_user', JSON.stringify(userState));

            Alert.alert(
                "🎉 KRALLIK KURULDU!",
                `Aile Kodun: ${familyCode}\n\nBu kodu diğer ebeveynlerle paylaş!`,
                [{ text: "MACERAYA BAŞLA!", onPress: () => navigation.replace('Main', { initialUser: userState }) }]
            );
        } catch (error: any) {
            Alert.alert("Hata", error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <View style={styles.stepIcon}>
                            <Crown color="#fbbf24" size={48} />
                        </View>
                        <Text style={styles.stepTitle}>KRALLIĞININ ADI NE OLSUN?</Text>
                        <Text style={styles.stepSub}>Aileniz için eşsiz bir isim seçin</Text>
                        <TextInput
                            style={styles.input}
                            value={familyName}
                            onChangeText={setFamilyName}
                            placeholder="Örn: Kuzey Krallığı"
                            placeholderTextColor="#64748b"
                            autoFocus
                        />
                        <GameButton onPress={handleNext} style={styles.nextBtn}>
                            DEVAM ET →
                        </GameButton>
                    </>
                );
            case 2:
                return (
                    <>
                        <View style={styles.stepIcon}>
                            <Heart color="#e11d48" size={48} />
                        </View>
                        <Text style={styles.stepTitle}>SENİN ADIN NE?</Text>
                        <Text style={styles.stepSub}>Kraliçe/Kral olarak adın</Text>
                        <TextInput
                            style={styles.input}
                            value={parentName}
                            onChangeText={setParentName}
                            placeholder="Adın..."
                            placeholderTextColor="#64748b"
                            autoFocus
                        />
                        <GameButton onPress={handleNext} style={styles.nextBtn}>
                            DEVAM ET →
                        </GameButton>
                    </>
                );
            case 3:
                return (
                    <>
                        <View style={styles.stepIcon}>
                            <Star color="#fbbf24" size={48} />
                        </View>
                        <Text style={styles.stepTitle}>KAHRAMANIN ADI NE?</Text>
                        <Text style={styles.stepSub}>Çocuğunuzun macera adı</Text>
                        <TextInput
                            style={styles.input}
                            value={childName}
                            onChangeText={setChildName}
                            placeholder="Kahraman adı..."
                            placeholderTextColor="#64748b"
                            autoFocus
                        />
                        <GameButton onPress={handleNext} style={styles.nextBtn}>
                            DEVAM ET →
                        </GameButton>
                    </>
                );
            case 4:
                return (
                    <>
                        <View style={styles.stepIcon}>
                            <Shield color="#3b82f6" size={48} />
                        </View>
                        <Text style={styles.stepTitle}>GİZLİ PIN OLUŞTUR</Text>
                        <Text style={styles.stepSub}>Ebeveyn moduna geçiş için 4 haneli kod</Text>
                        <TextInput
                            style={[styles.input, styles.pinInput]}
                            value={pin}
                            onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').substring(0, 4))}
                            placeholder="• • • •"
                            placeholderTextColor="#64748b"
                            keyboardType="number-pad"
                            secureTextEntry
                            maxLength={4}
                            autoFocus
                        />
                        <GameButton onPress={handleSetup} loading={loading} style={styles.nextBtn}>
                            <Sparkles color="#0f172a" size={20} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>KRALLIĞI KUR!</Text>
                        </GameButton>
                    </>
                );
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Progress */}
            <View style={styles.progress}>
                {[1, 2, 3, 4].map(s => (
                    <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
                ))}
            </View>

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {renderStep()}
            </Animated.View>

            {/* Summary */}
            {step > 1 && (
                <View style={styles.summary}>
                    {familyName && <Text style={styles.summaryItem}>🏰 {familyName}</Text>}
                    {parentName && <Text style={styles.summaryItem}>👑 {parentName}</Text>}
                    {childName && <Text style={styles.summaryItem}>⚔️ {childName}</Text>}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 60 },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#334155',
    },
    progressDotActive: {
        backgroundColor: '#fbbf24',
        width: 24,
    },
    content: { alignItems: 'center', flex: 1 },
    stepIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fbbf24',
        textAlign: 'center',
        letterSpacing: 1,
    },
    stepSub: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    input: {
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 18,
        color: '#fff',
        fontSize: 18,
        borderWidth: 2,
        borderColor: '#334155',
        textAlign: 'center',
    },
    pinInput: {
        fontSize: 32,
        letterSpacing: 16,
    },
    nextBtn: { marginTop: 24, width: '100%', paddingVertical: 16 },
    summary: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    summaryItem: {
        color: '#64748b',
        fontSize: 12,
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
});
