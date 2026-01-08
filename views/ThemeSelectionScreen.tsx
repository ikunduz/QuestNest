import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, Switch, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, CheckCircle, Lock, Music, Volume2, Bell, ChevronRight, Check } from 'lucide-react-native';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

// Mock Data for Themes based on HTML
const getRealms = () => [
    {
        id: 'cyberpunk',
        name: i18n.t('realms.cyberpunkCity'),
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5lZbTZ62TLIHdG7jcirftmX5m98TkiGMjTO_t68MOZGBbsA1HO36agMSO0xyqWNXS-vJUA6eOclkc18fSC0v5FIzOPxGlNN4tsQwj8JqzUWwwReyEUcaekbht6hx8p_8NjKBlrUm5flHzEKf4WAGmo671e8wop0ul1O7EJxJq7DfPN_5Ssw8pEEx5OtSFbg3DR_4-nfzyqoSuOGPuhCixTg9PzeBQ8F4z4Pxr8QeOq-qy0l4fzT1EJk72qFWscqyaXukXZ3Or',
        locked: true,
        accent: '#22d3ee' // cyan-400
    },
    {
        id: 'medieval',
        name: i18n.t('realms.medievalKingdom'),
        subtext: i18n.t('realms.standardWorld'),
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrpaooWu-kvky21Y4Q9WW-ucCgZWwgV1L1xYJrB0lnWYl2VTqZ3C1ZsDlkDaVtaGEcElYQFT-VIXtUlFk6vZ_-c5bHSrwax3oJFewtelME7S0qc_cILMdVg_wFB3-yzBLuclyaig3B1blVq-E6hV0rMQ_vY49wIbH5HnfWKelSpKbEhoF8HZPSpPVRhVPyxOagazuytNOvmljlaEVN8iZg6p95h_dJsBlpDIl5Q6xDcocCoFKgprg8mrPjANyvSCW5NLPWKYpv',
        locked: false,
        active: true,
        accent: '#fbbd23' // primary
    },
    {
        id: 'space',
        name: i18n.t('realms.spaceExplorer'),
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS5Xev2N3AJBm4YpvQlLAcAcJOenv3DPwapftT7e4OpZ8o1BrwJdTvpifJf4EEjInHY_XKYkTbmYnSTqYWjvx8RVIAoehZy_w6G9UHvoPSbP_uaj9q2seYqiNx4a4abAOaY-cEpPLJX2NkdKBQj_NiYPmwf0_-RHnoe_KBczc6nShno681yuaFSob7R_Yd9Dg7KGIoz0OP7eG1DT0a4u_59G-4OAi2vdMxsyTafIP5ByherRJ__45U76ZPIZI1ZYIsSuObYqmK',
        locked: true,
        accent: '#c084fc' // purple-400
    }
];

interface ThemeSelectionScreenProps {
    onBack?: () => void;
    onThemeSelected?: (themeId: string) => void;
}

// Custom Toggle Switch Component
const CustomToggle = ({ value, onValueChange, activeColor = '#fbbd23' }: { value: boolean, onValueChange: (v: boolean) => void, activeColor?: string }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onValueChange(!value)}
            style={[
                styles.toggleTrack,
                value ? { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(251, 189, 35, 0.3)' } : { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)' }
            ]}
        >
            <View style={[
                styles.toggleThumb,
                value ? {
                    transform: [{ translateX: 24 }],
                    backgroundColor: activeColor,
                    borderColor: activeColor,
                    shadowColor: activeColor,
                    shadowOpacity: 0.5,
                    shadowRadius: 10
                } : {
                    transform: [{ translateX: 0 }],
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderColor: 'rgba(255,255,255,0.2)'
                }
            ]}>
                {value && <View style={styles.toggleDotActive} />}
            </View>
        </TouchableOpacity>
    );
};

export const ThemeSelectionScreen: React.FC<ThemeSelectionScreenProps> = ({ onBack, onThemeSelected }) => {
    const [selectedTheme, setSelectedTheme] = useState('medieval');
    const [settings, setSettings] = useState({
        music: true,
        soundFx: true,
        notifications: false
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View style={styles.container}>
            {/* Main Background */}
            <View style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, backgroundColor: '#f8f7f5' }} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#231d0f' }]} />
            </View>

            {/* Ambient Glows */}
            <View style={styles.ambientGlows} pointerEvents="none">
                <View style={styles.glowTopRight} />
                <View style={styles.glowBottomLeft} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{i18n.t('realms.worldSelect')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Headline */}
                <View style={styles.headlineContainer}>
                    <Text style={styles.headlineText}>
                        {i18n.t('realms.chooseYourWorld')}{'\n'}
                        <Text style={{ color: '#fbbd23' }}>{i18n.t('realms.world')}</Text>
                    </Text>
                </View>

                {/* Carousel */}
                <View style={styles.carouselContainer}>
                    {/* Fade Masks */}
                    <LinearGradient colors={['#231d0f', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fadeLeft} pointerEvents="none" />
                    <LinearGradient colors={['transparent', '#231d0f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fadeRight} pointerEvents="none" />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent} snapToInterval={260 + 24} decelerationRate="fast">
                        {getRealms().map((realm: any) => {
                            const isSelected = selectedTheme === realm.id;
                            const isLocked = realm.locked && realm.id !== 'medieval'; // Quick fix to ensure at least one is unlocked as per html active state

                            return (
                                <TouchableOpacity
                                    key={realm.id}
                                    style={[styles.cardWrapper, isSelected ? styles.cardActive : styles.cardInactive]}
                                    onPress={() => !isLocked && setSelectedTheme(realm.id)}
                                    activeOpacity={0.9}
                                >
                                    {isSelected && (
                                        <View style={styles.activeBadgeContainer}>
                                            <View style={styles.activeBadge}>
                                                <Check size={14} color="#231d0f" strokeWidth={3} />
                                                <Text style={styles.activeBadgeText}>{i18n.t('realms.active')}</Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={[styles.cardFrame, isSelected ? { borderColor: '#fbbd23', borderWidth: 4, shadowColor: '#fbbd23', shadowRadius: 10, shadowOpacity: 0.5 } : { borderColor: 'rgba(255,255,255,0.1)', borderWidth: 2 }]}>
                                        <Image source={{ uri: realm.image }} style={styles.cardImage} resizeMode="cover" />
                                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                                        <LinearGradient colors={['rgba(0,0,0,0.9)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0.5 }} />

                                        <View style={styles.cardContent}>
                                            <Text style={styles.cardTitle}>{realm.name}</Text>
                                            {isLocked ? (
                                                <View style={styles.lockedTag}>
                                                    <Lock size={14} color={realm.accent} />
                                                    <Text style={[styles.lockedText, { color: realm.accent }]}>{i18n.t('realms.locked')}</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.cardSubtext}>{realm.subtext}</Text>
                                            )}
                                        </View>
                                    </View>

                                    {isSelected && <View style={styles.activeReflection} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>{i18n.t('realms.sensorySettings')}</Text>

                    <BlurView intensity={20} tint="light" style={styles.settingsPanel}>
                        {/* Music */}
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIcon}>
                                    <Music size={20} color="#fbbd23" />
                                </View>
                                <View>
                                    <Text style={styles.settingLabel}>{i18n.t('realms.backgroundMusic')}</Text>
                                    <Text style={styles.settingSub}>{i18n.t('realms.immersiveMusic')}</Text>
                                </View>
                            </View>
                            <CustomToggle value={settings.music} onValueChange={() => toggleSetting('music')} />
                        </View>

                        {/* Sound FX */}
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIcon}>
                                    <Volume2 size={20} color="#fbbd23" />
                                </View>
                                <View>
                                    <Text style={styles.settingLabel}>{i18n.t('realms.soundEffects')}</Text>
                                    <Text style={styles.settingSub}>{i18n.t('realms.buttonSounds')}</Text>
                                </View>
                            </View>
                            <CustomToggle value={settings.soundFx} onValueChange={() => toggleSetting('soundFx')} />
                        </View>

                        {/* Notifications */}
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIcon}>
                                    <Bell size={20} color="rgba(255,255,255,0.4)" />
                                </View>
                                <View>
                                    <Text style={[styles.settingLabel, { color: 'rgba(255,255,255,0.6)' }]}>{i18n.t('realms.questAlerts')}</Text>
                                    <Text style={[styles.settingSub, { color: 'rgba(255,255,255,0.3)' }]}>{i18n.t('realms.dailyReminders')}</Text>
                                </View>
                            </View>
                            <CustomToggle value={settings.notifications} onValueChange={() => toggleSetting('notifications')} />
                        </View>
                    </BlurView>
                </View>

                {/* Bottom Action */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.enterBtn} onPress={() => onThemeSelected && onThemeSelected(selectedTheme)}>
                        <Text style={styles.enterBtnText}>{i18n.t('realms.enterWorld')}</Text>
                        <ChevronRight size={24} color="#231d0f" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#231d0f' },

    ambientGlows: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    glowTopRight: { position: 'absolute', top: '-10%', right: '-20%', width: 400, height: 400, backgroundColor: 'rgba(251, 189, 35, 0.1)', borderRadius: 200 },
    glowBottomLeft: { position: 'absolute', bottom: '-10%', left: '-20%', width: 300, height: 300, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: 150 },

    header: { padding: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },

    headlineContainer: { paddingHorizontal: 24, paddingBottom: 16 },
    headlineText: { fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 40 },

    carouselContainer: { marginVertical: 16, height: 360 },
    fadeLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 32, zIndex: 10 },
    fadeRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, zIndex: 10 },
    carouselContent: { paddingHorizontal: 24, gap: 24, alignItems: 'center' },

    cardWrapper: { alignItems: 'center', justifyContent: 'center' },
    cardActive: { width: 260, height: 340, zIndex: 10 },
    cardInactive: { width: 240, height: 320, opacity: 0.6, transform: [{ scale: 0.95 }] },

    cardFrame: { width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
    cardImage: { width: '100%', height: '100%' },
    cardContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    cardSubtext: { color: 'rgba(251, 189, 35, 0.9)', fontSize: 14, fontWeight: '500' },

    lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    lockedText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    activeBadgeContainer: { position: 'absolute', top: -12, right: -12, zIndex: 20 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fbbd23', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 2, borderColor: '#231d0f', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 },
    activeBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#231d0f', letterSpacing: 0.5 },
    activeReflection: { width: '80%', height: 16, backgroundColor: 'rgba(251, 189, 35, 0.2)', borderRadius: 100, marginTop: -8, alignSelf: 'center', zIndex: -1 },

    settingsSection: { paddingHorizontal: 24, marginTop: 24, flex: 1 },
    sectionTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
    settingsPanel: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, gap: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },

    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    settingLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    settingSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

    toggleTrack: { width: 56, height: 32, borderRadius: 16, borderWidth: 1, padding: 2, justifyContent: 'center' },
    toggleThumb: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    toggleDotActive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#231d0f' },

    actionContainer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 32 },
    enterBtn: { backgroundColor: '#fbbd23', borderRadius: 100, height: 64, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#fbbd23', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    enterBtnText: { fontSize: 18, fontWeight: '900', color: '#231d0f' }
});
