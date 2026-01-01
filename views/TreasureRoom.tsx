
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { ShoppingBag, Lock, Gift, Coins, Star, Sparkles, Crown } from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { Reward } from '../types';

interface TreasureRoomProps {
  xp: number;
  rewards: Reward[];
  onRedeem: (rewardId: string) => void;
}

export const TreasureRoom: React.FC<TreasureRoomProps> = ({ xp, rewards, onRedeem }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);

  const handlePurchase = (reward: Reward) => {
    if (xp < reward.cost) {
      Alert.alert('💰 Yetersiz XP', `Bu ödül için ${reward.cost} XP gerekiyor.`);
      return;
    }

    Alert.alert(
      `${reward.icon} ${reward.name}`,
      `Bu ödülü ${reward.cost} XP karşılığında satın almak istiyor musun?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'SATIN AL!',
          onPress: () => {
            setPurchasedId(reward.id);
            setShowConfetti(true);
            onRedeem(reward.id);
            Alert.alert('🎉 Tebrikler!', `${reward.name} satın alındı! Ebeveynine haber ver!`);
            setTimeout(() => setPurchasedId(null), 2000);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Crown color="#fbbf24" size={40} />
            <Sparkles color="#fbbf24" size={20} style={styles.sparkle1} />
            <Sparkles color="#fbbf24" size={16} style={styles.sparkle2} />
          </View>
          <Text style={styles.headerTitle}>HAZİNE ODASI</Text>
          <Text style={styles.headerSub}>Kahramanlığının meyvelerini topla!</Text>

          <View style={styles.xpBadge}>
            <Coins color="#fbbf24" size={24} />
            <Text style={styles.xpText}>{xp} XP</Text>
            <Text style={styles.xpLabel}>Hazine Puanı</Text>
          </View>
        </View>

        {/* Rewards Grid */}
        <View style={styles.grid}>
          {rewards.map((reward) => {
            const canAfford = xp >= reward.cost;
            const isPurchased = purchasedId === reward.id;

            return (
              <TouchableOpacity
                key={reward.id}
                style={[
                  styles.rewardCard,
                  !canAfford && styles.rewardCardDisabled,
                  isPurchased && styles.rewardCardPurchased,
                ]}
                onPress={() => handlePurchase(reward)}
                disabled={!canAfford}
                activeOpacity={0.7}
              >
                {/* Glow effect for affordable items */}
                {canAfford && (
                  <View style={styles.glowEffect} />
                )}

                <View style={styles.rewardHeader}>
                  <Text style={styles.rewardEmoji}>{reward.icon}</Text>
                  <View style={[styles.typeBadge, reward.type === 'real' ? styles.typeReal : styles.typeDigital]}>
                    <Star size={10} color={reward.type === 'real' ? '#fbbf24' : '#3b82f6'} />
                    <Text style={[styles.typeText, { color: reward.type === 'real' ? '#fbbf24' : '#3b82f6' }]}>
                      {reward.type === 'real' ? 'FİZİKSEL' : 'DİJİTAL'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardSubtitle}>
                  {canAfford ? '✨ Satın alınabilir!' : '🔒 Daha fazla XP kazan'}
                </Text>

                <View style={styles.rewardFooter}>
                  <View style={styles.costBox}>
                    <Coins color="#fbbf24" size={16} />
                    <Text style={styles.costText}>{reward.cost}</Text>
                  </View>

                  <View style={[styles.buyBtn, canAfford ? styles.buyBtnActive : styles.buyBtnDisabled]}>
                    <Text style={[styles.buyBtnText, canAfford && styles.buyBtnTextActive]}>
                      {canAfford ? 'AL' : <Lock size={14} color="#64748b" />}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 16, paddingBottom: 100 },
  header: {
    backgroundColor: '#1e1b4b',
    padding: 32,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkle1: { position: 'absolute', top: 5, right: 5 },
  sparkle2: { position: 'absolute', bottom: 10, left: 5 },
  headerTitle: { fontSize: 28, color: '#fbbf24', fontWeight: 'bold', letterSpacing: 2 },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginTop: 20,
    gap: 8,
  },
  xpText: { fontSize: 24, color: '#fbbf24', fontWeight: 'bold' },
  xpLabel: { fontSize: 10, color: '#94a3b8', marginLeft: 4 },
  grid: { gap: 16 },
  rewardCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  rewardCardDisabled: {
    opacity: 0.5,
    borderColor: '#1e293b',
  },
  rewardCardPurchased: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#fbbf24',
    opacity: 0.5,
  },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  rewardEmoji: { fontSize: 48 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeReal: { backgroundColor: 'rgba(251, 191, 36, 0.2)' },
  typeDigital: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  typeText: { fontSize: 9, fontWeight: 'bold' },
  rewardName: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  rewardSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  rewardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  costText: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold' },
  buyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  buyBtnActive: { backgroundColor: '#fbbf24' },
  buyBtnDisabled: { backgroundColor: '#334155' },
  buyBtnText: { fontWeight: 'bold', fontSize: 14, color: '#64748b' },
  buyBtnTextActive: { color: '#0f172a' },
});
