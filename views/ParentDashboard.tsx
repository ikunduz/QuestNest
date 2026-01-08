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
import i18n from '../i18n';

// Interface for family members
interface FamilyMember {
  id: string;
  name: string;
  xp: number;
  level: number;
  avatar?: string;
  hero_class?: 'knight' | 'mage' | 'ranger';
}

// Hero class labels - now using i18n
const getHeroClassLabel = (heroClass: string) => {
  const labels: Record<string, { label: string; color: string }> = {
    knight: { label: i18n.t('parent.knight'), color: '#fbbf24' },
    mage: { label: i18n.t('parent.mage'), color: '#818cf8' },
    ranger: { label: i18n.t('parent.ranger'), color: '#10b981' },
  };
  return labels[heroClass] || labels.knight;
};

// Quest Templates for quick adding - using i18n
const getQuestTemplates = () => [
  { title: i18n.t('questTemplates.cleanRoom'), category: 'clean', xp: 25, icon: '🧹' },
  { title: i18n.t('questTemplates.readBook'), category: 'study', xp: 30, icon: '📚' },
  { title: i18n.t('questTemplates.doHomework'), category: 'study', xp: 35, icon: '✍️' },
  { title: i18n.t('questTemplates.brushTeeth'), category: 'care', xp: 10, icon: '🪥' },
  { title: i18n.t('questTemplates.eatVegetables'), category: 'care', xp: 20, icon: '🥦' },
  { title: i18n.t('questTemplates.collectToys'), category: 'clean', xp: 20, icon: '🧸' },
  { title: i18n.t('questTemplates.makeYourBed'), category: 'clean', xp: 15, icon: '🛏️' },
  { title: i18n.t('questTemplates.funActivity'), category: 'magic', xp: 25, icon: '✨' },
  { title: i18n.t('questTemplates.doSports'), category: 'care', xp: 30, icon: '⚽' },
  { title: i18n.t('questTemplates.draw'), category: 'magic', xp: 20, icon: '🎨' },
  { title: i18n.t('questTemplates.listenMusic'), category: 'magic', xp: 15, icon: '🎵' },
  { title: i18n.t('questTemplates.helpCleanHouse'), category: 'clean', xp: 40, icon: '🏠' },
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

        {/* BABA-DOSTU HEADER - 2 Satır */}
        <View style={styles.dadHeader}>
          <View>
            <Text style={styles.dadGreetingSmall}>{i18n.t('parent.hello')}</Text>
            <Text style={styles.dadGreetingBig}>{parentType === 'dad' ? i18n.t('parent.dad') : i18n.t('parent.mom')} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.dadNotifBtn}
            onPress={() => Alert.alert('📬', i18n.t('parent.notificationsSoon'))}
          >
            <Bell size={22} color="#fbbf24" />
            {pendingQuests.length > 0 && <View style={styles.dadNotifDot} />}
          </TouchableOpacity>
        </View>

        {/* Tab View Wrapper */}
        {activeTab === 'dashboard' ? (
          <>
            {/* ÇOCUK KARTI - Tam Genişlik, Yatay Kaydırmalı */}
            {familyMembers.length > 0 && (
              <View style={styles.dadChildSection}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {familyMembers.map((member, index) => {
                    const heroConfig = getHeroClassLabel(member.hero_class || 'knight');
                    const isPhotoUrl = member.avatar && (member.avatar.startsWith('http') || member.avatar.startsWith('file://'));
                    const heroEmoji = member.hero_class === 'mage' ? '🔮' : member.hero_class === 'ranger' ? '🏹' : '🛡️';
                    const avatarEmoji = member.avatar && !isPhotoUrl ? getAvatarEmoji(member.avatar) : heroEmoji;

                    return (
                      <View key={member.id} style={styles.dadChildCardFull}>
                        <View style={[styles.dadChildAvatar, { borderColor: heroConfig.color }]}>
                          {isPhotoUrl ? (
                            <Image source={{ uri: member.avatar }} style={styles.dadChildAvatarImg} />
                          ) : (
                            <Text style={{ fontSize: 36 }}>{avatarEmoji}</Text>
                          )}
                        </View>
                        <View style={styles.dadChildInfo}>
                          <Text style={styles.dadChildName}>{member.name}</Text>
                          <Text style={[styles.dadChildClass, { color: heroConfig.color }]}>
                            {heroConfig.label} • {i18n.t('child.level')} {member.level || 1}
                          </Text>
                          <View style={styles.dadChildStats}>
                            <View style={styles.dadChildStat}>
                              <Sparkles size={16} color="#fbbf24" />
                              <Text style={styles.dadChildStatText}>{member.xp || 0} {i18n.t('common.gold')}</Text>
                            </View>
                          </View>
                        </View>
                        {/* Birden fazla çocuk varsa sayfa göstergesi */}
                        {familyMembers.length > 1 && (
                          <View style={styles.dadChildPageIndicator}>
                            <Text style={styles.dadChildPageText}>{index + 1}/{familyMembers.length}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ONAY BEKLEYENLer - EN ÜST PRİORİTE */}
            {pendingQuests.length > 0 && (
              <View style={styles.dadApprovalSection}>
                <View style={styles.dadApprovalHeader}>
                  <Bell size={20} color="#ef4444" />
                  <Text style={styles.dadApprovalTitle}>
                    {pendingQuests.length} {i18n.t('parent.questsWaitingApproval')}
                  </Text>
                </View>
                {pendingQuests.slice(0, 3).map((quest) => (
                  <View key={quest.id} style={styles.dadApprovalItem}>
                    <View style={styles.dadApprovalLeft}>
                      <Text style={styles.dadApprovalQuest}>{quest.titleKey}</Text>
                      <Text style={styles.dadApprovalReward}>+{quest.xpReward} {i18n.t('common.gold')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dadApproveBtn}
                      onPress={() => onApprove(quest.id, quest.xpReward)}
                    >
                      <Check size={20} color="#fff" />
                      <Text style={styles.dadApproveBtnText}>{i18n.t('parent.approve')}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* DURUM PANELİ - Kompakt */}
            <View style={styles.dadStatusPanel}>
              <View style={styles.dadStatusItem}>
                <View style={[styles.dadStatusIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <CheckCircle2 size={20} color="#10b981" />
                </View>
                <Text style={styles.dadStatusNumber}>
                  {quests.filter(q => q.status === 'completed').length}
                </Text>
                <Text style={styles.dadStatusLabel}>{i18n.t('parent.completedQuests')}</Text>
              </View>
              <View style={styles.dadStatusDivider} />
              <View style={styles.dadStatusItem}>
                <View style={[styles.dadStatusIcon, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                  <Sparkles size={20} color="#fbbf24" />
                </View>
                <Text style={styles.dadStatusNumber}>
                  {familyMembers.reduce((sum, m) => sum + m.xp, 0)}
                </Text>
                <Text style={styles.dadStatusLabel}>{i18n.t('parent.totalGold')}</Text>
              </View>
              <View style={styles.dadStatusDivider} />
              <View style={styles.dadStatusItem}>
                <View style={[styles.dadStatusIcon, { backgroundColor: 'rgba(129, 140, 248, 0.2)' }]}>
                  <Users size={20} color="#818cf8" />
                </View>
                <Text style={styles.dadStatusNumber}>{familyMembers.length}</Text>
                <Text style={styles.dadStatusLabel}>{i18n.t('parent.children')}</Text>
              </View>
            </View>

            {/* ANA BUTONLAR - BÜYÜK & NET */}
            <View style={styles.dadMainActions}>
              <TouchableOpacity
                style={styles.dadBigButton}
                onPress={() => setIsAdding(true)}
              >
                <Plus size={24} color="#1e1b4b" />
                <Text style={styles.dadBigButtonText}>{i18n.t('parent.addQuest')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dadBigButton, styles.dadBigButtonSecondary]}
                onPress={() => setIsAddingReward(true)}
              >
                <Gift size={24} color="#fbbf24" />
                <Text style={[styles.dadBigButtonText, { color: '#fbbf24' }]}>{i18n.t('parent.addReward')}</Text>
              </TouchableOpacity>
            </View>

            {/* EK İŞLEMLER - Küçük */}
            <View style={styles.dadSecondaryActions}>
              <TouchableOpacity
                style={styles.dadSmallBtn}
                onPress={() => {
                  if (familyMembers.length === 0) return Alert.alert(i18n.t('common.warning'), i18n.t('parent.noChildren'));
                  setSelectedChild(familyMembers[0]);
                  setShowBonusModal(true);
                }}
              >
                <DollarSign size={18} color="#10b981" />
                <Text style={styles.dadSmallBtnText}>{i18n.t('parent.giveBonus')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dadSmallBtn}
                onPress={() => {
                  onSendBlessing(parentType);
                  setShowCelebrationSent(true);
                  setTimeout(() => setShowCelebrationSent(false), 2000);
                }}
              >
                <Heart size={18} color="#f472b6" />
                <Text style={styles.dadSmallBtnText}>{i18n.t('parent.celebrate')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dadSmallBtn}
                onPress={() => {
                  if (storedFamilyCode) {
                    Share.share({ message: `${i18n.t('parent.familyCodeShare')} ${storedFamilyCode}` });
                  }
                }}
              >
                <Share2 size={18} color="#818cf8" />
                <Text style={styles.dadSmallBtnText}>{i18n.t('parent.invite')}</Text>
              </TouchableOpacity>
            </View>

            {/* Onay Yoksa Mutlu Mesaj */}
            {pendingQuests.length === 0 && (
              <View style={styles.dadAllDone}>
                <Text style={styles.dadAllDoneEmoji}>✅</Text>
                <Text style={styles.dadAllDoneText}>{i18n.t('parent.noQuestsPending')}</Text>
              </View>
            )}
          </>
        ) : null}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{i18n.t('parent.shopManagement')}</Text>
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
                      <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>{reward.cost} {i18n.t('common.gold')}</Text>
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
                <Text style={styles.sectionTitle}>{i18n.t('parent.weeklySummary')}</Text>
              </View>

              <View style={styles.statsContainer}>
                <BlurView intensity={15} tint="light" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#10b98120' }]}>
                    <CheckCircle2 size={20} color="#10b981" />
                  </View>
                  <Text style={styles.statValue}>
                    {quests.filter(q => q.status === 'completed').length}
                  </Text>
                  <Text style={styles.statLabel}>{i18n.t('parent.completedQuests')}</Text>
                </BlurView>
                <BlurView intensity={15} tint="light" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#fbbf2420' }]}>
                    <Sparkles size={20} color="#fbbf24" />
                  </View>
                  <Text style={styles.statValue}>
                    {familyMembers.reduce((sum, m) => sum + m.xp, 0)}
                  </Text>
                  <Text style={styles.statLabel}>{i18n.t('parent.totalGold')}</Text>
                </BlurView>
                <BlurView intensity={15} tint="light" style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#818cf820' }]}>
                    <TrendingUp size={20} color="#818cf8" />
                  </View>
                  <Text style={styles.statValue}>
                    {Math.ceil(quests.filter(q => q.status === 'completed').length / 7 * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>{i18n.t('parent.successRate')}</Text>
                </BlurView>
              </View>

              {/* Quest Templates */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>{i18n.t('parent.quickTemplates')}</Text>
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16, paddingHorizontal: 0 }}>
                {i18n.t('parent.templateTip')}
              </Text>

              <View style={styles.templatesGrid}>
                {getQuestTemplates().map((template, idx) => (
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
                      Alert.alert(i18n.t('parent.questAdded'), `"${template.title}"`);
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
                <Text style={styles.sectionTitle}>{i18n.t('parent.routineManagement')}</Text>
              </View>
              <BlurView intensity={15} tint="light" style={styles.routineInfoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.statIconBox, { backgroundColor: '#a855f720' }]}>
                    <ClipboardList size={20} color="#a855f7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>{i18n.t('parent.dailyRoutines')}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                      {quests.filter(q => q.type === 'routine').length} {i18n.t('parent.activeRoutines')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: '#a855f7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                    onPress={() => {
                      setIsRoutine(true);
                      setIsAdding(true);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{i18n.t('parent.addRoutine')}</Text>
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
              <Text style={styles.modalTitle}>{i18n.t('parent.newReward')}</Text>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 }}>{i18n.t('parent.selectIcon')}</Text>
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
                placeholder={i18n.t('parent.rewardName')}
                placeholderTextColor="#94a3b8"
                value={newRewardTitle}
                onChangeText={setNewRewardTitle}
              />
              <TextInput
                style={styles.input}
                placeholder={i18n.t('parent.price')}
                placeholderTextColor="#94a3b8"
                value={newRewardCost}
                onChangeText={setNewRewardCost}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsAddingReward(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>{i18n.t('parent.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddRewardSubmit} style={styles.modalPublish}>
                  <Text style={styles.modalPublishText}>{i18n.t('parent.add')}</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )
      }

      {showBonusModal && selectedChild && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalContent}>
            <Text style={styles.modalTitle}>{i18n.t('parent.bonusGold')}</Text>

            {/* Child Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 }}>{i18n.t('parent.selectChild')}</Text>
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
              <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>{i18n.t('parent.goldAmount')}</Text>
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
                <Text style={styles.modalCancelText}>{i18n.t('parent.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!selectedChild) return;
                  onSendBlessing('dad');
                  Alert.alert(
                    i18n.t('parent.bonusSent'),
                    `${i18n.t('parent.goldAdded')} ${selectedChild.name}! +${bonusAmount}`
                  );
                  setShowBonusModal(false);
                }}
                style={[styles.modalPublish, { backgroundColor: '#10b981' }]}
              >
                <Text style={styles.modalPublishText}>{i18n.t('parent.send')}</Text>
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
              <Text style={styles.modalTitle}>{i18n.t('parent.newQuestOrder')}</Text>
              <TextInput
                style={styles.input}
                placeholder={i18n.t('parent.questTitle')}
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
                <Text style={styles.routineLabel}>{i18n.t('parent.dailyRoutine')}</Text>
              </TouchableOpacity>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>{i18n.t('parent.cancel')}</Text>
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
                  <Text style={styles.modalPublishText}>{i18n.t('parent.publish')}</Text>
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
            <Shield size={24} color="#60a5fa" />
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

  // === BABA-DOSTU STİLLER ===
  dadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  dadGreetingSmall: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  dadGreetingBig: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dadNotifBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    position: 'relative',
  },
  dadNotifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },

  // Çocuk Kartları
  dadChildSection: {
    marginBottom: 16,
  },
  dadChildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 200,
  },
  dadChildCardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: Dimensions.get('window').width - 32,
    marginRight: 12,
  },
  dadChildPageIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dadChildPageText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dadChildAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dadChildAvatarImg: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  dadChildInfo: {
    flex: 1,
  },
  dadChildName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dadChildClass: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dadChildStats: {
    flexDirection: 'row',
    gap: 8,
  },
  dadChildStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dadChildStatText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Onay Bölümü
  dadApprovalSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dadApprovalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dadApprovalTitle: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dadApprovalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  dadApprovalLeft: {
    flex: 1,
  },
  dadApprovalQuest: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dadApprovalReward: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dadApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  dadApproveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Durum Paneli
  dadStatusPanel: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dadStatusItem: {
    alignItems: 'center',
  },
  dadStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dadStatusNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dadStatusLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  dadStatusDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Ana Butonlar
  dadMainActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  dadBigButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    borderRadius: 16,
  },
  dadBigButtonSecondary: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  dadBigButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },

  // Küçük İşlem Butonları
  dadSecondaryActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  dadSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dadSmallBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },

  // Bekleyen Görev Yok Mesajı
  dadAllDone: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  dadAllDoneEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  dadAllDoneText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
});
