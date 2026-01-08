import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ShoppingBag, Coins, ArrowLeft } from 'lucide-react-native';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { Reward } from '../types';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

interface TreasureRoomProps {
  xp: number;
  rewards: Reward[];
  onRedeem: (reward: Reward) => void;
  onBack?: () => void; // Added optional back handler if needed by parent
}

export const TreasureRoom: React.FC<TreasureRoomProps> = ({ xp, rewards, onRedeem, onBack }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const handlePurchase = (reward: Reward) => {
    if (xp < reward.cost) {
      Alert.alert(`💰 ${i18n.t('treasure.notEnoughGold')}`, i18n.t('treasure.needMoreGold'));
      return;
    }

    Alert.alert(
      `${reward.icon} ${reward.name}`,
      `${reward.cost} ${i18n.t('common.gold')}?`,
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('treasure.buy').toUpperCase(),
          onPress: () => {
            setPurchasedId(reward.id);
            setShowConfetti(true);
            onRedeem(reward);
            Alert.alert(`🎉 ${i18n.t('treasure.rewardPurchased')}`, `${reward.name} ${i18n.t('treasure.parentNotified')}`);
            setTimeout(() => setPurchasedId(null), 2000);
          }
        }
      ]
    );
  };

  // Helper to map type/icon to visual elements if needed, though Reward object usually has them.
  // For the grid demo, use the passed rewards data but style them like the glass cards.

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#0f172a', '#1e1b4b']} // Clean dark blue gradient
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnjdaq57wWTDNwihc2IMgDi3Mp9swB3lWrGfKN4xGL-p3Rr0cNulSkoTNfRukKW7cad4CaUVZZeJkCzZV1mXvVPbSlGD4w0ppUvgU3A649QxFWDb8TgiYPFb_D3dTPXl91z19s1qAX-EC8Jh_WA2hkakfTSF0Agpw7HaRDCbThcHUTTN8Iajh1nkKp2TGmi8xWngT9eo7KOjDH_rnNghljF00qgbHHCUajhgLevtgU5MedKVFQNuNQ1oDnHh2UAqSLCt7O5lZI' }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]} // Very subtle texture
          resizeMode="cover"
        />
      </View>

      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Top App Bar */}
      <BlurView intensity={0} style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('treasure.title')}</Text>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Section: Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>{i18n.t('treasure.yourGold').toUpperCase()}</Text>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.1)', 'rgba(0,0,0,0)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{xp}</Text>
              <View style={styles.balanceType}>
                <Coins size={16} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.balanceTypeName}>{i18n.t('common.gold').toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reward Grid */}
        <View style={styles.grid}>
          {rewards.map((reward) => {
            const canAfford = xp >= reward.cost;
            const isPurchased = purchasedId === reward.id;

            return (
              <View key={reward.id} style={[styles.card, !canAfford && styles.cardDisabled]}>
                {/* Image Placeholder Area */}
                <View style={styles.cardImageContainer}>
                  {/* REMOVED THE FOGGY GRADIENT HERE */}
                  <Text style={{ fontSize: 64 }}>{reward.icon}</Text>
                  <View style={[styles.rarityBadge, { backgroundColor: canAfford ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 23, 42, 0.6)' }]}>
                    <Text style={[styles.rarityText, { color: canAfford ? '#4ade80' : '#94a3b8' }]}>{canAfford ? i18n.t('treasure.availableRewards').toUpperCase().split(' ')[0] : i18n.t('castle.locked').toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{reward.name}</Text>
                  <View style={styles.cardCost}>
                    <Coins size={18} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.cardCostText}>{reward.cost}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.redeemButton, canAfford ? styles.redeemActive : styles.redeemDisabled]}
                    onPress={() => handlePurchase(reward)}
                    disabled={!canAfford}
                  >
                    {canAfford && (
                      <LinearGradient
                        colors={['#fbbf24', '#d97706']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                      />
                    )}
                    <Text style={[styles.redeemText, canAfford ? styles.redeemTextActive : styles.redeemTextDisabled]}>
                      {canAfford ? i18n.t('treasure.buy').toUpperCase() : i18n.t('treasure.notEnoughGold').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  badgeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },

  balanceContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    overflow: 'hidden'
  },
  balanceItem: { alignItems: 'center' },
  balanceValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  balanceType: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  balanceTypeName: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 24 },



  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
  card: {
    width: (width - 48) / 2,
    backgroundColor: '#1e293b', // Solid dark slate color, no transparency, no fog
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardDisabled: { opacity: 0.6, backgroundColor: '#0f172a' }, // Darker when disabled
  cardImageContainer: {
    width: '100%',
    aspectRatio: 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a', // Darker background behind emoji for contrast
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  rarityText: { color: '#fbbf24', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardContent: { padding: 16, gap: 10 },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', textAlign: 'center', height: 44, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
  cardCost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 },
  cardCostText: { color: '#fbbf24', fontSize: 18, fontWeight: '900' },
  redeemButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)'
  },
  redeemActive: { backgroundColor: '#fbbf24' },
  redeemDisabled: { backgroundColor: '#334155', borderColor: '#475569' },
  redeemText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  redeemTextActive: { color: '#1e1b4b' },
  redeemTextDisabled: { color: '#94a3b8' },
});
