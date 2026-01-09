import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Animated, Easing, KeyboardAvoidingView, Platform, Dimensions, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Crown, User, Shield, Key, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { createFamily, createUser } from '../services/familyService';
import { hashPin, sanitizeName, validatePin } from '../services/securityUtils';
import i18n from '../i18n';

const { width, height } = Dimensions.get('window');

const THEME_COLOR = '#fbbd23'; // Gold

export const FamilySetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [familyName, setFamilyName] = useState('');
    const [parentName, setParentName] = useState('');
    const [childName, setChildName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const progressAnim = useRef(new Animated.Value(0.25)).current;

    useEffect(() => {
        // Reset and trigger animation on step change
        fadeAnim.setValue(0);
        slideAnim.setValue(20);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
            }),
            Animated.timing(progressAnim, {
                toValue: step * 0.25,
                duration: 400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false // Width doesn't support native driver
            })
        ]).start();
    }, [step]);

    const handleNext = () => {
        if (step === 1 && !familyName.trim()) {
            Alert.alert("🏰", i18n.t('auth.everyKingdomNeedsName'));
            return;
        }
        if (step === 2 && !childName.trim()) {
            Alert.alert("⚔️", i18n.t('auth.identifyHero'));
            return;
        }

        setStep(step + 1);
    };

    const handleSetup = async () => {
        if (!validatePin(pin)) {
            Alert.alert("🔐", i18n.t('auth.pinMustBe4'));
            return;
        }

        setLoading(true);
        try {
            // Sanitize inputs
            const sanitizedFamilyName = sanitizeName(familyName);
            const sanitizedChildName = sanitizeName(childName);

            // Hash the PIN before storing
            const hashedPin = await hashPin(pin);

            const { family, familyCode } = await createFamily(sanitizedFamilyName, sanitizedChildName);

            const parent = await createUser({
                family_id: family.id,
                name: i18n.t('auth.guildMaster'),
                role: 'parent',
                parent_type: 'mom',
                pin_hash: hashedPin  // Store hashed PIN, not plain text
            });

            const child = await createUser({
                family_id: family.id,
                name: sanitizedChildName,
                role: 'child',
                hero_class: 'knight',
                xp: 0,
                level: 1
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
                pin_hash: hashedPin,  // Store hashed PIN, not plain!
                familyCode: familyCode // Persist the code for easier retrieval
            };
            await AsyncStorage.setItem('questnest_user', JSON.stringify(userState));

            Alert.alert(
                `🎉 ${i18n.t('auth.kingdomCreated')}`,
                `${i18n.t('auth.yourFamilyCode')} ${familyCode}\n\n${i18n.t('auth.shareWithFamily')}`,
                [{ text: i18n.t('auth.enterWorld'), onPress: () => navigation.replace('Main', { initialUser: userState }) }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return {
                    icon: <Crown color={THEME_COLOR} size={48} />,
                    title: i18n.t('auth.nameYourKingdom'),
                    subtitle: i18n.t('auth.whatToCallHome'),
                    placeholder: i18n.t('auth.exampleKingdom'),
                    value: familyName,
                    setValue: setFamilyName,
                    secure: false,
                    keyboard: 'default' as const
                };
            case 2:
                return {
                    icon: <Shield color="#3b82f6" size={48} />,
                    title: i18n.t('auth.youngHeroName'),
                    subtitle: i18n.t('auth.whoJoinsFirst'),
                    placeholder: i18n.t('auth.heroName'),
                    value: childName,
                    setValue: setChildName,
                    secure: false,
                    keyboard: 'default' as const
                };
            case 3:
                return {
                    icon: <Key color="#10b981" size={48} />,
                    title: i18n.t('auth.secretSeal'),
                    subtitle: i18n.t('auth.createPinForParent'),
                    placeholder: i18n.t('auth.pinPlaceholder'),
                    value: pin,
                    setValue: (v: string) => setPin(v.replace(/[^0-9]/g, '').substring(0, 4)),
                    secure: true,
                    keyboard: 'number-pad' as const
                };
            default:
                return null;
        }
    };

    const content = renderStepContent();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* Background Image */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrpaooWu-kvky21Y4Q9WW-ucCgZWwgV1L1xYJrB0lnWYl2VTqZ3C1ZsDlkDaVtaGEcElYQFT-VIXtUlFk6vZ_-c5bHSrwax3oJFewtelME7S0qc_cILMdVg_wFB3-yzBLuclyaig3B1blVq-E6hV0rMQ_vY49wIbH5HnfWKelSpKbEhoF8HZPSpPVRhVPyxOagazuytNOvmljlaEVN8iZg6p95h_dJsBlpDIl5Q6xDcocCoFKgprg8mrPjANyvSCW5NLPWKYpv' }} // Reusing castle bg for consistency, ideally a hall interior
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.6 }]}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(35, 29, 15, 0.95)', 'rgba(35, 29, 15, 0.8)', 'rgba(35, 29, 15, 0.95)']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Content Container */}
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { flex: progressAnim }]} />
                    </View>
                    <View style={styles.stepsRow}>
                        {[1, 2, 3].map((s) => (
                            <View
                                key={s}
                                style={[
                                    styles.stepDot,
                                    step >= s ? styles.stepDotActive : styles.stepDotInactive,
                                    step === s && styles.stepDotCurrent
                                ]}
                            >
                                {step > s ? <CheckCircle2 size={12} color="#000" /> : <Text style={styles.stepNumber}>{s}</Text>}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Main Card */}
                {content && (
                    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <BlurView intensity={20} tint="light" style={styles.cardGlass}>

                            <View style={styles.iconContainer}>
                                <View style={styles.iconRing}>
                                    {content.icon}
                                </View>
                                {step === 3 && <Sparkles size={24} color={THEME_COLOR} style={styles.sparkleIcon} />}
                            </View>

                            <Text style={styles.title}>{content.title}</Text>
                            <Text style={styles.subtitle}>{content.subtitle}</Text>

                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        content.secure && styles.inputPin
                                    ]}
                                    value={content.value}
                                    onChangeText={content.setValue}
                                    placeholder={content.placeholder}
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    secureTextEntry={content.secure}
                                    keyboardType={content.keyboard}
                                    autoFocus
                                    maxLength={content.secure ? 4 : 30}
                                />
                                {/* Bottom Border Glow */}
                                <LinearGradient
                                    colors={['transparent', THEME_COLOR, 'transparent']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.inputBorder}
                                />
                            </View>

                            {/* Summary Chips for previous steps */}
                            <View style={styles.summaryContainer}>
                                {step > 1 && <View style={styles.chip}><Crown size={10} color="#fff" /><Text style={styles.chipText}>{familyName}</Text></View>}
                                {step > 2 && <View style={styles.chip}><User size={10} color="#fff" /><Text style={styles.chipText}>{parentName}</Text></View>}
                                {step > 3 && <View style={styles.chip}><Shield size={10} color="#fff" /><Text style={styles.chipText}>{childName}</Text></View>}
                            </View>

                        </BlurView>
                    </Animated.View>
                )}

                {/* Action Button */}
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={step === 4 ? handleSetup : handleNext}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[THEME_COLOR, '#eeb11b']}
                        style={styles.actionBtnGradient}
                    >
                        {loading ? (
                            <Text style={styles.actionBtnText}>{i18n.t('auth.settingUp')}</Text>
                        ) : (
                            <>
                                <Text style={styles.actionBtnText}>
                                    {step === 4 ? i18n.t('auth.setupKingdom') : i18n.t('auth.continue')}
                                </Text>
                                <ArrowRight size={20} color="#231d0f" strokeWidth={3} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#231d0f' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60 },

    progressContainer: { marginBottom: 40 },
    progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', position: 'absolute', top: 12, left: 12, right: 12, zIndex: 0 },
    progressFill: { backgroundColor: THEME_COLOR, height: '100%' },
    stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stepDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, zIndex: 1 },
    stepDotInactive: { backgroundColor: '#231d0f', borderColor: 'rgba(255,255,255,0.2)' },
    stepDotActive: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
    stepDotCurrent: { transform: [{ scale: 1.2 }], borderColor: '#fff' },
    stepNumber: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' },

    cardContainer: { width: '100%', alignItems: 'center', marginBottom: 32 },
    cardGlass: {
        width: '100%',
        borderRadius: 32,
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        overflow: 'hidden'
    },

    iconContainer: { marginBottom: 24 },
    iconRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(251, 189, 35, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(251, 189, 35, 0.3)',
        shadowColor: THEME_COLOR,
        shadowOpacity: 0.3,
        shadowRadius: 20
    },
    sparkleIcon: { position: 'absolute', top: 0, right: 0 },

    title: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
    subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 40 },

    inputWrapper: { width: '100%', position: 'relative', marginBottom: 24 },
    input: {
        width: '100%',
        fontSize: 20,
        color: '#fff',
        textAlign: 'center',
        paddingVertical: 12,
        fontWeight: '600'
    },
    inputPin: { fontSize: 32, letterSpacing: 12 },
    inputBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.8 },

    summaryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100
    },
    chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold' },

    actionBtn: { width: '100%', height: 64, borderRadius: 20, shadowColor: THEME_COLOR, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
    actionBtnGradient: { flex: 1, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
    actionBtnText: { color: '#231d0f', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});
