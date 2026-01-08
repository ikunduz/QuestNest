import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Modal, Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell, Shield, Zap, TrendingUp, Check, X, Plus, Crown, Sparkles,
  CheckCircle2, DollarSign, Gift, Heart, Send, Share2, Users, BarChart2, BookOpen as BookOpenIcon,
  LayoutDashboard, ClipboardList, BookOpen, Settings, ShoppingBag
} from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { Reward, Quest, ParentType } from '../types';
import { getFamilyById, getFamilyMembers } from '../services/familyService';
import { getAvatarEmoji } from '../constants/avatars';

// Interface for family members
interface FamilyMember {
  id: string;
  name: string;
  xp: number;
  level: number;
  avatar?: string;
  hero_class?: 'knight' | 'mage' | 'ranger';
}

const HERO_CLASS_LABELS: Record<string, { label: string; color: string }> = {
  knight: { label: 'Şövalye', color: '#fbbf24' },
  mage: { label: 'Büyücü', color: '#818cf8' },
  ranger: { label: 'Okçu', color: '#10b981' },
};

// Quest Templates for quick adding
const QUEST_TEMPLATES = [
  { title: 'Odasını Temizle', category: 'clean', xp: 25, icon: '🧹' },
  { title: 'Kitap Oku (30 dk)', category: 'study', xp: 30, icon: '📚' },
  { title: 'Ödev Yap', category: 'study', xp: 35, icon: '✍️' },
  { title: 'Dişlerini Fırçala', category: 'care', xp: 10, icon: '🪥' },
  { title: 'Sebze Ye', category: 'care', xp: 20, icon: '🥦' },
  { title: 'Oyuncakları Topla', category: 'clean', xp: 20, icon: '🧸' },
  { title: 'Yatağını Yap', category: 'clean', xp: 15, icon: '🛏️' },
  { title: 'Eğlenceli Aktivite', category: 'magic', xp: 25, icon: '✨' },
  { title: 'Spor Yap', category: 'care', xp: 30, icon: '⚽' },
  { title: 'Resim Çiz', category: 'magic', xp: 20, icon: '🎨' },
  { title: 'Müzik Dinle', category: 'magic', xp: 15, icon: '🎵' },
  { title: 'Evi Temizlemeye Yardım', category: 'clean', xp: 40, icon: '🏠' },
];

interface ParentDashboardProps {
  quests: Quest[];
  rewards: Reward[];
  onApprove: (id: string, xpReward: number) => void;
  onAddQuest: (quest: Partial<Quest>) => void;
  onDelete: (id: string) => void;
  onSendBlessing: (from: ParentType) => void;
  onAddReward: (reward: Reward) => void;
  onDeleteReward: (id: string) => void;
  onExit: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  quests,
  rewards,
  onApprove,
  onAddQuest,
  onDelete,
  onSendBlessing,
  onAddReward,
  onDeleteReward,
  onExit
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rewards' | 'analytics'>('dashboard');
  const [storedFamilyCode, setStoredFamilyCode] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [familyName, setFamilyName] = useState<string>('Aile');

  const [parentType, setParentType] = useState<ParentType>('dad');
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);

  // Motivation feature states
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<FamilyMember | null>(null);
  const [bonusAmount, setBonusAmount] = useState('25');
  const [showCelebrationSent, setShowCelebrationSent] = useState(false);

  // ... (useEffect for loading data remains same)
  // Load family code on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('questnest_user');
        if (jsonValue != null) {
          const user = JSON.parse(jsonValue);

          // Load family code
          if (user.familyCode) {
            setStoredFamilyCode(user.familyCode);
          } else if (user.family_id) {
            try {
              const family = await getFamilyById(user.family_id);
              if (family && family.family_code) {
                setStoredFamilyCode(family.family_code);
                setFamilyName(family.name || 'Aile');
                user.familyCode = family.family_code;
                await AsyncStorage.setItem('questnest_user', JSON.stringify(user));
              }
            } catch (err) {
              console.log("Failed to fetch family code fallback:", err);
            }
          }

          // Load family members (children)
          if (user.family_id) {
            try {
              console.log('Loading family members for family_id:', user.family_id);
              const members = await getFamilyMembers(user.family_id);
              console.log('Loaded family members:', members);
              setFamilyMembers(members);
            } catch (err) {
              console.log("Failed to fetch family members:", err);
            }
          } else {
            console.log('No family_id found in user data:', user);
          }
          setLoadingMembers(false);
        }
      } catch (e) {
        console.log('Error loading data:', e);
      }
    };
    loadData();
  }, []);

  const pendingQuests = quests.filter(q => q.status === 'pending_approval');

  const ICON_OPTIONS = ['🎁', '🎮', '📱', '🍦', '🚲', '🎞️', '⚽', '🎨', '🎸', '🧩', '🧸', '🍔', '🍕', '🏊', '📚', '🏕️', '🎢', '🏖️', '🎧', '💻'];
  const [selectedIcon, setSelectedIcon] = useState('🎁');

  const handleAddRewardSubmit = () => {
    if (!newRewardTitle || !newRewardCost) return;
    onAddReward({
      id: Date.now().toString(),
      name: newRewardTitle,
      cost: parseInt(newRewardCost),
      icon: selectedIcon,
      type: 'real',
      isUnlocked: true
    });
    setNewRewardTitle('');
    setNewRewardCost('');
    setSelectedIcon('🎁');
    setIsAddingReward(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header - Hero Glass Dark */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greetingText}>Merhaba,</Text>
            <Text style={styles.parentNameText}>{parentType === 'dad' ? 'Baba 👋' : 'Anne 👋'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert('📬', 'Bildirimler yakında!')}>
            <BlurView intensity={20} tint="light" style={styles.notificationBlur}>
              <Bell size={24} color="#fbbf24" />
              {pendingQuests.length > 0 && <View style={styles.notificationBadge} />}
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Tab View Wrapper */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Bento Grid - Quick Stats */}
            <View style={styles.bentoGrid}>
              {/* Card 1: Pending Approvals */}
              <TouchableOpacity style={[styles.bentoCard, styles.bentoCardLarge]} activeOpacity={0.9} onPress={() => setActiveTab('dashboard')}>
                <LinearGradient
                  colors={pendingQuests.length > 0 ? ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)'] : ['rgba(30, 41, 59, 0.6)', 'rgba(30, 41, 59, 0.4)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.bentoHeader}>
                  <View style={[styles.iconBox, { backgroundColor: pendingQuests.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.1)' }]}>
                    <Bell size={20} color={pendingQuests.length > 0 ? '#f87171' : '#94a3b8'} />
                  </View>
                  {pendingQuests.length > 0 && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Onay Bekliyor</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.bentoValue}>{pendingQuests.length}</Text>
                <Text style={styles.bentoLabel}>Bekleyen Görev</Text>
              </TouchableOpacity>

              {/* Card 2: Active Quests */}
              <View style={styles.bentoColumn}>
                <View style={styles.bentoCardSmall}>
                  <BlurView intensity={20} tint="light" style={styles.glassContent}>
                    <Users size={20} color="#818cf8" style={{ marginBottom: 8 }} />
                    <Text style={styles.bentoValueSmall}>{familyMembers.length}</Text>
                    <Text style={styles.bentoLabelSmall}>Çocuk</Text>
                  </BlurView>
                </View>
                <View style={styles.bentoCardSmall}>
                  <BlurView intensity={20} tint="light" style={styles.glassContent}>
                    <Sparkles size={20} color="#fbbf24" style={{ marginBottom: 8 }} />
                    <Text style={styles.bentoValueSmall}>{familyMembers.reduce((sum, m) => sum + m.xp, 0)}</Text>
                    <Text style={styles.bentoLabelSmall}>Toplam Altın</Text>
                  </BlurView>
                </View>
              </View>
            </View>

            {/* Hero Carousel */}
            <View style={{ marginTop: 24, marginBottom: 8 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginLeft: 24, marginBottom: 12 }}>KAHRAMANLAR</Text>

              <ScrollView
                horizontal
                pagingEnabled
                decelerationRate="fast"
                snapToInterval={Dimensions.get('window').width * 0.8 + 12}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
              >
                {loadingMembers ? (
                  <View style={[styles.heroCard, { height: 380, justifyContent: 'center' }]}>
                    <Text style={{ color: '#94a3b8' }}>Yükleniyor...</Text>
                  </View>
                ) : familyMembers.length === 0 ? (
                  <View style={[styles.heroCard, { height: 380, justifyContent: 'center' }]}>
                    <View style={[styles.heroAvatarContainer, { borderColor: '#94a3b8' }]}>
                      <Text style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</Text>
                    </View>
                    <Text style={styles.heroName}>Aile Kurulumu</Text>
                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>Henüz çocuk eklenmemiş.</Text>
                  </View>
                ) : (
                  familyMembers.map((member) => {
                    const memberLevel = member.level || 1;
                    const memberXp = member.xp || 0;
                    const maxXp = memberLevel * 100;
                    const heroConfig = HERO_CLASS_LABELS[member.hero_class || 'knight'];

                    const isPhotoUrl = member.avatar && (member.avatar.startsWith('http') || member.avatar.startsWith('file://'));
                    const heroEmoji = member.hero_class === 'mage' ? '🔮' : member.hero_class === 'ranger' ? '🏹' : '🛡️';
                    const avatarEmoji = member.avatar && !isPhotoUrl ? getAvatarEmoji(member.avatar) : heroEmoji;

                    return (
                      <View key={member.id} style={[styles.heroCard, { borderColor: heroConfig.color + '40' }]}>
                        <LinearGradient colors={['#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />
                        <LinearGradient colors={[heroConfig.color + '20', 'transparent']} style={styles.heroGlow} />

                        {/* Hero Avatar */}
                        <View style={[styles.heroAvatarContainer, { borderColor: heroConfig.color }]}>
                          {isPhotoUrl ? (
                            <Image source={{ uri: member.avatar }} style={styles.heroAvatar} />
                          ) : (
                            <View style={[styles.heroAvatar, { backgroundColor: heroConfig.color, justifyContent: 'center', alignItems: 'center' }]}>
                              <Text style={{ fontSize: 64 }}>{avatarEmoji}</Text>
                            </View>
                          )}
                          <View style={{ position: 'absolute', bottom: -10, backgroundColor: heroConfig.color, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ color: '#1e1b4b', fontWeight: 'bold', fontSize: 12 }}>Lv.{memberLevel}</Text>
                          </View>
                        </View>

                        {/* Info */}
                        <Text style={styles.heroName}>{member.name}</Text>
                        <View style={[styles.heroClassBadge, { borderColor: heroConfig.color + '40', backgroundColor: heroConfig.color + '10' }]}>
                          <Text style={[styles.heroClassText, { color: heroConfig.color }]}>{heroConfig.label}</Text>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.heroStatsRow}>
                          <View style={styles.heroStatItem}>
                            <Zap size={24} color="#fbbf24" style={{ marginBottom: 4 }} />
                            <Text style={styles.heroStatValue}>{memberXp}/{maxXp}</Text>
                            <Text style={styles.heroStatLabel}>XP</Text>
                          </View>
                          <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                          <View style={styles.heroStatItem}>
                            <Shield size={24} color={heroConfig.color} style={{ marginBottom: 4 }} />
                            <Text style={styles.heroStatValue}>{memberLevel}</Text>
                            <Text style={styles.heroStatLabel}>SEVİYE</Text>
                          </View>
                          <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                          <View style={styles.heroStatItem}>
                            <Crown size={24} color="#a855f7" style={{ marginBottom: 4 }} />
                            <Text style={styles.heroStatValue}>#{familyMembers.indexOf(member) + 1}</Text>
                            <Text style={styles.heroStatLabel}>SIRA</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>

            {/* Horizontal Action Strip */}
            <View style={{ marginBottom: 24, paddingHorizontal: 24 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 16 }}>HIZLI İŞLEMLER</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                <TouchableOpacity style={styles.actionPillPrimary} onPress={() => setIsAdding(true)}>
                  <Plus size={18} color="#1e1b4b" />
                  <Text style={[styles.actionPillText, { color: '#1e1b4b' }]}>Yeni Görev</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => setIsAddingReward(true)}>
                  <Gift size={18} color="#fbbf24" />
                  <Text style={styles.actionPillText}>Ödül Ekle</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => {
                  if (familyMembers.length === 0) return Alert.alert('Uyarı', 'Çocuk yok.');
                  setSelectedChild(familyMembers[0]);
                  setShowBonusModal(true);
                }}>
                  <DollarSign size={18} color="#10b981" />
                  <Text style={styles.actionPillText}>Bonus Ver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => {
                  onSendBlessing(parentType);
                  setShowCelebrationSent(true);
                  setTimeout(() => setShowCelebrationSent(false), 2000);
                }}>
                  <Heart size={18} color="#f472b6" />
                  <Text style={styles.actionPillText}>Kutla</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => {
                  if (storedFamilyCode) {
                    Share.share({ message: `QuestNest Aile Kodumuz: ${storedFamilyCode}` });
                  }
                }}>
                  <Share2 size={18} color="#818cf8" />
                  <Text style={styles.actionPillText}>Davet Et</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>


            {/* Approvals */}
            < View style={styles.approvalsSection} >
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionTitle}>Onay Bekleyenler</Text>
                  <View style={styles.countBadge}><Text style={styles.countText}>{pendingQuests.length}</Text></View>
                </View>
              </View>
              {
                pendingQuests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <CheckCircle2 size={32} color="#64748b" />
                    <Text style={styles.emptyText}>Hepsi tamam! Bekleyen rapor yok.</Text>
                  </View>
                ) : (
                  pendingQuests.map((quest) => (
                    <BlurView key={quest.id} intensity={15} tint="light" style={styles.approvalCard}>
                      <View style={styles.approvalHeader}>
                        <View style={styles.approvalInfo}>
                          <View style={[styles.approvalIconBox, { backgroundColor: '#818cf820' }]}>
                            <Shield size={20} color="#818cf8" />
                          </View>
                          <View>
                            <Text style={styles.approvalTitle}>{quest.titleKey}</Text>
                            <Text style={styles.approvalSub}>Görev Raporu • Az önce</Text>
                          </View>
                        </View>
                        <View style={styles.decisionButtons}>
                          <TouchableOpacity onPress={() => onApprove(quest.id, quest.xpReward)} style={styles.approveButton}>
                            <Check size={20} color="#1e1b4b" />
                            <Text style={styles.approveButtonText}>Onayla (+{quest.xpReward} A)</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </BlurView>
                  ))
                )
              }
            </View >
          </>
        ) : (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mağaza Yönetimi (Hazine Odası)</Text>
              <TouchableOpacity onPress={() => setIsAddingReward(true)} style={[styles.navFab, { marginTop: 0, width: 40, height: 40, borderWidth: 0 }]}>
                <Plus size={24} color="#1e1b4b" />
              </TouchableOpacity>
            </View>

            <View style={styles.rewardsList}>
              {rewards.map(reward => (
                <BlurView key={reward.id} intensity={15} tint="light" style={styles.rewardRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 24 }}>{reward.icon}</Text>
                    <View>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{reward.name}</Text>
                      <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>{reward.cost} Altın</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => onDeleteReward(reward.id)} style={{ padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
                    <X size={16} color="#ef4444" />
                  </TouchableOpacity>
                </BlurView>
              ))}
            </View>
          </View>
        )}

        {/* Analytics Tab */}
        {
          activeTab === 'analytics' && (
            <View style={styles.sectionContainer}>
              {/* Weekly Stats */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Haftalık Özet</Text>
              </View>

              <View style={styles.statsContainer}>
                <BlurView intensity={15} tint="light" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#10b98120' }]}>
                    <CheckCircle2 size={20} color="#10b981" />
                  </View>
                  <Text style={styles.statValue}>
                    {quests.filter(q => q.status === 'completed').length}
                  </Text>
                  <Text style={styles.statLabel}>Tamamlanan</Text>
                </BlurView>
                <BlurView intensity={15} tint="light" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#fbbf2420' }]}>
                    <Sparkles size={20} color="#fbbf24" />
                  </View>
                  <Text style={styles.statValue}>
                    {familyMembers.reduce((sum, m) => sum + m.xp, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Toplam Altın</Text>
                </BlurView>
                <BlurView intensity={15} tint="light" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#818cf820' }]}>
                    <TrendingUp size={20} color="#818cf8" />
                  </View>
                  <Text style={styles.statValue}>
                    {Math.ceil(quests.filter(q => q.status === 'completed').length / 7 * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Başarı Oranı</Text>
                </BlurView>
              </View>

              {/* Quest Templates */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Hızlı Görev Şablonları</Text>
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16, paddingHorizontal: 0 }}>
                Bir şablona tıklayarak hızlıca görev ekleyin
              </Text>

              <View style={styles.templatesGrid}>
                {QUEST_TEMPLATES.map((template, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.templateCard}
                    onPress={() => {
                      onAddQuest({
                        titleKey: template.title,
                        xpReward: template.xp,
                        category: template.category as any,
                        type: 'daily'
                      });
                      Alert.alert('✅ Görev Eklendi', `"${template.title}" görevi oluşturuldu!`);
                    }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 8 }}>{template.icon}</Text>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <View style={styles.templateXpBadge}>
                      <Text style={styles.templateXpText}>+{template.xp} XP</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Routine Quick Actions */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Rutin Yönetimi</Text>
              </View>
              <BlurView intensity={15} tint="light" style={styles.routineInfoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.statIconBox, { backgroundColor: '#a855f720' }]}>
                    <ClipboardList size={20} color="#a855f7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>Günlük Rutinler</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                      {quests.filter(q => q.type === 'routine').length} aktif rutin
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: '#a855f7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                    onPress={() => {
                      setIsRoutine(true);
                      setIsAdding(true);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>+ Rutin Ekle</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          )
        }

      </ScrollView >

      {/* Reward Modal */}
      {
        isAddingReward && (
          <View style={styles.modalOverlay}>
            <BlurView intensity={50} tint="dark" style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yeni Ödül Ekle</Text>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 }}>İKON SEÇ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {ICON_OPTIONS.map(icon => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      style={{
                        width: 48, height: 48, borderRadius: 24,
                        backgroundColor: selectedIcon === icon ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 2, borderColor: selectedIcon === icon ? '#fbbf24' : 'transparent'
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Ödül Adı (Örn: 30 Dk Tablet)"
                placeholderTextColor="#94a3b8"
                value={newRewardTitle}
                onChangeText={setNewRewardTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Fiyat (Altın)"
                placeholderTextColor="#94a3b8"
                value={newRewardCost}
                onChangeText={setNewRewardCost}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsAddingReward(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>İPTAL</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddRewardSubmit} style={styles.modalPublish}>
                  <Text style={styles.modalPublishText}>EKLE</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )
      }

      {/* Bonus Gold Modal */}
      {
        showBonusModal && selectedChild && (
          <View style={styles.modalOverlay}>
            <BlurView intensity={50} tint="dark" style={styles.modalContent}>
              <Text style={styles.modalTitle}>🎁 Bonus Altın Ver</Text>

              {/* Child Selector */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 }}>ÇOCUK SEÇ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {familyMembers.map(child => (
                    <TouchableOpacity
                      key={child.id}
                      onPress={() => setSelectedChild(child)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
                        backgroundColor: selectedChild?.id === child.id ? '#10b981' : 'rgba(255,255,255,0.1)',
                        borderWidth: 2, borderColor: selectedChild?.id === child.id ? '#10b981' : 'transparent',
                        flexDirection: 'row', alignItems: 'center', gap: 8
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>
                        {child.avatar && !child.avatar.startsWith('http') ? getAvatarEmoji(child.avatar) : '👤'}
                      </Text>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{child.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Amount Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>ALTIN MİKTARI</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {['10', '25', '50', '100'].map(amount => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => setBonusAmount(amount)}
                      style={{
                        flex: 1, paddingVertical: 12, borderRadius: 12,
                        backgroundColor: bonusAmount === amount ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: bonusAmount === amount ? '#000' : '#fff', fontWeight: 'bold' }}>{amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowBonusModal(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>İPTAL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (!selectedChild) return;
                    // Update child's XP via onSendBlessing (reusing existing logic)
                    onSendBlessing('dad');
                    Alert.alert(
                      '🎉 Bonus Gönderildi!',
                      `${selectedChild.name} için +${bonusAmount} Altın eklendi!`
                    );
                    setShowBonusModal(false);
                  }}
                  style={[styles.modalPublish, { backgroundColor: '#10b981' }]}
                >
                  <Text style={styles.modalPublishText}>GÖNDER 🪙</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )
      }


      {/* Quest Modal */}
      {
        isAdding && (
          <View style={styles.modalOverlay}>
            <BlurView intensity={50} tint="dark" style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yeni Görev Emri</Text>
              <TextInput
                style={styles.input}
                placeholder="Görev Başlığı"
                placeholderTextColor="#94a3b8"
                value={newQuestTitle}
                onChangeText={setNewQuestTitle}
              />
              <TouchableOpacity
                style={[styles.routineToggle, isRoutine && styles.routineToggleActive]}
                onPress={() => setIsRoutine(!isRoutine)}
              >
                <View style={[styles.checkbox, isRoutine && styles.checkboxActive]}>
                  {isRoutine && <Check size={14} color="#000" />}
                </View>
                <Text style={styles.routineLabel}>Bu bir Günlük Rutin</Text>
              </TouchableOpacity>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>İPTAL</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  if (!newQuestTitle) return;
                  onAddQuest({
                    titleKey: newQuestTitle,
                    xpReward: 25,
                    category: 'magic',
                    type: isRoutine ? 'routine' : 'daily'
                  });
                  setNewQuestTitle('');
                  setIsRoutine(false);
                  setIsAdding(false);
                }} style={styles.modalPublish}>
                  <Text style={styles.modalPublishText}>YAYINLA</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )
      }

      {/* Floating Dock Navigation */}
      <View style={styles.floatingDockContainer}>
        <BlurView intensity={40} tint="dark" style={styles.floatingDock}>
          <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={[styles.dockItem, activeTab === 'dashboard' && styles.dockItemActive]}>
            <LayoutDashboard size={24} color={activeTab === 'dashboard' ? "#fbbf24" : "#94a3b8"} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('analytics')} style={[styles.dockItem, activeTab === 'analytics' && styles.dockItemActive]}>
            <BarChart2 size={24} color={activeTab === 'analytics' ? "#fbbf24" : "#94a3b8"} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockFab} onPress={() => setIsAdding(true)}>
            <Plus size={32} color="#1e1b4b" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('rewards')} style={[styles.dockItem, activeTab === 'rewards' && styles.dockItemActive]}>
            <ShoppingBag size={24} color={activeTab === 'rewards' ? "#fbbf24" : "#94a3b8"} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onExit} style={styles.dockItem}>
            <Settings size={24} color="#94a3b8" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingBottom: 100 },
  topSection: { padding: 24, paddingTop: 40 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileGroup: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  parentAvatarContainer: { width: 48, height: 48, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  parentAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#818cf8' },
  parentAvatarGlow: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: '#818cf8', opacity: 0.3 },
  parentRole: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  parentName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  notifButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  partySection: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flexDirection: 'row', alignItems: 'center' },
  viewAllText: { color: '#818cf8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  partyScroll: { paddingHorizontal: 24, gap: 16 },
  memberCard: { width: 200, padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)' },
  memberHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 },
  memberAvatarContainer: { position: 'relative' },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  memberIconOverlay: { position: 'absolute', top: -4, right: -4, backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 10 },
  memberName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  memberRole: { fontSize: 12, fontWeight: '500' },
  xpProgress: { gap: 6 },
  xpTextRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' },
  xpTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  xpFill: { height: '100%', borderRadius: 4 },

  approvalsSection: { marginTop: 32, paddingHorizontal: 24 },
  countBadge: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, },
  countText: { color: '#1e1b4b', fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 32, opacity: 0.5 },
  emptyText: { color: '#fff', marginTop: 12 },

  approvalCard: { padding: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  approvalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  approvalInfo: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  approvalIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  approvalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  approvalSub: { color: '#94a3b8', fontSize: 12 },
  decisionButtons: { flexDirection: 'row' },
  approveButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: '#fbbf24', flexDirection: 'row', alignItems: 'center', gap: 6 },
  approveButtonText: { color: '#1e1b4b', fontWeight: 'bold', fontSize: 12 },

  sectionContainer: { paddingHorizontal: 24 },
  rewardsList: { gap: 12 },
  rewardRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 1000, justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 32, padding: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#fbbf24' },
  modalTitle: { fontSize: 24, color: '#fbbf24', fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: 'rgba(30, 41, 59, 1)', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  modalCancelText: { color: '#64748b', fontWeight: 'bold' },
  modalPublish: { flex: 1, backgroundColor: '#fbbf24', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  modalPublishText: { color: '#1e1b4b', fontWeight: 'bold' },
  routineToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  routineToggleActive: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)', borderWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  routineLabel: { color: '#ccc', fontSize: 13 },

  // Stats Section Styles
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginTop: 8, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)' },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, marginTop: 4 },

  // Quick Actions Styles
  quickActionsSection: { paddingHorizontal: 24, marginBottom: 24 },
  quickActionsGrid: { flexDirection: 'row', gap: 12 },
  quickActionButton: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textAlign: 'center', lineHeight: 14 },

  // Template Styles
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  templateTitle: { color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  templateXpBadge: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  templateXpText: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  routineInfoCard: { padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 24 },

  bottomNav: {
    position: 'absolute', bottom: 24, left: 16, right: 16, height: 72,
    borderRadius: 36, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15, 23, 42, 0.9)'
  },
  navFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fbbf24', marginTop: -24, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0f172a' },
  navItem: { alignItems: 'center', gap: 4, width: 60 },
  navText: { fontSize: 10, color: '#64748b', fontWeight: '500' },

  // --- HERO GLASS DARK THEME STYLES ---
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 60, // Safe Area
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  parentNameText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  notificationButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  notificationBlur: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#0f172a',
  },

  // Bento Grid Styles
  bentoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
    height: 160,
  },
  bentoCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bentoCardLarge: {
    flex: 1.2, // Slightly wider
    padding: 20,
    justifyContent: 'space-between',
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bentoValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  bentoLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },

  bentoColumn: {
    flex: 0.8,
    gap: 12,
  },
  bentoCardSmall: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  glassContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoValueSmall: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bentoLabelSmall: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Action Strip Styles
  actionStrip: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  actionPillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#fbbf24',
    gap: 8,
  },
  actionPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Hero Carousel Styles
  heroCard: {
    width: Dimensions.get('window').width * 0.8,
    height: 380, // Taller card
    borderRadius: 32,
    marginRight: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    opacity: 0.5,
  },
  heroAvatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  heroAvatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  heroName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroClassBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  heroClassText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    justifyContent: 'center',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroStatLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Floating Dock Styles
  floatingDockContainer: {
    position: 'absolute',
    bottom: 34,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  floatingDock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 32,
    padding: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
  },
  dockItem: {
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dockFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40, // Pop out effect
    borderWidth: 4,
    borderColor: '#0f172a',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
});
