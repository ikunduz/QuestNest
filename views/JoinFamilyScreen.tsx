import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Animated, Easing, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameButton } from '../components/GameButton';
import { Search, Users, Sparkles, Key, Shield, Crown } from 'lucide-react-native';
import { findFamilyByCode, createUser } from '../services/familyService';
import { supabase } from '../services/supabaseClient';
import i18n from '../i18n';

type JoinStep = 'code' | 'found' | 'select_role' | 'parent_pin' | 'child_name';

export const JoinFamilyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [userName, setUserName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundFamily, setFoundFamily] = useState<any>(null);
    const [step, setStep] = useState<JoinStep>('code');
    const [familyPin, setFamilyPin] = useState<string>('');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const keyRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        ]).start();

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
            Alert.alert("🔑", i18n.t('auth.enterValidCode'));
            return;
        }

        setLoading(true);
        try {
            const family = await findFamilyByCode(code);
            if (family) {
                setFoundFamily(family);

                const { data: parentUser } = await supabase
                    .from('users')
                    .select('pin_hash')
                    .eq('family_id', family.id)
                    .eq('role', 'parent')
                    .limit(1)
                    .single();

                if (parentUser?.pin_hash) {
                    setFamilyPin(parentUser.pin_hash);
                }

                setStep('select_role');
            } else {
                Alert.alert("😕", i18n.t('auth.noKingdomFound'));
            }
        } catch (e) {
            Alert.alert(i18n.t('common.error'), i18n.t('auth.errorSearching'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = (role: 'parent' | 'child') => {
        if (role === 'parent') {
            if (!familyPin) {
                Alert.alert(i18n.t('common.error'), i18n.t('auth.noParentPin'));
                return;
            }
            setStep('parent_pin');
        } else {
            setStep('child_name');
        }
    };

    const handleVerifyPin = () => {
        if (pin !== familyPin) {
            Alert.alert("❌", i18n.t('auth.wrongPinOnly'));
            setPin('');
            return;
        }
        setStep('child_name');
    };

    const handleJoinAsParent = async () => {
        if (!userName.trim()) {
            Alert.alert("👤", i18n.t('auth.pleaseEnterName'));
            return;
        }

        setLoading(true);
        try {
            const user = await createUser({
                family_id: foundFamily.id,
                name: userName.trim(),
                role: 'parent',
                parent_type: 'mom',
                pin_hash: familyPin
            });

            const userState = {
                id: user.id,
                family_id: foundFamily.id,
                role: 'parent',
                name: userName.trim(),
                xp: 0,
                level: 1,
                streak: 0,
                parent_type: 'mom',
                pin_hash: familyPin,
                familyCode: code
            };
            await AsyncStorage.setItem('questnest_user', JSON.stringify(userState));

            Alert.alert(
                `🎉 ${i18n.t('auth.welcomeBack')}`,
                `${foundFamily.name} ${i18n.t('auth.joinedAsParent')}`,
                [{ text: i18n.t('auth.startAdventure'), onPress: () => navigation.replace('Main', { initialUser: userState }) }]
            );
        } catch (error: any) {
            console.error(error);
            Alert.alert(i18n.t('common.error'), i18n.t('auth.errorJoining'));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinAsChild = async () => {
        if (!userName.trim()) {
            Alert.alert("👤", i18n.t('auth.pleaseEnterName'));
            return;
        }

        setLoading(true);
        try {
            const user = await createUser({
                family_id: foundFamily.id,
                name: userName.trim(),
                role: 'child',
                hero_class: 'knight',
                xp: 0,
                level: 1
            });

            const userState = {
                id: user.id,
                family_id: foundFamily.id,
                role: 'child',
                name: userName.trim(),
                xp: 0,
                level: 1,
                streak: 0,
                heroClass: 'knight',
                familyCode: code
            };
            await AsyncStorage.setItem('questnest_user', JSON.stringify(userState));

            Alert.alert(
                `🎉 ${i18n.t('auth.welcomeHero')}`,
                `${foundFamily.name} ${i18n.t('auth.joinedKingdom')}`,
                [{ text: i18n.t('auth.startAdventure'), onPress: () => navigation.replace('Main', { initialUser: userState }) }]
            );
        } catch (error: any) {
            console.error(error);
            Alert.alert(i18n.t('common.error'), i18n.t('auth.errorJoining'));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'code') {
            navigation.goBack();
        } else if (step === 'select_role') {
            setFoundFamily(null);
            setStep('code');
        } else if (step === 'parent_pin') {
            setPin('');
            setStep('select_role');
        } else if (step === 'child_name') {
            setUserName('');
            // If we came from PIN verification, go back to select_role
            // Otherwise we're a child, also go to select_role
            setStep('select_role');
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'code':
                return (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{i18n.t('auth.familyCode').toUpperCase()}</Text>
                            <TextInput
                                style={styles.codeInput}
                                value={code}
                                onChangeText={(v) => setCode(v.toUpperCase())}
                                placeholder="XXXXX-XXXX"
                                placeholderTextColor="#475569"
                                autoCapitalize="characters"
                                maxLength={15}
                            />
                        </View>
                        <GameButton onPress={handleSearch} loading={loading} style={styles.actionBtn}>
                            <Search color="#0f172a" size={20} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{i18n.t('auth.findKingdom')}</Text>
                        </GameButton>
                    </>
                );

            case 'select_role':
                return (
                    <>
                        <View style={styles.foundCard}>
                            <Users color="#22c55e" size={32} />
                            <Text style={styles.foundTitle}>{foundFamily?.name}</Text>
                            <Text style={styles.foundSub}>{i18n.t('auth.familyFound')} 🎉</Text>
                        </View>

                        <Text style={styles.questionText}>{i18n.t('auth.whoAreYou')}</Text>

                        <View style={styles.roleButtons}>
                            <TouchableOpacity style={styles.roleCard} onPress={() => handleSelectRole('parent')}>
                                <Crown color="#fbbf24" size={40} />
                                <Text style={styles.roleTitle}>{i18n.t('auth.iAmParent')}</Text>
                                <Text style={styles.roleDesc}>{i18n.t('auth.momOrDad')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.roleCard, styles.roleCardChild]} onPress={() => handleSelectRole('child')}>
                                <Shield color="#818cf8" size={40} />
                                <Text style={styles.roleTitle}>{i18n.t('auth.iAmChild')}</Text>
                                <Text style={styles.roleDesc}>{i18n.t('auth.youngHero')}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                );

            case 'parent_pin':
                return (
                    <>
                        <View style={styles.foundCard}>
                            <Key color="#fbbf24" size={32} />
                            <Text style={styles.foundTitle}>{i18n.t('auth.parentVerification')}</Text>
                            <Text style={styles.foundSub}>{i18n.t('auth.enterFamilyPin')}</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{i18n.t('auth.fourDigitPin')}</Text>
                            <TextInput
                                style={styles.pinInput}
                                value={pin}
                                onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').substring(0, 4))}
                                placeholder="• • • •"
                                placeholderTextColor="#475569"
                                keyboardType="number-pad"
                                secureTextEntry
                                maxLength={4}
                                autoFocus
                            />
                        </View>

                        <GameButton onPress={handleVerifyPin} loading={loading} style={styles.actionBtn}>
                            <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{i18n.t('auth.verify')}</Text>
                        </GameButton>
                    </>
                );

            case 'child_name':
                const isParentJoin = pin === familyPin && familyPin !== '';
                return (
                    <>
                        <View style={styles.foundCard}>
                            {isParentJoin ? (
                                <Crown color="#fbbf24" size={32} />
                            ) : (
                                <Shield color="#818cf8" size={32} />
                            )}
                            <Text style={styles.foundTitle}>
                                {isParentJoin ? i18n.t('auth.parentRegistration') : i18n.t('auth.heroRegistration')}
                            </Text>
                            <Text style={styles.foundSub}>{foundFamily?.name} {i18n.t('auth.joiningFamily')}</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{isParentJoin ? i18n.t('auth.yourNameLabel') : i18n.t('auth.heroNameLabel')}</Text>
                            <TextInput
                                style={styles.input}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder={isParentJoin ? i18n.t('auth.exampleMom') : i18n.t('auth.exampleName')}
                                placeholderTextColor="#475569"
                                autoFocus
                            />
                        </View>

                        <GameButton
                            onPress={isParentJoin ? handleJoinAsParent : handleJoinAsChild}
                            loading={loading}
                            style={styles.actionBtn}
                        >
                            <Sparkles color="#0f172a" size={20} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{i18n.t('auth.joinKingdomBtn')}</Text>
                        </GameButton>
                    </>
                );
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>

                {/* Icon */}
                <Animated.View style={[styles.iconContainer, { transform: [{ rotate: keyRotateInterpolate }] }]}>
                    <Key color="#fbbf24" size={48} />
                </Animated.View>

                <Text style={styles.title}>{i18n.t('auth.joinKingdom')}</Text>
                <Text style={styles.subtitle}>{i18n.t('auth.enterCodeToJoin')}</Text>

                {renderContent()}

                {/* Back Button */}
                <GameButton variant="ghost" onPress={handleBack} style={styles.backBtn}>
                    {i18n.t('auth.back')}
                </GameButton>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
    content: { alignItems: 'center' },
    iconContainer: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
        borderWidth: 2, borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    title: { fontSize: 26, fontWeight: 'bold', color: '#fbbf24', textAlign: 'center', letterSpacing: 2 },
    subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 32 },

    inputGroup: { width: '100%', marginBottom: 24 },
    label: { fontSize: 11, color: '#64748b', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    codeInput: {
        backgroundColor: '#1e293b', borderRadius: 20, padding: 18,
        color: '#fbbf24', fontSize: 24, borderWidth: 2, borderColor: '#334155',
        textAlign: 'center', fontWeight: 'bold', letterSpacing: 4,
    },
    input: {
        backgroundColor: '#1e293b', borderRadius: 20, padding: 18,
        color: '#fff', fontSize: 18, borderWidth: 2, borderColor: '#334155', textAlign: 'center',
    },
    pinInput: {
        backgroundColor: '#1e293b', borderRadius: 20, padding: 18,
        color: '#fbbf24', fontSize: 32, borderWidth: 2, borderColor: '#334155',
        textAlign: 'center', fontWeight: 'bold', letterSpacing: 12,
    },
    actionBtn: { width: '100%', paddingVertical: 16, marginBottom: 16 },

    foundCard: {
        width: '100%', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 24,
        padding: 24, alignItems: 'center', marginBottom: 24,
        borderWidth: 2, borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    foundTitle: { fontSize: 20, fontWeight: 'bold', color: '#22c55e', marginTop: 12 },
    foundSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

    questionText: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
    roleButtons: { flexDirection: 'row', gap: 16, width: '100%', marginBottom: 24 },
    roleCard: {
        flex: 1, backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 20,
        padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    roleCardChild: {
        backgroundColor: 'rgba(129, 140, 248, 0.1)', borderColor: 'rgba(129, 140, 248, 0.3)',
    },
    roleTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginTop: 12 },
    roleDesc: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

    backBtn: { marginTop: 16 },
});
