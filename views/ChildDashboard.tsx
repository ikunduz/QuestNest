import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Shield, Sparkles, Trophy, Sword, UserCircle, Target, Wand2, Bell, Menu, Map, Store, User, ChevronRight, Check,
  BookOpen, Star, Repeat, CalendarCheck
} from 'lucide-react-native';
import { AvatarSelector } from '../components/AvatarSelector';
import { CATEGORY_METADATA } from '../constants';
import { Quest, UserState } from '../types';
import { getWisdomMessage } from '../services/geminiService';
import { getAvatarEmoji } from '../constants/avatars';

const { width } = Dimensions.get('window');

interface ChildDashboardProps {
  user: UserState;
  quests: Quest[];
  onComplete: (id: string) => void;
  onUpdateUser: (updates: Partial<UserState>) => void;
}

export const ChildDashboard: React.FC<ChildDashboardProps> = ({ user, quests, onComplete, onUpdateUser }) => {
  const [wisdom, setWisdom] = useState<string>("Yükleniyor...");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const xpAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getWisdomMessage(user.name, user.level).then(setWisdom);
  }, [user.name, user.level]);

  useEffect(() => {
    // Animate XP Bar on mount or update
    Animated.timing(xpAnim, {
      toValue: (user.xp % 100) / 100, // Assuming 100 XP per level for simplicity in visual
      duration: 1500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [user.xp]);

  // Routine Logic: Check if routine was completed TODAY.
  const isRoutineCompletedToday = (quest: Quest) => {
    if (!quest.completedAt) return false;

    const today = new Date();
    const completedDate = new Date(quest.completedAt);

    return (
      today.getDate() === completedDate.getDate() &&
      today.getMonth() === completedDate.getMonth() &&
      today.getFullYear() === completedDate.getFullYear()
    );
  };

  const dailyQuests = quests.filter(q => q.status === 'active' && q.type !== 'routine');
  const routineQuests = quests.filter(q => q.type === 'routine');

  // Separate routines
  // Todo: Active, OR (Completed/Pending but NOT today)
  const routinesTodo = routineQuests.filter(q => q.status === 'active' || (q.status === 'completed' && !isRoutineCompletedToday(q)));

  // Done/Pending: (Status pending) OR (Status completed AND today)
  const routinesDoneOrPending = routineQuests.filter(q => q.status === 'pending_approval' || (q.status === 'completed' && isRoutineCompletedToday(q)));

  const pendingQuests = quests.filter(q => q.status === 'pending_approval' && q.type !== 'routine');

  const handleAvatarSelect = (avatarId: string, photoUrl?: string) => {
    if (photoUrl) onUpdateUser({ avatar: photoUrl });
    else if (avatarId) onUpdateUser({ avatar: avatarId });
    setShowAvatarSelector(false);
    Alert.alert('✅', 'Avatar güncellendi!');
  };

  const getNextLevelXP = (level: number) => level * 100;
  const currentLevelXP = user.level * 100; // Simplified for visual
  const xpPercentage = Math.min((user.xp / getNextLevelXP(user.level)) * 100, 100);

  if (showAvatarSelector) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1f2e', '#111827']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowAvatarSelector(false)} style={styles.backButton}>
            <ChevronRight color="#fbbf24" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AVATAR SEÇ</Text>
        </View>
        <AvatarSelector currentAvatar={user.avatar} userRole="child" onSelect={handleAvatarSelect} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ambient Background Layer */}
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#020617']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section Redesign */}
        <View style={styles.headerCardContainer}>
          <BlurView intensity={40} tint="dark" style={styles.headerGlassCard}>
            <View style={styles.profileRow}>
              <TouchableOpacity onPress={() => setShowAvatarSelector(true)} style={styles.avatarWrapperLarge}>
                <LinearGradient
                  colors={['#f59e0b', '#fbbf24', '#fff7ed']}
                  style={styles.avatarBorderLarge}
                >
                  {user.avatar ? (
                    user.avatar.startsWith('http') || user.avatar.startsWith('file') ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatarImageLarge} />
                    ) : (
                      <View style={styles.avatarEmojiContainerLarge}>
                        <Text style={styles.avatarEmojiLarge}>{getAvatarEmoji(user.avatar)}</Text>
                      </View>
                    )
                  ) : (
                    <UserCircle size={60} color="#1f2937" fill="#fbbf24" />
                  )}
                </LinearGradient>
                <View style={styles.levelBadgeLarge}>
                  <Text style={styles.levelTextLarge}>{user.level.toString()}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.userInfoExpanded}>
                <Text style={styles.userNameLarge}>Kahraman {user.name}</Text>
                <View style={styles.titleBadge}>
                  <Text style={styles.userTitleLarge}>
                    {user.heroClass === 'mage' ? 'Çırak Büyücü' : user.heroClass === 'ranger' ? 'Acemi Okçu' : 'Şövalye Yardımcısı'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <LinearGradient colors={['#fbbf24', '#d97706']} style={styles.statIconCircle}>
                  <Text style={styles.statEmoji}>🪙</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.statLabelHeader}>ALTIN</Text>
                  <Text style={styles.statValueHeader}>{user.xp * 5}</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Bell size={20} color="#fbbf24" />
                  <View style={styles.notifBadge} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionButton}>
                  <Menu size={20} color="#fbbf24" />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>

        {/* XP Card */}
        <BlurView intensity={30} tint="dark" style={styles.xpCard}>
          <View style={styles.xpCardHeader}>
            <View>
              <Text style={styles.xpLabel}>XP İlerlemesi</Text>
              <Text style={styles.xpValue}>{user.xp} <Text style={styles.xpTotal}>/ {getNextLevelXP(user.level)} XP</Text></Text>
            </View>
            <Text style={styles.xpRemaining}>Seviye {user.level + 1} için {getNextLevelXP(user.level) - user.xp} XP</Text>
          </View>
          <View style={styles.xpBarContainer}>
            <Animated.View
              style={[
                styles.xpBarFill,
                {
                  width: xpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]}
            >
              <LinearGradient
                colors={['#d97706', '#fbbf24', '#fff7ed', '#fbbf24']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </BlurView>

        {/* Routines / Habits Section */}
        {routineQuests.length > 0 && (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIndicator, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.sectionTitle}>Günlük Rutinler</Text>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitsScroll}>
          {routinesTodo.map((quest) => (
            <TouchableOpacity key={quest.id} onPress={() => onComplete(quest.id)}>
              <BlurView intensity={20} tint="light" style={styles.habitCard}>
                <View style={[styles.habitIconBox, { backgroundColor: CATEGORY_METADATA[quest.category].color + '20' }]}>
                  {React.cloneElement(CATEGORY_METADATA[quest.category].icon as React.ReactElement, { size: 24, color: CATEGORY_METADATA[quest.category].color } as any)}
                </View>
                <Text style={styles.habitTitle}>{quest.titleKey}</Text>
                <View style={styles.habitXpBadge}>
                  <Text style={styles.habitXpText}>+{quest.xpReward} XP</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          ))}
          {routinesDoneOrPending.map((quest) => (
            <View key={quest.id} style={[styles.habitCard, styles.habitCardDone]}>
              <View style={[styles.habitIconBox, { backgroundColor: quest.status === 'pending_approval' ? '#a855f720' : '#10b98120' }]}>
                {quest.status === 'pending_approval' ? <Trophy size={24} color="#a855f7" /> : <Check size={24} color="#10b981" />}
              </View>
              <Text style={[styles.habitTitle, styles.habitTitleDone]}>{quest.titleKey}</Text>
              <Text style={[styles.habitDoneText, { color: quest.status === 'pending_approval' ? '#a855f7' : '#10b981' }]}>
                {quest.status === 'pending_approval' ? 'Onay Bekliyor' : 'Tamamlandı'}
              </Text>
            </View>
          ))}
        </ScrollView>


        {/* Daily Quests Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>Günlük Görevler</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{dailyQuests.filter(q => q.status === 'completed').length}/{dailyQuests.length} Tamamlandı</Text>
          </View>
        </View>

        <View style={styles.questList}>
          {dailyQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <Check size={40} color="#10b981" />
              <Text style={styles.emptyStateText}>Tüm günlük görevler tamam!</Text>
            </View>
          ) : (
            dailyQuests.map((quest) => (
              <BlurView key={quest.id} intensity={20} tint="light" style={styles.questItem}>
                <View style={[styles.questIconBox, { backgroundColor: CATEGORY_METADATA[quest.category].color + '20', borderColor: CATEGORY_METADATA[quest.category].color + '40' }]}>
                  {React.cloneElement(CATEGORY_METADATA[quest.category].icon as React.ReactElement, { size: 28, color: CATEGORY_METADATA[quest.category].color } as any)}
                </View>
                <View style={styles.questInfo}>
                  <Text style={styles.questTitleItem}>{quest.titleKey}</Text>
                  <Text style={styles.questDescItem}>{quest.description}</Text>
                  <View style={styles.questTags}>
                    <View style={styles.xpTag}>
                      <Text style={styles.xpTagText}>{quest.xpReward} XP</Text>
                    </View>
                    <View style={[styles.typeTag, { backgroundColor: CATEGORY_METADATA[quest.category].color + '20', borderColor: CATEGORY_METADATA[quest.category].color + '40' }]}>
                      <Text style={[styles.typeTagText, { color: CATEGORY_METADATA[quest.category].color }]}>{quest.category}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => onComplete(quest.id)} style={styles.claimButton}>
                  <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.claimButtonGradient}>
                    <Text style={styles.claimButtonText}>Tamamla</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            ))
          )}

          {/* Pending Quests */}
          {pendingQuests.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <View style={styles.sectionTitleContainer}>
                  <View style={[styles.sectionIndicator, { backgroundColor: '#a855f7' }]} />
                  <Text style={styles.sectionTitle}>Onay Bekliyor</Text>
                </View>
              </View>
              {pendingQuests.map((quest) => (
                <BlurView key={quest.id} intensity={10} tint="light" style={[styles.questItem, { opacity: 0.8 }]}>
                  <View style={[styles.questIconBox, { backgroundColor: '#a855f720', borderColor: '#a855f740' }]}>
                    <Trophy size={28} color="#a855f7" />
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitleItem}>{quest.titleKey}</Text>
                    <Text style={styles.questDescItem}>Ebeveyn onayı bekleniyor...</Text>
                  </View>
                  <View style={styles.statusIcon}>
                    <Text>⏳</Text>
                  </View>
                </BlurView>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  headerCardContainer: { paddingHorizontal: 16, marginTop: 20, marginBottom: 24 },
  headerGlassCard: { borderRadius: 32, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrapperLarge: { position: 'relative' },
  avatarBorderLarge: { width: 100, height: 100, borderRadius: 50, padding: 4, justifyContent: 'center', alignItems: 'center', shadowColor: '#fbbf24', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  avatarImageLarge: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#1f2937' },
  avatarEmojiContainerLarge: { width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  avatarEmojiLarge: { fontSize: 50 },
  levelBadgeLarge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#f59e0b', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#111827', zIndex: 10 },
  levelTextLarge: { fontSize: 14, fontWeight: '900', color: '#000' },
  userInfoExpanded: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  userNameLarge: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  titleBadge: { backgroundColor: 'rgba(251, 191, 36, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 6, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)' },
  userTitleLarge: { color: '#fbbf24', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  headerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#fbbf24', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  statEmoji: { fontSize: 20 },
  statLabelHeader: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  statValueHeader: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerActionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginLeft: 12 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 1.5, borderColor: '#111827' },

  xpCard: { padding: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  xpCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  xpLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  xpValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  xpTotal: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  xpRemaining: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  xpBarContainer: { height: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  xpBarFill: { height: '100%', borderRadius: 6, overflow: 'hidden' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIndicator: { width: 4, height: 24, backgroundColor: '#fbbd23', borderRadius: 2, shadowColor: '#fbbd23', shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  progressBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  progressText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },

  habitsScroll: { paddingHorizontal: 4, gap: 12, marginBottom: 24 },
  habitCard: { width: 110, height: 130, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  habitCardDone: { opacity: 0.6, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  habitIconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  habitTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center', height: 32 },
  habitTitleDone: { color: '#94a3b8', textDecorationLine: 'line-through' },
  habitXpBadge: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  habitXpText: { color: '#000', fontSize: 10, fontWeight: '900' },
  habitDoneText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },

  questList: { gap: 12 },
  questItem: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  questIconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  questInfo: { flex: 1, gap: 4 },
  questTitleItem: { color: '#fff', fontSize: 16, fontWeight: '700' },
  questDescItem: { color: '#94a3b8', fontSize: 12 },
  questTags: { flexDirection: 'row', gap: 8, marginTop: 4 },
  xpTag: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  xpTagText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, backgroundColor: 'transparent' },
  typeTagText: { fontSize: 10, fontWeight: 'bold', textTransform: 'capitalize' },
  claimButton: { overflow: 'hidden', borderRadius: 20 },
  claimButtonGradient: { paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  claimButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  statusIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, opacity: 0.5, gap: 12 },
  emptyStateText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  fab: { position: 'absolute', bottom: 100, right: 24 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#fbbf24', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  fabIcon: { fontSize: 32, color: '#000', fontWeight: '300', marginTop: -4 },

  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fbbf24' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }
});
