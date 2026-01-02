import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ShoppingBag, Lock, Coins, Star, ArrowLeft, Ticket, Shirt, Gamepad2, Utensils, Diamond, Gem } from 'lucide-react-native';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { Reward } from '../types';

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
      Alert.alert('💰 Yetersiz Altın', `Bu ödül için ${reward.cost} Altın gerekiyor.`);
      return;
    }

    Alert.alert(
      `${reward.icon} ${reward.name}`,
      `Bu ödülü ${reward.cost} Altın karşılığında almak istiyor musun?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'SATIN AL!',
          onPress: () => {
            setPurchasedId(reward.id);
            setShowConfetti(true);
            onRedeem(reward);
            Alert.alert('🎉 Harika!', `${reward.name} senin oldu!`);
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
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnjdaq57wWTDNwihc2IMgDi3Mp9swB3lWrGfKN4xGL-p3Rr0cNulSkoTNfRukKW7cad4CaUVZZeJkCzZV1mXvVPbSlGD4w0ppUvgU3A649QxFWDb8TgiYPFb_D3dTPXl91z19s1qAX-EC8Jh_WA2hkakfTSF0Agpw7HaRDCbThcHUTTN8Iajh1nkKp2TGmi8xWngT9eo7KOjDH_rnNghljF00qgbHHCUajhgLevtgU5MedKVFQNuNQ1oDnHh2UAqSLCt7O5lZI' }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={3} // Slight native blur on the image itself
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.8)' }]} />
      </View>

      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Top App Bar */}
      <BlurView intensity={20} tint="dark" style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hazine Odası</Text>
        <TouchableOpacity style={styles.iconButton}>
          <ShoppingBag color="#fbbf24" size={24} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Section: Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>SERVETİN</Text>
          <BlurView intensity={30} tint="light" style={styles.balanceCard}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{xp * 5}</Text>
              <View style={styles.balanceType}>
                <Coins size={16} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.balanceTypeName}>ALTIN</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>15</Text>
              <View style={styles.balanceType}>
                <Diamond size={16} color="#c084fc" fill="#c084fc" />
                <Text style={[styles.balanceTypeName, { color: '#c084fc' }]}>MÜCEVHER</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity style={styles.categoryButtonActive}>
            <Text style={styles.categoryTextActive}>Tüm Ganimetler</Text>
          </TouchableOpacity>
          <BlurView intensity={20} tint="light" style={styles.categoryButton}>
            <Utensils size={16} color="#fff" />
            <Text style={styles.categoryText}>Atıştırmalık</Text>
          </BlurView>
          <BlurView intensity={20} tint="light" style={styles.categoryButton}>
            <Gamepad2 size={16} color="#fff" />
            <Text style={styles.categoryText}>Ekran Süresi</Text>
          </BlurView>
          <BlurView intensity={20} tint="light" style={styles.categoryButton}>
            <Ticket size={16} color="#fff" />
            <Text style={styles.categoryText}>Özel</Text>
          </BlurView>
          <BlurView intensity={20} tint="light" style={styles.categoryButton}>
            <Shirt size={16} color="#fff" />
            <Text style={styles.categoryText}>Ekipman</Text>
          </BlurView>
        </ScrollView>

        {/* Reward Grid */}
        <View style={styles.grid}>
          {rewards.map((reward) => {
            const canAfford = xp >= reward.cost;
            const isPurchased = purchasedId === reward.id;

            return (
              <BlurView key={reward.id} intensity={15} tint="light" style={[styles.card, !canAfford && styles.cardDisabled]}>
                {/* Image Placeholder Area */}
                <View style={styles.cardImageContainer}>
                  <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={[StyleSheet.absoluteFill, { zIndex: 1 }]} />
                  <Text style={{ fontSize: 40 }}>{reward.icon}</Text>
                  <View style={styles.rarityBadge}>
                    <Text style={styles.rarityText}>{reward.cost > 500 ? 'NADİR' : 'YAYGIN'}</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{reward.name}</Text>
                  <View style={styles.cardCost}>
                    <Coins size={14} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.cardCostText}>{reward.cost}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.redeemButton, canAfford ? styles.redeemActive : styles.redeemDisabled]}
                    onPress={() => handlePurchase(reward)}
                    disabled={!canAfford}
                  >
                    <Text style={[styles.redeemText, canAfford ? styles.redeemTextActive : styles.redeemTextDisabled]}>
                      {canAfford ? 'Talep Et' : 'Kilitli'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
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

  categoriesContainer: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginRight: 8
  },
  categoryButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#fbbf24',
    marginRight: 8,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 10
  },
  categoryText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  categoryTextActive: { color: '#000', fontSize: 14, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
  card: {
    width: (width - 48) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    overflow: 'hidden',
    marginBottom: 8
  },
  cardDisabled: { opacity: 0.7 },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 2
  },
  rarityText: { color: '#fbbf24', fontSize: 8, fontWeight: 'bold' },
  cardContent: { padding: 12, gap: 8 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardCost: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardCostText: { color: '#fbbf24', fontSize: 14, fontWeight: 'bold' },
  redeemButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  redeemActive: { backgroundColor: '#fbbf24' },
  redeemDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  redeemText: { fontSize: 12, fontWeight: 'bold' },
  redeemTextActive: { color: '#000' },
  redeemTextDisabled: { color: 'rgba(255,255,255,0.4)' },
});
