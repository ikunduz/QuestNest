/**
 * Purchase Context for HeroQuest
 * 
 * Manages in-app purchases and subscriptions via RevenueCat.
 * Provides premium status checks and purchase functions.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import i18n from '../i18n';

// ============================================
// CONFIGURATION
// ============================================

// Replace with your RevenueCat API keys
const REVENUECAT_API_KEY_ANDROID = 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const REVENUECAT_API_KEY_IOS = 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// Entitlement identifiers (set these in RevenueCat dashboard)
const ENTITLEMENT_PREMIUM = 'premium';
const ENTITLEMENT_THEME_CYBERPUNK = 'theme_cyberpunk';
const ENTITLEMENT_THEME_SPACE = 'theme_space';
const ENTITLEMENT_REMOVE_ADS = 'remove_ads';

// ============================================
// TYPES
// ============================================

interface PurchaseContextType {
    /** Whether user has premium subscription */
    isPremium: boolean;
    /** Whether ads should be shown */
    showAds: boolean;
    /** Unlocked themes */
    unlockedThemes: string[];
    /** Available packages for purchase */
    packages: PurchasesPackage[];
    /** Loading state */
    loading: boolean;
    /** Check if a specific theme is unlocked */
    hasTheme: (themeId: string) => boolean;
    /** Purchase a package */
    purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
    /** Restore purchases */
    restorePurchases: () => Promise<void>;
    /** Refresh customer info */
    refresh: () => Promise<void>;
}

const defaultContext: PurchaseContextType = {
    isPremium: false,
    showAds: true,
    unlockedThemes: ['medieval'],
    packages: [],
    loading: true,
    hasTheme: () => false,
    purchasePackage: async () => false,
    restorePurchases: async () => { },
    refresh: async () => { },
};

const PurchaseContext = createContext<PurchaseContextType>(defaultContext);

// ============================================
// PROVIDER
// ============================================

interface PurchaseProviderProps {
    children: ReactNode;
}

export const PurchaseProvider: React.FC<PurchaseProviderProps> = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [showAds, setShowAds] = useState(true);
    const [unlockedThemes, setUnlockedThemes] = useState<string[]>(['medieval']);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize RevenueCat
    useEffect(() => {
        const init = async () => {
            try {
                // Configure RevenueCat
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);

                const apiKey = Platform.OS === 'ios'
                    ? REVENUECAT_API_KEY_IOS
                    : REVENUECAT_API_KEY_ANDROID;

                await Purchases.configure({ apiKey });
                console.log('[Purchases] Configured successfully');

                // Fetch initial customer info
                await updateCustomerInfo();

                // Fetch offerings
                await fetchOfferings();

            } catch (error) {
                console.error('[Purchases] Init error:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Update customer info from RevenueCat
    const updateCustomerInfo = async () => {
        try {
            const info = await Purchases.getCustomerInfo();
            processCustomerInfo(info);
        } catch (error) {
            console.error('[Purchases] Error fetching customer info:', error);
        }
    };

    // Process customer info to update state
    const processCustomerInfo = (info: CustomerInfo) => {
        const entitlements = info.entitlements.active;

        // Check premium status
        const hasPremium = ENTITLEMENT_PREMIUM in entitlements;
        setIsPremium(hasPremium);

        // Check ad-free status
        const removeAds = ENTITLEMENT_REMOVE_ADS in entitlements || hasPremium;
        setShowAds(!removeAds);

        // Check unlocked themes
        const themes = ['medieval']; // Always unlocked
        if (hasPremium) {
            themes.push('cyberpunk', 'space');
        } else {
            if (ENTITLEMENT_THEME_CYBERPUNK in entitlements) themes.push('cyberpunk');
            if (ENTITLEMENT_THEME_SPACE in entitlements) themes.push('space');
        }
        setUnlockedThemes(themes);

        console.log('[Purchases] Updated:', { hasPremium, removeAds, themes });
    };

    // Fetch available offerings
    const fetchOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current?.availablePackages) {
                setPackages(offerings.current.availablePackages);
                console.log('[Purchases] Packages:', offerings.current.availablePackages.length);
            }
        } catch (error) {
            console.error('[Purchases] Error fetching offerings:', error);
        }
    };

    // Check if a theme is unlocked
    const hasTheme = (themeId: string): boolean => {
        return unlockedThemes.includes(themeId);
    };

    // Purchase a package
    const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
        try {
            setLoading(true);
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            processCustomerInfo(customerInfo);
            Alert.alert('✅', i18n.t('purchase.success') || 'Satın alma başarılı!');
            return true;
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error('[Purchases] Purchase error:', error);
                Alert.alert('❌', i18n.t('purchase.failed') || 'Satın alma başarısız.');
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Restore previous purchases
    const restorePurchases = async () => {
        try {
            setLoading(true);
            const info = await Purchases.restorePurchases();
            processCustomerInfo(info);

            const hasAnyPurchase = Object.keys(info.entitlements.active).length > 0;
            Alert.alert(
                hasAnyPurchase ? '✅' : 'ℹ️',
                hasAnyPurchase
                    ? (i18n.t('purchase.restored') || 'Satın almalar geri yüklendi!')
                    : (i18n.t('purchase.noPurchases') || 'Geri yüklenecek satın alma bulunamadı.')
            );
        } catch (error) {
            console.error('[Purchases] Restore error:', error);
            Alert.alert('❌', i18n.t('purchase.restoreFailed') || 'Geri yükleme başarısız.');
        } finally {
            setLoading(false);
        }
    };

    // Refresh customer info
    const refresh = async () => {
        setLoading(true);
        await updateCustomerInfo();
        await fetchOfferings();
        setLoading(false);
    };

    return (
        <PurchaseContext.Provider value={{
            isPremium,
            showAds,
            unlockedThemes,
            packages,
            loading,
            hasTheme,
            purchasePackage,
            restorePurchases,
            refresh,
        }}>
            {children}
        </PurchaseContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================

export const usePurchases = (): PurchaseContextType => {
    const context = useContext(PurchaseContext);
    if (!context) {
        throw new Error('usePurchases must be used within a PurchaseProvider');
    }
    return context;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Set user ID for RevenueCat (call when user logs in)
 */
export const setRevenueCatUserId = async (userId: string): Promise<void> => {
    try {
        await Purchases.logIn(userId);
        console.log('[Purchases] User logged in:', userId);
    } catch (error) {
        console.error('[Purchases] Login error:', error);
    }
};

/**
 * Clear user ID (call when user logs out)
 */
export const clearRevenueCatUserId = async (): Promise<void> => {
    try {
        await Purchases.logOut();
        console.log('[Purchases] User logged out');
    } catch (error) {
        console.error('[Purchases] Logout error:', error);
    }
};
