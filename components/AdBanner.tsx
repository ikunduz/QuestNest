/**
 * AdBanner Component
 * 
 * Displays a banner ad at the bottom of the screen
 * with COPPA compliance and safe area handling.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdUnitId } from '../services/adService';

interface AdBannerProps {
    /** Whether to show the ad (can be used for premium users) */
    visible?: boolean;
    /** Custom container style */
    style?: object;
}

export const AdBanner: React.FC<AdBannerProps> = ({ visible = true, style }) => {
    const insets = useSafeAreaInsets();
    const [adError, setAdError] = useState(false);
    const [adLoaded, setAdLoaded] = useState(false);

    // Don't render if not visible or if ad failed to load
    if (!visible || adError) {
        return null;
    }

    return (
        <View style={[
            styles.container,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 },
            style
        ]}>
            <BannerAd
                unitId={getAdUnitId('banner')}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true, // COPPA compliance
                    keywords: ['kids', 'family', 'games', 'education'],
                }}
                onAdLoaded={() => {
                    console.log('[AdBanner] Ad loaded');
                    setAdLoaded(true);
                }}
                onAdFailedToLoad={(error) => {
                    console.log('[AdBanner] Failed to load:', error);
                    setAdError(true);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
});
