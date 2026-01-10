/**
 * AdMob Service for HeroQuest
 * 
 * Provides banner ads, interstitial ads, and rewarded video ads
 * with COPPA compliance for child-directed content.
 */

import {
    InterstitialAd,
    RewardedAd,
    BannerAd,
    BannerAdSize,
    TestIds,
    AdEventType,
    RewardedAdEventType,
} from 'react-native-google-mobile-ads';

// ============================================
// AD UNIT IDs
// ============================================

// Use test IDs in development, replace with real IDs in production
const AD_UNIT_IDS = {
    // Test IDs (safe for development)
    TEST_BANNER: TestIds.BANNER,
    TEST_INTERSTITIAL: TestIds.INTERSTITIAL,
    TEST_REWARDED: TestIds.REWARDED,

    // Production IDs (replace with your actual AdMob unit IDs)
    // Get these from: https://admob.google.com/
    PROD_BANNER: 'ca-app-pub-6963403476404310/4123044344',
    PROD_INTERSTITIAL: 'ca-app-pub-6963403476404310/9590993443',
    PROD_REWARDED: 'ca-app-pub-6963403476404310/3931472657',
};

// Use test IDs in __DEV__ mode
const IS_DEV = __DEV__;

export const getAdUnitId = (type: 'banner' | 'interstitial' | 'rewarded'): string => {
    if (IS_DEV) {
        switch (type) {
            case 'banner': return AD_UNIT_IDS.TEST_BANNER;
            case 'interstitial': return AD_UNIT_IDS.TEST_INTERSTITIAL;
            case 'rewarded': return AD_UNIT_IDS.TEST_REWARDED;
        }
    }

    switch (type) {
        case 'banner': return AD_UNIT_IDS.PROD_BANNER;
        case 'interstitial': return AD_UNIT_IDS.PROD_INTERSTITIAL;
        case 'rewarded': return AD_UNIT_IDS.PROD_REWARDED;
    }
};

// ============================================
// INTERSTITIAL AD
// ============================================

let interstitialAd: InterstitialAd | null = null;
let interstitialLoaded = false;

/**
 * Load an interstitial ad
 * Call this in advance so the ad is ready when needed
 */
export const loadInterstitialAd = (): void => {
    if (interstitialAd) return; // Already loading/loaded

    interstitialAd = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'), {
        requestNonPersonalizedAdsOnly: true, // COPPA compliance
        keywords: ['kids', 'family', 'games', 'education'],
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] Interstitial loaded');
        interstitialLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial closed');
        interstitialLoaded = false;
        interstitialAd = null;
        // Preload next interstitial
        setTimeout(loadInterstitialAd, 1000);
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('[AdMob] Interstitial error:', error);
        interstitialLoaded = false;
        interstitialAd = null;
    });

    interstitialAd.load();
};

/**
 * Show the interstitial ad if loaded
 * @returns true if ad was shown
 */
export const showInterstitialAd = async (): Promise<boolean> => {
    if (!interstitialAd || !interstitialLoaded) {
        console.log('[AdMob] Interstitial not ready');
        loadInterstitialAd(); // Try to load for next time
        return false;
    }

    try {
        await interstitialAd.show();
        return true;
    } catch (error) {
        console.log('[AdMob] Error showing interstitial:', error);
        return false;
    }
};

// ============================================
// REWARDED AD
// ============================================

let rewardedAd: RewardedAd | null = null;
let rewardedLoaded = false;

/**
 * Load a rewarded video ad
 */
export const loadRewardedAd = (): void => {
    if (rewardedAd) return;

    rewardedAd = RewardedAd.createForAdRequest(getAdUnitId('rewarded'), {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['kids', 'family', 'games', 'education'],
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('[AdMob] Rewarded ad loaded');
        rewardedLoaded = true;
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('[AdMob] User earned reward:', reward);
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Rewarded ad closed');
        rewardedLoaded = false;
        rewardedAd = null;
        setTimeout(loadRewardedAd, 1000);
    });

    rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('[AdMob] Rewarded ad error:', error);
        rewardedLoaded = false;
        rewardedAd = null;
    });

    rewardedAd.load();
};

/**
 * Show the rewarded video ad
 * @returns Promise resolving to the reward amount if earned, 0 if not
 */
export const showRewardedAd = (): Promise<number> => {
    return new Promise((resolve) => {
        if (!rewardedAd || !rewardedLoaded) {
            console.log('[AdMob] Rewarded ad not ready');
            loadRewardedAd();
            resolve(0);
            return;
        }

        // Listen for reward
        const unsubscribe = rewardedAd.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
                resolve(reward.amount || 50); // Default 50 gold
            }
        );

        // Listen for close without reward
        const closeUnsubscribe = rewardedAd.addAdEventListener(
            AdEventType.CLOSED,
            () => {
                resolve(0);
                unsubscribe();
                closeUnsubscribe();
            }
        );

        rewardedAd.show().catch(() => resolve(0));
    });
};

/**
 * Check if rewarded ad is ready to show
 */
export const isRewardedAdReady = (): boolean => {
    return rewardedLoaded;
};

// ============================================
// TRACKING & FREQUENCY
// ============================================

let adShowCount = 0;
const MAX_ADS_PER_SESSION = 10;
const INTERSTITIAL_FREQUENCY = 3; // Show every N quest approvals

/**
 * Increment and check if we should show an interstitial
 * @returns true if interstitial should be shown
 */
export const shouldShowInterstitial = (): boolean => {
    adShowCount++;

    // Don't overwhelm with ads
    if (adShowCount > MAX_ADS_PER_SESSION) return false;

    // Show every Nth time
    return adShowCount % INTERSTITIAL_FREQUENCY === 0;
};

/**
 * Reset ad counters (call on app start)
 */
export const resetAdCounters = (): void => {
    adShowCount = 0;
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize AdMob and preload ads
 * Call this on app startup
 */
export const initializeAds = async (): Promise<void> => {
    try {
        console.log('[AdMob] Initializing...');

        // Preload ads
        loadInterstitialAd();
        loadRewardedAd();

        console.log('[AdMob] Initialized successfully');
    } catch (error) {
        console.error('[AdMob] Initialization error:', error);
    }
};

// Export ad sizes for banner component
export { BannerAdSize };
