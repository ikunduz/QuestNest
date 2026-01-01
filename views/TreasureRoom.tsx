
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ShoppingBag, Lock, Gift, Coins } from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { Reward } from '../types';

interface TreasureRoomProps {
  xp: number;
  rewards: Reward[];
  onRedeem: (rewardId: string) => void;
}

export const TreasureRoom: React.FC<TreasureRoomProps> = ({ xp, rewards, onRedeem }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ShoppingBag color="#fbbf24" size={48} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>HAZİNE ODASI</Text>
        <View style={styles.xpBadge}>
          <Coins color="#fbbf24" size={20} />
          <Text style={styles.xpText}>{xp}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {rewards.map((reward) => {
          const canAfford = xp >= reward.cost;
          return (
            <View
              key={reward.id}
              style={[
                styles.rewardCard,
                !canAfford && styles.rewardCardDisabled
              ]}
            >
              <View style={styles.rewardHeader}>
                <Text style={styles.rewardEmoji}>{reward.icon}</Text>
                <View style={[styles.typeBadge, reward.type === 'real' ? styles.typeReal : styles.typeDigital]}>
                  <Text style={styles.typeText}>
                    {reward.type === 'real' ? 'FİZİKSEL' : 'DİJİTAL'}
                  </Text>
                </View>
              </View>

              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardSubtitle}>Sadece krallığın en sadık muhafızları için.</Text>

              <View style={styles.rewardFooter}>
                <View style={styles.costBox}>
                  <Coins color="#fbbf24" size={14} />
                  <Text style={styles.costText}>{reward.cost}</Text>
                </View>

                <GameButton
                  disabled={!canAfford}
                  variant={canAfford ? 'primary' : 'ghost'}
                  onPress={() => onRedeem(reward.id)}
                  style={styles.buyBtn}
                >
                  {canAfford ? 'SATIN AL' : 'KİLİTLİ'}
                </GameButton>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  header: {
    backgroundColor: '#1e1b4b',
    padding: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: { marginBottom: 8 },
  headerTitle: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 12 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  xpText: { fontSize: 20, color: '#fbbf24', fontWeight: 'bold', marginLeft: 8 },
  grid: { gap: 16 },
  rewardCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
  },
  rewardCardDisabled: {
    opacity: 0.6,
    borderColor: '#1e293b',
  },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  rewardEmoji: { fontSize: 40 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeReal: { backgroundColor: 'rgba(251, 191, 36, 0.2)' },
  typeDigital: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  typeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  rewardName: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  rewardSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  rewardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costBox: { flexDirection: 'row', alignItems: 'center' },
  costText: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
  buyBtn: { paddingHorizontal: 16, paddingVertical: 8 },
});
