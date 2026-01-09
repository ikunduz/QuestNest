/**
 * Paywall Screen
 * 
 * Beautiful premium subscription screen with plan comparison,
 * feature highlights, and purchase buttons.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    Crown,
    Check,
    X,
    Sparkles,
    Shield,
    Zap,
    Users,
    MessageCircle,
    Palette,
    Star,
    ArrowLeft,
    RefreshCw,
} from 'lucide-react-native';
import { usePurchases } from '../contexts/PurchaseContext';
import { PurchasesPackage } from 'react-native-purchases';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

interface PaywallScreenProps {
    onClose: () => void;
}

// Feature comparison data
const FEATURES = [
    { icon: Users, label: 'Çocuk Profili', free: '1', premium: '5' },
    { icon: Zap, label: 'Aktif Görev', free: '10', premium: '∞' },
    { icon: Palette, label: 'Temalar', free: '1', premium: '3+' },
    { icon: MessageCircle, label: 'Mesaj Limiti', free: '30', premium: '∞' },
    { icon: Shield, label: 'Reklamsız', free: false, premium: true },
    { icon: Star, label: 'Özel Rozetler', free: '5', premium: '15+' },
];

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onClose }) => {
    const { packages, loading, purchasePackage, restorePurchases } = usePurchases();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [purchasing, setPurchasing] = useState(false);

    // Find monthly and annual packages
    const monthlyPackage = packages.find(p => p.packageType === 'MONTHLY');
    const annualPackage = packages.find(p => p.packageType === 'ANNUAL');

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        setPurchasing(true);
        const success = await purchasePackage(selectedPackage);
        setPurchasing(false);

        if (success) {
            onClose();
        }
    };

    const formatPrice = (pkg: PurchasesPackage | undefined): string => {
        if (!pkg) return '---';
        return pkg.product.priceString;
    };

    const getMonthlyPrice = (pkg: PurchasesPackage | undefined): string => {
        if (!pkg) return '---';
        if (pkg.packageType === 'ANNUAL') {
            const monthlyPrice = pkg.product.price / 12;
            return `₺${monthlyPrice.toFixed(2)}/ay`;
        }
        return `${pkg.product.priceString}/ay`;
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#0f172a']}
                style={StyleSheet.absoluteFill}
            />

            {/* Ambient Glow */}
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.restoreBtn} onPress={restorePurchases}>
                    <RefreshCw size={18} color="#94a3b8" />
                    <Text style={styles.restoreText}>Geri Yükle</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.crownContainer}>
                        <LinearGradient
                            colors={['#fbbf24', '#f59e0b']}
                            style={styles.crownBg}
                        >
                            <Crown size={48} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.heroTitle}>Premium Aile</Text>
                    <Text style={styles.heroSubtitle}>
                        Tüm özelliklerin kilidini aç ve{'\n'}maceraya tam güç devam et!
                    </Text>
                </View>

                {/* Plan Cards */}
                <View style={styles.plansContainer}>
                    {/* Annual Plan - Best Value */}
                    {annualPackage && (
                        <TouchableOpacity
                            style={[
                                styles.planCard,
                                selectedPackage === annualPackage && styles.planCardSelected
                            ]}
                            onPress={() => setSelectedPackage(annualPackage)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.bestValueBadge}>
                                <Sparkles size={12} color="#000" />
                                <Text style={styles.bestValueText}>EN İYİ DEĞER</Text>
                            </View>
                            <BlurView intensity={20} tint="light" style={styles.planCardInner}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.planTitle}>Yıllık</Text>
                                    <View style={styles.savingsBadge}>
                                        <Text style={styles.savingsText}>%33 Tasarruf</Text>
                                    </View>
                                </View>
                                <Text style={styles.planPrice}>{formatPrice(annualPackage)}</Text>
                                <Text style={styles.planMonthly}>{getMonthlyPrice(annualPackage)}</Text>
                                <View style={styles.checkRow}>
                                    <Check size={16} color="#4ade80" />
                                    <Text style={styles.checkText}>7 gün ücretsiz dene</Text>
                                </View>
                            </BlurView>
                        </TouchableOpacity>
                    )}

                    {/* Monthly Plan */}
                    {monthlyPackage && (
                        <TouchableOpacity
                            style={[
                                styles.planCard,
                                styles.planCardSmall,
                                selectedPackage === monthlyPackage && styles.planCardSelected
                            ]}
                            onPress={() => setSelectedPackage(monthlyPackage)}
                            activeOpacity={0.8}
                        >
                            <BlurView intensity={20} tint="light" style={styles.planCardInner}>
                                <Text style={styles.planTitle}>Aylık</Text>
                                <Text style={styles.planPrice}>{formatPrice(monthlyPackage)}</Text>
                                <Text style={styles.planMonthly}>her ay</Text>
                            </BlurView>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Feature Comparison */}
                <View style={styles.comparisonSection}>
                    <Text style={styles.sectionTitle}>Özellik Karşılaştırması</Text>

                    <BlurView intensity={15} tint="light" style={styles.comparisonCard}>
                        {/* Header Row */}
                        <View style={styles.comparisonHeader}>
                            <Text style={styles.comparisonLabel}></Text>
                            <Text style={styles.comparisonFree}>Free</Text>
                            <Text style={styles.comparisonPremium}>Premium</Text>
                        </View>

                        {/* Feature Rows */}
                        {FEATURES.map((feature, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.featureRow,
                                    index === FEATURES.length - 1 && { borderBottomWidth: 0 }
                                ]}
                            >
                                <View style={styles.featureLabel}>
                                    <feature.icon size={16} color="#94a3b8" />
                                    <Text style={styles.featureLabelText}>{feature.label}</Text>
                                </View>
                                <View style={styles.featureValue}>
                                    {typeof feature.free === 'boolean' ? (
                                        feature.free ?
                                            <Check size={18} color="#4ade80" /> :
                                            <X size={18} color="#ef4444" />
                                    ) : (
                                        <Text style={styles.featureFreeText}>{feature.free}</Text>
                                    )}
                                </View>
                                <View style={styles.featureValue}>
                                    {typeof feature.premium === 'boolean' ? (
                                        feature.premium ?
                                            <Check size={18} color="#4ade80" /> :
                                            <X size={18} color="#ef4444" />
                                    ) : (
                                        <Text style={styles.featurePremiumText}>{feature.premium}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </BlurView>
                </View>

                {/* Social Proof */}
                <View style={styles.socialProof}>
                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />
                        ))}
                    </View>
                    <Text style={styles.socialText}>10,000+ mutlu aile</Text>
                </View>

                {/* Terms */}
                <Text style={styles.terms}>
                    Abonelik otomatik yenilenir. İstediğiniz zaman iptal edebilirsiniz.
                </Text>
            </ScrollView>

            {/* Purchase Button */}
            <View style={styles.purchaseContainer}>
                <TouchableOpacity
                    style={[
                        styles.purchaseBtn,
                        !selectedPackage && styles.purchaseBtnDisabled
                    ]}
                    onPress={handlePurchase}
                    disabled={!selectedPackage || purchasing}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={selectedPackage ? ['#fbbf24', '#f59e0b'] : ['#475569', '#64748b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.purchaseBtnGradient}
                    >
                        {purchasing ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Crown size={24} color="#000" />
                                <Text style={styles.purchaseBtnText}>
                                    {selectedPackage ? 'Premium\'a Geç' : 'Bir Plan Seçin'}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },

    glowTop: {
        position: 'absolute',
        top: -100,
        left: '50%',
        marginLeft: -200,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
    },
    glowBottom: {
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    restoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    restoreText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

    content: { paddingHorizontal: 20, paddingBottom: 120 },

    heroSection: { alignItems: 'center', marginBottom: 32 },
    crownContainer: { marginBottom: 16 },
    crownBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fbbf24',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 24,
    },

    plansContainer: { gap: 16, marginBottom: 32 },
    planCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    planCardSmall: {},
    planCardSelected: {
        borderColor: '#fbbf24',
        shadowColor: '#fbbf24',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    planCardInner: {
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -1,
        right: 20,
        backgroundColor: '#fbbf24',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 10,
    },
    bestValueText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    planTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    savingsBadge: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    savingsText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold' },
    planPrice: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 4 },
    planMonthly: { color: '#94a3b8', fontSize: 14, marginBottom: 12 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkText: { color: '#4ade80', fontSize: 14, fontWeight: '600' },

    comparisonSection: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    comparisonCard: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    comparisonHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    comparisonLabel: { flex: 1 },
    comparisonFree: { width: 60, textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
    comparisonPremium: { width: 70, textAlign: 'center', color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    featureLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureLabelText: { color: '#fff', fontSize: 14 },
    featureValue: { width: 60, alignItems: 'center' },
    featureFreeText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    featurePremiumText: { color: '#fbbf24', fontSize: 14, fontWeight: 'bold' },

    socialProof: { alignItems: 'center', marginBottom: 16 },
    stars: { flexDirection: 'row', gap: 2, marginBottom: 4 },
    socialText: { color: '#94a3b8', fontSize: 13 },

    terms: {
        color: '#64748b',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },

    purchaseContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 36,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
    },
    purchaseBtn: { borderRadius: 20, overflow: 'hidden' },
    purchaseBtnDisabled: { opacity: 0.6 },
    purchaseBtnGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 18,
    },
    purchaseBtnText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
});
