
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import {
  Shield, Sparkles, Camera, CheckCircle2, ChevronRight, Trophy, Sword,
  UserCircle, Wand2, Target, Heart, Zap
} from 'lucide-react-native';
import { XPBar } from '../components/XPBar';
import { GameButton } from '../components/GameButton';
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
    Alert.alert("Bilgi", "Kamera özelliği mobil uygulama için güncelleniyor.");
  };

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
          <GameButton onPress={startCamera} style={{ width: '100%' }}>PORTRE DEĞİŞTİR</GameButton>
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
          <View style={[styles.questIconBox, { backgroundColor: CATEGORY_METADATA[selectedQuest.category].color.replace('bg-', '').replace('-500', '') }]}>
            {React.cloneElement(CATEGORY_METADATA[selectedQuest.category].icon as React.ReactElement, { size: 40, color: '#fff' })}
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
    <View style={styles.container}>
      {isBlessingActive && (
        <View style={styles.blessingOverlay}>
          <Zap size={80} color="#fbbf24" />
          <Text style={styles.blessingTitle}>{user.lastBlessingFrom === 'mom' ? 'ANNELİK' : 'BABALIK'} LÜTFU!</Text>
          <Text style={styles.blessingSub}>+5 XP KAZANILDI</Text>
        </View>
      )}

      {/* Hero Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.avatarContainer}>
            <View style={styles.avatarInner}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarSmall} />
              ) : (
                <UserCircle color="#fbbf24" size={40} />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{user.name}</Text>
            <View style={styles.heroSubInfo}>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {user.heroClass === 'mage' ? 'Büyücü' : user.heroClass === 'ranger' ? 'Okçu' : 'Işık Muhafızı'}
                </Text>
              </View>
              <Text style={styles.levelInfo}>Seviye {user.level}</Text>
            </View>
          </View>
        </View>
        <XPBar xp={user.xp} level={user.level} />
      </View>

      {/* AI Wisdom */}
      <View style={styles.wisdomCard}>
        <Text style={styles.wisdomLabel}>BİLGENİN ÖĞÜDÜ</Text>
        <Text style={styles.wisdomText}>"{wisdom}"</Text>
      </View>

      {/* Quest List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><Sword size={20} color="#fbbf24" /> AKTİF GÖREVLER</Text>

        {activeQuests.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle2 size={40} color="#10b981" />
            <Text style={styles.emptyText}>ZAFER!</Text>
          </View>
        ) : (
          activeQuests.map((quest) => (
            <TouchableOpacity
              key={quest.id}
              onPress={() => setSelectedQuest(quest)}
              style={styles.questListItem}
            >
              <View style={styles.questListIcon}>
                {CATEGORY_METADATA[quest.category].icon}
              </View>
              <View style={styles.questListText}>
                <Text style={styles.questListTitle}>{quest.titleKey}</Text>
                <Text style={styles.questListXP}>+{quest.xpReward} XP</Text>
              </View>
              <ChevronRight color="#475569" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  profileContainer: { padding: 20 },
  questDetailContainer: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, color: '#fbbf24', fontWeight: 'bold' },
  profileBox: { backgroundColor: '#1e293b', padding: 24, borderRadius: 32, alignItems: 'center', marginBottom: 24 },
  avatarCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', borderWidth: 4, borderColor: '#fbbf24' },
  avatarImg: { width: '100%', height: '100%' },
  classGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  classCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', marginHorizontal: 4, borderWidth: 2 },
  classCardActive: { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
  classCardInactive: { borderColor: '#334155', backgroundColor: '#1e293b', opacity: 0.5 },
  classLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#fbbf24', marginLeft: 4 },
  questCard: { backgroundColor: '#1e293b', padding: 32, borderRadius: 40, alignItems: 'center' },
  questIconBox: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  questTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  questDesc: { fontSize: 16, color: '#cbd5e1', textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  rewardBox: { backgroundColor: '#0f172a', padding: 16, borderRadius: 24, width: '100%', alignItems: 'center', marginBottom: 24 },
  rewardLabel: { fontSize: 10, color: '#fbbf24', fontWeight: 'bold', marginBottom: 4 },
  rewardValue: { fontSize: 24, color: '#fbbf24', fontWeight: 'bold', flexDirection: 'row', alignItems: 'center' },
  statsCard: { backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: 20, borderRadius: 32, marginBottom: 24 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#fbbf24', padding: 2 },
  avatarInner: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarSmall: { width: '100%', height: '100%' },
  heroInfo: { marginLeft: 16 },
  heroName: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  heroSubInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  classBadge: { backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 16 },
  classBadgeText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  levelInfo: { color: '#94a3b8', fontSize: 12, marginLeft: 8 },
  wisdomCard: { backgroundColor: '#1e1b4b', borderLeftWidth: 4, borderLeftColor: '#818cf8', padding: 16, borderRadius: 16, marginBottom: 24 },
  wisdomLabel: { fontSize: 10, color: '#818cf8', fontWeight: 'bold', marginBottom: 4 },
  wisdomText: { color: '#f1f5f9', fontStyle: 'italic', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 16 },
  emptyBox: { height: 150, backgroundColor: 'rgba(30, 41, 59, 0.2)', borderRadius: 32, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  questListItem: { backgroundColor: '#1e293b', padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  questListIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  questListText: { flex: 1, marginLeft: 16 },
  questListTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  questListXP: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  blessingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  blessingTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginTop: 16 },
  blessingSub: { fontSize: 18, color: '#fbbf24', fontWeight: 'bold' },
});
