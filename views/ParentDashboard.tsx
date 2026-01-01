
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LayoutDashboard, Plus, CheckCircle, Clock, TrendingUp, X, Heart, Star, UserCheck, Zap } from 'lucide-react-native';
import { GameButton } from '../components/GameButton';
import { Quest, QuestCategory, ParentType } from '../types';
import { CATEGORY_METADATA } from '../constants';

interface ParentDashboardProps {
  quests: Quest[];
  onApprove: (id: string) => void;
  onAddQuest: (quest: Partial<Quest>) => void;
  onDelete: (id: string) => void;
  onSendBlessing: (from: ParentType) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ quests, onApprove, onAddQuest, onDelete, onSendBlessing }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [parentType, setParentType] = useState<ParentType>('mom');
  const [newQuestTitle, setNewQuestTitle] = useState('');

  const pendingQuests = quests.filter(q => q.status === 'pending_approval');
  const activeQuests = quests.filter(q => q.status === 'active');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Parent Identity Switcher */}
      <View style={styles.identitySwitcher}>
        <TouchableOpacity
          onPress={() => setParentType('mom')}
          style={[styles.identityBtn, parentType === 'mom' && styles.identityBtnMom]}
        >
          <Heart size={18} color={parentType === 'mom' ? '#fff' : '#64748b'} />
          <Text style={[styles.identityText, parentType === 'mom' && styles.identityTextActive]}>ANNE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setParentType('dad')}
          style={[styles.identityBtn, parentType === 'dad' && styles.identityBtnDad]}
        >
          <UserCheck size={18} color={parentType === 'dad' ? '#fff' : '#64748b'} />
          <Text style={[styles.identityText, parentType === 'dad' && styles.identityTextActive]}>BABA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>BİLGE KUMANDASI</Text>
          <Text style={styles.subtitle}>{parentType === 'mom' ? 'Kraliçe' : 'Kral'} Denetimi</Text>
        </View>
        <GameButton onPress={() => setIsAdding(true)} variant="primary" style={styles.addBtn}>
          <Plus color="#0f172a" />
        </GameButton>
      </View>

      {/* Interactions */}
      <View style={styles.blessingSection}>
        <Text style={styles.sectionLabel}>KAHRAMANA LÜTUF GÖNDER</Text>
        <GameButton
          variant="secondary"
          style={styles.blessingBtn}
          onPress={() => onSendBlessing(parentType)}
        >
          <Zap color="#fff" />
          <Text style={styles.blessingBtnText}>ANLIK LÜTUF GÖNDER (+5 XP)</Text>
        </GameButton>
        <Text style={styles.helperText}>Çocuğun ekranında parlayacak ve moral verecektir.</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Clock color="#60a5fa" />
          <View>
            <Text style={styles.statValue}>{activeQuests.length}</Text>
            <Text style={styles.statLabel}>Süratli Görev</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <CheckCircle color="#34d399" />
          <View>
            <Text style={styles.statValue}>{quests.filter(q => q.status === 'completed').length}</Text>
            <Text style={styles.statLabel}>Zafer Sayısı</Text>
          </View>
        </View>
      </View>

      {/* Pending Approvals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ONAY BEKLEYEN RAPORLAR</Text>
        {pendingQuests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Kahraman henüz rapor göndermedi.</Text>
          </View>
        ) : (
          pendingQuests.map(quest => (
            <View key={quest.id} style={styles.pendingCard}>
              <View style={[styles.pendingIcon, { backgroundColor: CATEGORY_METADATA[quest.category].color.replace('bg-', '').replace('-500', '') }]}>
                {React.cloneElement(CATEGORY_METADATA[quest.category].icon as React.ReactElement, { color: '#fff' })}
              </View>
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingTitle}>{quest.titleKey}</Text>
                <GameButton onPress={() => onApprove(quest.id)} style={styles.approveBtn}>ONAYLA</GameButton>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Active Quests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AKTİF EMİRLER</Text>
        {activeQuests.map(quest => (
          <View key={quest.id} style={styles.activeQuestItem}>
            <View style={styles.activeQuestInfo}>
              {React.cloneElement(CATEGORY_METADATA[quest.category].icon as React.ReactElement, { size: 16, color: '#64748b' })}
              <Text style={styles.activeQuestTitle}>{quest.titleKey}</Text>
            </View>
            <TouchableOpacity onPress={() => onDelete(quest.id)}>
              <X color="#f43f5e" size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Add Task Modal overlay */}
      {isAdding && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>YENİ EMİR</Text>
            <TextInput
              style={styles.input}
              placeholder="Görev Başlığı"
              placeholderTextColor="#64748b"
              value={newQuestTitle}
              onChangeText={setNewQuestTitle}
            />
            <View style={styles.modalButtons}>
              <GameButton variant="ghost" onPress={() => setIsAdding(false)} style={styles.modalBtn}>İPTAL</GameButton>
              <GameButton onPress={() => {
                if (!newQuestTitle) return;
                onAddQuest({ titleKey: newQuestTitle, xpReward: 25, category: 'magic' });
                setNewQuestTitle('');
                setIsAdding(false);
              }} style={styles.modalBtn}>YAYINLA</GameButton>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  identitySwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignSelf: 'center',
    marginBottom: 24,
  },
  identityBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  identityBtnMom: { backgroundColor: '#e11d48' },
  identityBtnDad: { backgroundColor: '#3b82f6' },
  identityText: { color: '#64748b', fontWeight: 'bold', marginLeft: 8, fontSize: 12 },
  identityTextActive: { color: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: 20, borderRadius: 24, marginBottom: 24 },
  title: { fontSize: 20, color: '#fbbf24', fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  addBtn: { width: 48, height: 48, borderRadius: 24, paddingHorizontal: 0 },
  blessingSection: { backgroundColor: 'rgba(251, 191, 36, 0.05)', padding: 20, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(251, 191, 36, 0.1)', marginBottom: 24, alignItems: 'center' },
  sectionLabel: { fontSize: 10, color: '#fbbf24', fontWeight: 'bold', marginBottom: 16, letterSpacing: 1 },
  blessingBtn: { width: '100%', paddingVertical: 16 },
  blessingBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  helperText: { fontSize: 10, color: '#64748b', marginTop: 12, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 12 },
  statValue: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, color: '#94a3b8', fontWeight: 'bold', marginBottom: 16 },
  emptyBox: { padding: 32, backgroundColor: 'rgba(30, 41, 59, 0.2)', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#1e293b', alignItems: 'center' },
  emptyText: { color: '#475569', fontStyle: 'italic' },
  pendingCard: { backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: 16, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(79, 70, 229, 0.3)', flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pendingIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  pendingInfo: { flex: 1, marginLeft: 16 },
  pendingTitle: { color: '#e0e7ff', fontWeight: 'bold', fontSize: 16 },
  approveBtn: { paddingVertical: 8, marginTop: 8 },
  activeQuestItem: { backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeQuestInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeQuestTitle: { color: '#fff', fontSize: 14 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 1000, justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 32, padding: 32, borderWidth: 2, borderColor: '#fbbf24' },
  modalTitle: { fontSize: 24, color: '#fbbf24', fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, marginBottom: 24, borderWidth: 2, borderColor: '#334155' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
