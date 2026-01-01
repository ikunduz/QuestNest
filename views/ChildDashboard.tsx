
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Animated, Easing } from 'react-native';
import {
  Shield, Sparkles, Camera, CheckCircle2, ChevronRight, Trophy, Sword,
  UserCircle, Wand2, Target, Heart, Zap
} from 'lucide-react-native';
import { XPBar } from '../components/XPBar';
import { GameButton } from '../components/GameButton';
import { FloatingHearts } from '../components/XPGainAnimation';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { AvatarSelector } from '../components/AvatarSelector';
import { CATEGORY_METADATA } from '../constants';
import { Quest, UserState } from '../types';
import { getWisdomMessage } from '../services/geminiService';

interface ChildDashboardProps {
  user: UserState;
  quests: Quest[];
  onComplete: (id: string) => void;
  onUpdateUser: (updates: Partial<UserState>) => void;
}

const HERO_CLASSES = [
  { id: 'knight', icon: <Shield size={32} color="#ffffff" />, label: 'Şövalye', color: '#2563eb' },
  { id: 'mage', icon: <Wand2 size={32} color="#ffffff" />, label: 'Büyücü', color: '#9333ea' },
  { id: 'ranger', icon: <Target size={32} color="#ffffff" />, label: 'Okçu', color: '#059669' }
];

export const ChildDashboard: React.FC<ChildDashboardProps> = ({ user, quests, onComplete, onUpdateUser }) => {
  const [wisdom, setWisdom] = useState<string>("Yükleniyor...");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isBlessingActive, setIsBlessingActive] = useState(false);

  useEffect(() => {
    getWisdomMessage(user.name, user.level).then(setWisdom);
  }, [user.name, user.level]);

  useEffect(() => {
    if (user.lastBlessingFrom) {
      setIsBlessingActive(true);
      const timer = setTimeout(() => setIsBlessingActive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user.lastBlessingFrom]);

  const activeQuests = quests.filter(q => q.status === 'active');
  const pendingQuests = quests.filter(q => q.status === 'pending_approval');
  const completedQuests = quests.filter(q => q.status === 'completed').slice(0, 3);

  const startCamera = async () => {
    // Avatar seçici'ye geçiş yapılıyor
    setShowAvatarSelector(true);
  };

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleAvatarSelect = (avatarId: string, photoUrl?: string) => {
    if (photoUrl) {
      onUpdateUser({ avatar: photoUrl });
    } else if (avatarId) {
      // Avatar emoji'sini kaydet (veya avatar id'yi)
      onUpdateUser({ avatar: avatarId });
    }
    setShowAvatarSelector(false);
    Alert.alert('✅', 'Avatar güncellendi!');
  };

  if (showAvatarSelector) {
    return (
      <ScrollView style={styles.profileContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>AVATAR SEÇ</Text>
          <GameButton variant="ghost" onPress={() => setShowAvatarSelector(false)}>
            <ChevronRight color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
          </GameButton>
        </View>
        <AvatarSelector
          currentAvatar={user.avatar}
          userRole="child"
          onSelect={handleAvatarSelect}
        />
      </ScrollView>
    );
  }

  if (showProfile) {
    return (
      <View style={styles.profileContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>KAHRAMAN PORTRESİ</Text>
          <GameButton variant="ghost" onPress={() => setShowProfile(false)}>
            <ChevronRight color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
          </GameButton>
        </View>

        <View style={styles.profileBox}>
          <View style={styles.avatarCircle}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <UserCircle color="#fbbf24" size={64} />
            )}
          </View>
          <GameButton onPress={startCamera} style={{ width: '100%' }}>AVATAR DEĞİŞTİR</GameButton>
        </View>

        <View style={styles.classGrid}>
          {HERO_CLASSES.map(hc => (
            <TouchableOpacity
              key={hc.id}
              onPress={() => onUpdateUser({ heroClass: hc.id as any })}
              style={[
                styles.classCard,
                user.heroClass === hc.id ? styles.classCardActive : styles.classCardInactive
              ]}
            >
              {hc.icon}
              <Text style={styles.classLabel}>{hc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (selectedQuest) {
    return (
      <View style={styles.questDetailContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedQuest(null)} style={styles.backBtn}>
            <ChevronRight color="#fbbf24" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>GÖREV AYRINTILARI</Text>
        </View>

        <View style={styles.questCard}>
          <View style={[styles.questIconBox, { backgroundColor: CATEGORY_METADATA[selectedQuest.category].color }]}>
            {React.cloneElement(CATEGORY_METADATA[selectedQuest.category].icon as React.ReactElement, { size: 40, color: '#fff' } as any)}
          </View>
          <Text style={styles.questTitle}>{selectedQuest.titleKey}</Text>
          <Text style={styles.questDesc}>"{selectedQuest.description}"</Text>

          <View style={styles.rewardBox}>
            <Text style={styles.rewardLabel}>KAZANIM</Text>
            <Text style={styles.rewardValue}>
              <Sparkles color="#fbbf24" size={24} /> {selectedQuest.xpReward} XP
            </Text>
          </View>

          <GameButton style={{ width: '100%' }} onPress={() => { onComplete(selectedQuest.id); setSelectedQuest(null); }}>
            GÖREVİ BİLDİR
          </GameButton>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Animated Blessing Hearts */}
      <FloatingHearts visible={isBlessingActive} from={user.lastBlessingFrom} />

      {/* Compact Hero Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.avatarContainer}>
            <View style={styles.avatarInner}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarSmall} />
              ) : (
                <UserCircle color="#fbbf24" size={32} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>{user.name}</Text>
            <View style={styles.heroSubInfo}>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {user.heroClass === 'mage' ? '🧙' : user.heroClass === 'ranger' ? '🏹' : '🛡️'} Lv.{user.level}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.xpBadge}>
            <Sparkles color="#fbbf24" size={14} />
            <Text style={styles.xpBadgeText}>{user.xp}</Text>
          </View>
        </View>
        <XPBar xp={user.xp} level={user.level} />
      </View>

      {/* AI Wisdom - Compact */}
      <View style={styles.wisdomCard}>
        <Text style={styles.wisdomText} numberOfLines={2}>💡 "{wisdom}"</Text>
      </View>

      {/* Quest List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sword size={18} color="#fbbf24" />
          <Text style={styles.sectionTitle}>AKTİF GÖREVLER</Text>
          <Text style={styles.sectionCount}>{activeQuests.length}</Text>
        </View>

        {activeQuests.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle2 size={32} color="#10b981" />
            <Text style={styles.emptyText}>Tüm görevler tamamlandı! 🎉</Text>
          </View>
        ) : (
          activeQuests.map((quest) => (
            <TouchableOpacity
              key={quest.id}
              onPress={() => setSelectedQuest(quest)}
              style={styles.questListItem}
            >
              <View style={[styles.questListIcon, { backgroundColor: CATEGORY_METADATA[quest.category].color + '30' }]}>
                {React.cloneElement(CATEGORY_METADATA[quest.category].icon as React.ReactElement, { size: 20, color: CATEGORY_METADATA[quest.category].color } as any)}
              </View>
              <View style={styles.questListText}>
                <Text style={styles.questListTitle} numberOfLines={1}>{quest.titleKey}</Text>
                <Text style={styles.questListXP}>+{quest.xpReward} XP</Text>
              </View>
              <ChevronRight color="#475569" size={18} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Pending Quests */}
      {pendingQuests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>ONAY BEKLİYOR</Text>
            <Text style={[styles.sectionCount, { backgroundColor: '#f59e0b' }]}>{pendingQuests.length}</Text>
          </View>
          {pendingQuests.map((quest) => (
            <View key={quest.id} style={[styles.questListItem, { borderColor: '#f59e0b', borderWidth: 1 }]}>
              <View style={[styles.questListIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Trophy size={20} color="#f59e0b" />
              </View>
              <View style={styles.questListText}>
                <Text style={styles.questListTitle} numberOfLines={1}>{quest.titleKey}</Text>
                <Text style={[styles.questListXP, { color: '#f59e0b' }]}>Ebeveyn onayı bekleniyor...</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Bottom spacing for navbar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 16, paddingBottom: 0 },
  profileContainer: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  questDetailContainer: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, color: '#fbbf24', fontWeight: 'bold' },
  profileBox: { backgroundColor: '#1e293b', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 20 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', borderWidth: 3, borderColor: '#fbbf24' },
  avatarImg: { width: '100%', height: '100%' },
  classGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  classCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 2 },
  classCardActive: { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
  classCardInactive: { borderColor: '#334155', backgroundColor: '#1e293b', opacity: 0.5 },
  classLabel: { color: '#fff', fontSize: 9, fontWeight: 'bold', marginTop: 6 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#fbbf24', marginLeft: 4, fontSize: 14 },
  questCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 24, alignItems: 'center' },
  questIconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  questTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  questDesc: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  rewardBox: { backgroundColor: '#0f172a', padding: 14, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 20 },
  rewardLabel: { fontSize: 9, color: '#fbbf24', fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  rewardValue: { fontSize: 20, color: '#fbbf24', fontWeight: 'bold' },
  statsCard: { backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: 14, borderRadius: 20, marginBottom: 12 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fbbf24', padding: 2 },
  avatarInner: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarSmall: { width: '100%', height: '100%' },
  heroInfo: { flex: 1, marginLeft: 12 },
  heroName: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  heroSubInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  classBadge: { backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  classBadgeText: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  levelInfo: { color: '#94a3b8', fontSize: 11, marginLeft: 8 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  xpBadgeText: { color: '#fbbf24', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  wisdomCard: { backgroundColor: 'rgba(30, 27, 75, 0.8)', borderLeftWidth: 3, borderLeftColor: '#818cf8', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 16 },
  wisdomLabel: { fontSize: 9, color: '#818cf8', fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  wisdomText: { color: '#e2e8f0', fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, color: '#fff', fontWeight: 'bold', marginLeft: 8, flex: 1 },
  sectionCount: { backgroundColor: '#fbbf24', color: '#0f172a', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  emptyBox: { paddingVertical: 40, backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  questListItem: { backgroundColor: '#1e293b', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  questListIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  questListText: { flex: 1, marginLeft: 12 },
  questListTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  questListXP: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  blessingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  blessingTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginTop: 12 },
  blessingSub: { fontSize: 16, color: '#fbbf24', fontWeight: 'bold' },
});

