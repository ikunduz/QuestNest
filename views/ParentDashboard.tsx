import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell, Shield, Zap, TrendingUp, Check, X, Plus, Crown, Sparkles,
  CheckCircle2, DollarSign,
  LayoutDashboard, ClipboardList, BookOpen, Settings
} from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { Quest, QuestCategory, ParentType } from '../types';
import { CATEGORY_METADATA } from '../constants';

// Simulated Data for "Party Status" visual logic (since app focuses on single user context mainly)
const MOCK_PARTY = [
  { id: '1', name: 'Leo', role: 'Paladin', lvl: 4, xp: 800, maxXp: 1000, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7OniOqaon-5pl0Oo6aj2Hiem8xZmRsWscgoPIZTaNqyJ2I85HbnYKJRoud8-eBzhXUCZ_OgxtILlSkrOVZd4W_6tP7822Q69QviTSSAzFi_lOWQxL5moBApivWj-s4tSSrn7ldYkLC9lsdpfbZiVVkoEEIfQS-mt-J7kgtfqMWX8_dlElPMLz5F9kv8L-sj3DyRWr84x3bQaoljlwq90cKrU-nXHad79812CJchxx9U7abbE_gMR7LTSzYFdXOy11OuC6hpyp', roleLabel: 'Şövalye' },
  { id: '2', name: 'Mia', role: 'Rogue', lvl: 2, xp: 300, maxXp: 1000, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl2d-QJK7Yj6bke3zQ9eT6IUxeISPZfXwIZH4qiZb3nmK7Fx7wgUvd5AoAJ_RYlh8dP20upJgV-Fui2vteFLtlK3_0kXFleCKujv5BYjrnrYk7vi7wiZKOTekgXv6V5hH97WwDFJNnU7qin03eJb0yVsVyhbysTg9rXL4z3GViciQt8HANhD6zmR3spxqnVhT4mzJFK74aOzmaYE1iHx5JTugrvATcwCMoA9wt63y6ArLWkC_YXa2bm-5HyRyco_I6bKbJPtVp', roleLabel: 'Kuşatıcı' }
];

interface ParentDashboardProps {
  quests: Quest[];
  onApprove: (id: string, xpReward: number) => void;
  onAddQuest: (quest: Partial<Quest>) => void;
  onDelete: (id: string) => void;
  onSendBlessing: (from: ParentType) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ quests, onApprove, onAddQuest, onDelete, onSendBlessing }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [parentType, setParentType] = useState<ParentType>('dad');
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [isRoutine, setIsRoutine] = useState(false);

  const pendingQuests = quests.filter(q => q.status === 'pending_approval');

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header / Command Center */}
        <View style={styles.topSection}>
          <View style={styles.headerBar}>
            <View style={styles.profileGroup}>
              <View style={styles.parentAvatarContainer}>
                <View style={styles.parentAvatarGlow} />
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiw89H92O-0aflUjO2N9IHU3n4wWCrH8hT_4oFdSnTU7Y9FQtwXqAP4H7vPL5hnzCJjkl3K0570ACQdL5QjMVJWWWXF27zzUdoYK9-UZGOpLHCsaKSkSayVkGx-hnaalj8RcvUIU8gdeXM9nXlId-O2vF2i08ETSGMYc13Q9ycJ5ERMy2JbZ-f3niktucoA02OajAse_OXWArtu2cflA61N-R7PpRXCBcNKmy8FoUa4cpwn7Mnm6Ufxxs5qO6DQxDFs4WkxB96' }}
                  style={styles.parentAvatar}
                />
              </View>
              <View>
                <Text style={styles.parentRole}>LONCA USTASI</Text>
                <Text style={styles.parentName}>Yönetici Paneli</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notifButton}>
              <Bell size={20} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.greetingTitle}>Komuta Merkezi</Text>
            <Text style={styles.greetingSub}>Partinin görevlerini ve ödüllerini yönet.</Text>
          </View>
        </View>

        {/* Party Status (Horizontal Scroll) */}
        <View style={styles.partySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Parti Durumu</Text>
            <Text style={styles.viewAllText}>TÜMÜNÜ GÖR</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partyScroll}>
            {MOCK_PARTY.map((member) => (
              <BlurView key={member.id} intensity={20} tint="light" style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <View style={styles.memberAvatarContainer}>
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                    <View style={styles.memberIconOverlay}>
                      {member.id === '1' ? <Shield size={12} color="#fff" /> : <Zap size={12} color="#fff" />}
                    </View>
                  </View>
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={[styles.memberRole, { color: member.id === '1' ? '#fbbf24' : '#818cf8' }]}>
                      Svye {member.lvl} {member.roleLabel}
                    </Text>
                  </View>
                </View>
                <View style={styles.xpProgress}>
                  <View style={styles.xpTextRow}>
                    <Text style={styles.xpLabel}>XP İlerlemesi</Text>
                    <Text style={styles.xpLabel}>{member.xp}/{member.maxXp}</Text>
                  </View>
                  <View style={styles.xpTrack}>
                    <View
                      style={[
                        styles.xpFill,
                        { width: `${(member.xp / member.maxXp) * 100}%`, backgroundColor: member.id === '1' ? '#fbbf24' : '#818cf8' }
                      ]}
                    />
                  </View>
                </View>
              </BlurView>
            ))}

            {/* Quick Stats Widget (Allowance) */}
            <BlurView intensity={10} tint="light" style={styles.statsWidget}>
              <View style={styles.statIconBadge}>
                <DollarSign size={20} color="#fbbf24" />
              </View>
              <Text style={styles.statLabel}>Ödenek</Text>
              <Text style={styles.statValue}>15.00 ₺</Text>
            </BlurView>
          </ScrollView>
        </View>

        {/* Pending Approvals */}
        <View style={styles.approvalsSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionTitle}>Onay Bekleyenler</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{pendingQuests.length}</Text></View>
            </View>
          </View>

          {pendingQuests.length === 0 ? (
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
                      {quest.titleKey.toLowerCase().includes('dog') ? <Shield size={20} color="#818cf8" /> : <ClipboardList size={20} color="#818cf8" />}
                    </View>
                    <View>
                      <Text style={styles.approvalTitle}>{quest.titleKey}</Text>
                      <Text style={styles.approvalSub}>Görev Raporu • Az önce</Text>
                    </View>
                  </View>
                  <View style={styles.childTag}>
                    <Image source={{ uri: MOCK_PARTY[0].avatar }} style={styles.childTagAvatar} />
                    <Text style={styles.childTagName}>Leo</Text>
                  </View>
                </View>

                {/* Mock Image for "Clean Room" tasks */}
                {quest.titleKey.toLowerCase().includes('clean') && (
                  <View style={styles.proofImageContainer}>
                    <Image
                      source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANTOWmdjNslYeTpHrMA86Im4tTtjD7SGSJv-B6ovyQVgFlhlkl9QLOpCd5vUIYXIR0nCpfqVJO8UCp3bOaE4KAgEwDxFGcCPyRiHCmqadSZ00KDS97Iol7clgcHqFJgDmHdra-9Iqj-Vw_pw67UezgPd4RrxyRMnOLnPRtN2Ibvucz9K3v4rF4ZhjnhZqkYIWVYlrPvuLqg68uxsLnPsZsIpppHZkGkfn3Xvbj3wZrtkBKYcq1RuAWodDrtK1RygClAbCLBgya' }}
                      style={styles.proofImage}
                    />
                    <BlurView intensity={50} style={styles.proofBadge}>
                      <Text style={styles.proofText}>Kanıt Eklendi</Text>
                    </BlurView>
                  </View>
                )}

                <View style={styles.decisionButtons}>
                  <TouchableOpacity style={styles.rejectButton}>
                    <X size={20} color="#ef4444" />
                    <Text style={styles.rejectText}>Reddet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onApprove(quest.id, quest.xpReward)} style={styles.approveButton}>
                    <Check size={20} color="#1e1b4b" />
                    <Text style={styles.approveButtonText}>Onayla (+{quest.xpReward} XP)</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            ))
          )}
        </View>

        {/* Add Task Modal overlay */}
        {isAdding && (
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
                <Text style={styles.routineLabel}>Bu bir Günlük Rutin (Her gün tekrar eder)</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>İPTAL</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  if (!newQuestTitle) return;
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
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BlurView intensity={50} tint="dark" style={styles.bottomNav}>
        <View style={styles.navItem}>
          <LayoutDashboard size={24} color="#818cf8" />
          <Text style={[styles.navText, { color: '#818cf8', fontWeight: 'bold' }]}>Komut</Text>
        </View>
        <View style={styles.navItem}>
          <ClipboardList size={24} color="#64748b" />
          <Text style={styles.navText}>Görevler</Text>
        </View>

        <TouchableOpacity style={styles.navFab} onPress={() => setIsAdding(true)}>
          <Plus size={32} color="#1e1b4b" />
        </TouchableOpacity>

        <View style={styles.navItem}>
          <BookOpen size={24} color="#64748b" />
          <Text style={styles.navText}>Notlar</Text>
        </View>
        <View style={styles.navItem}>
          <Settings size={24} color="#64748b" />
          <Text style={styles.navText}>Ayarlar</Text>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingBottom: 100 },
  topSection: { padding: 24, paddingTop: 40 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  profileGroup: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  parentAvatarContainer: { width: 56, height: 56, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  parentAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#818cf8' },
  parentAvatarGlow: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#818cf8', opacity: 0.3 },
  parentRole: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  parentName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  notifButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#fbbf24', borderRadius: 4 },
  greeting: { marginTop: 16 },
  greetingTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  greetingSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },

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

  statsWidget: { width: 140, padding: 16, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', height: 140, borderStyle: 'dashed' },
  statIconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(251, 191, 36, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  approvalsSection: { marginTop: 32, paddingHorizontal: 24 },
  countBadge: { backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, },
  countText: { color: '#1e1b4b', fontSize: 12, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 32, opacity: 0.5 },
  emptyText: { color: '#fff', marginTop: 12 },

  approvalCard: { padding: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  approvalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  approvalInfo: { flexDirection: 'row', gap: 12 },
  approvalIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  approvalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  approvalSub: { color: '#94a3b8', fontSize: 12 },
  childTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingRight: 8, paddingLeft: 4, paddingVertical: 4, borderRadius: 12, gap: 4 },
  childTagAvatar: { width: 24, height: 24, borderRadius: 12 },
  childTagName: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  proofImageContainer: { height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  proofImage: { width: '100%', height: '100%' },
  proofBadge: { position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  proofText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  decisionButtons: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', gap: 8 },
  rejectText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 24, backgroundColor: '#fbbf24', gap: 8 },
  approveButtonText: { color: '#1e1b4b', fontWeight: 'bold', fontSize: 14 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 1000, justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 32, padding: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#fbbf24' },
  modalTitle: { fontSize: 24, color: '#fbbf24', fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  modalCancelText: { color: '#64748b', fontWeight: 'bold' },
  modalPublish: { flex: 1, backgroundColor: '#fbbf24', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  modalPublishText: { color: '#1e1b4b', fontWeight: 'bold' },

  routineToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  routineToggleActive: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)', borderWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  routineLabel: { color: '#ccc', fontSize: 13 },

  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 72,
    borderRadius: 36,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)'
  },
  navFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fbbf24', marginTop: -24, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0f172a' },
  navItem: { alignItems: 'center', gap: 4, width: 60 },
  navText: { fontSize: 10, color: '#64748b', fontWeight: '500' }
});
