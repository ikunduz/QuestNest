import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Users, Sword, ShoppingBag, LayoutDashboard, Settings, MessageCircle, PawPrint, Castle } from 'lucide-react-native';

import { supabase } from './services/supabaseClient';
import { subscribeToQuests, fetchQuests, updateQuestStatus, addQuest } from './services/questService';
import { Role, Quest, UserState, Reward, ParentType } from './types';
import { INITIAL_REWARDS } from './constants';

// Screens
import { WelcomeScreen } from './views/WelcomeScreen';
import { FamilySetupScreen } from './views/FamilySetupScreen';
import { JoinFamilyScreen } from './views/JoinFamilyScreen';
import { ChildDashboard } from './views/ChildDashboard';
import { ParentDashboard } from './views/ParentDashboard';
import { TreasureRoom } from './views/TreasureRoom';
import { PinEntryScreen } from './views/PinEntryScreen';
import { FamilyNotesScreen } from './views/FamilyNotesScreen';
import { CreatureScreen } from './views/CreatureScreen';
import { CastleScreen } from './views/CastleScreen';

const Stack = createNativeStackNavigator();

type TabType = 'quests' | 'creature' | 'castle' | 'treasure' | 'notes';

const MainApp = ({ route, navigation }: any) => {
  const { initialUser } = route.params || {};

  // Null guard - kullanıcı yoksa Welcome'a yönlendir
  if (!initialUser) {
    navigation.replace('Welcome');
    return null;
  }

  const [user, setUser] = useState<UserState>(initialUser);
  const [role, setRole] = useState<Role>(initialUser.role);
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [rewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    loadQuests();
    const subscription = subscribeToQuests(user.family_id, () => loadQuests());
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadQuests = async () => {
    try {
      const data = await fetchQuests(user.family_id);
      const formattedQuests: Quest[] = data.map((q: any) => ({
        id: q.id,
        titleKey: q.title,
        description: q.description || '',
        xpReward: q.xp_reward,
        status: q.status,
        category: q.category,
        createdAt: new Date(q.created_at).getTime()
      }));
      setQuests(formattedQuests);
    } catch (e) {
      console.error('Failed to load quests:', e);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateQuestStatus(id, 'pending_approval');
      Alert.alert('🎯', 'Görev bildirildi! Ebeveyn onayı bekleniyor.');
      await loadQuests();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Görev bildirilemedi.');
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;
    try {
      await updateQuestStatus(id, 'completed');
      const newXp = user.xp + quest.xpReward;
      let newLevel = user.level;
      let remainingXp = newXp;
      if (newXp >= user.level * 100) {
        remainingXp = newXp - (user.level * 100);
        newLevel += 1;
      }
      await supabase.from('users').update({ xp: remainingXp, level: newLevel }).eq('id', user.id);
      setUser(prev => ({ ...prev, xp: remainingXp, level: newLevel }));
      Alert.alert('🎉', 'Görev onaylandı! Kahraman ödüllendirildi.');
      await loadQuests();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Görev onaylanamadı. Supabase RLS politikalarını kontrol et.');
      console.error(e);
    }
  };

  const handleAddQuest = async (q: Partial<Quest>) => {
    try {
      await addQuest({
        family_id: user.family_id,
        title: q.titleKey || 'Yeni Görev',
        description: q.description || 'Krallık emri!',
        xp_reward: q.xpReward || 25,
        category: q.category || 'magic',
        status: 'active',
        created_by: user.id
      });
      Alert.alert('✅', 'Görev eklendi!');
      await loadQuests();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Görev eklenemedi. Supabase RLS politikalarını kontrol et.');
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('quests').delete().eq('id', id);
      await loadQuests();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Görev silinemedi.');
      console.error(e);
    }
  };

  const handleSendBlessing = async (from: ParentType) => {
    try {
      const newXp = user.xp + 5;
      let newLevel = user.level;
      let remainingXp = newXp;
      if (newXp >= user.level * 100) { remainingXp = newXp - (user.level * 100); newLevel += 1; }
      await supabase.from('users').update({ xp: remainingXp, level: newLevel }).eq('id', user.id);
      setUser(prev => ({ ...prev, xp: remainingXp, level: newLevel, lastBlessingFrom: from }));
      setTimeout(() => setUser(prev => ({ ...prev, lastBlessingFrom: undefined })), 2100);
    } catch (e) { console.error(e); }
  };

  const handleRedeemReward = async (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward || user.xp < reward.cost) return;
    try {
      const newXp = user.xp - reward.cost;
      await supabase.from('users').update({ xp: newXp }).eq('id', user.id);
      setUser(prev => ({ ...prev, xp: newXp }));
    } catch (e) { console.error(e); }
  };

  const handleRoleSwitch = (newRole: Role) => {
    if (newRole === 'parent' && role === 'child') { setShowPin(true); }
    else { setRole(newRole); }
  };

  const handleUpdateUser = (updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  if (showPin) {
    return (
      <PinEntryScreen
        correctPin={user.pin_hash || "0000"}
        onSuccess={() => { setRole('parent'); setShowPin(false); }}
        onCancel={() => setShowPin(false)}
      />
    );
  }

  // Aktif tab içeriğini render et
  const renderContent = () => {
    if (role === 'parent') {
      return (
        <ParentDashboard
          quests={quests}
          onApprove={handleApprove}
          onAddQuest={handleAddQuest}
          onDelete={handleDelete}
          onSendBlessing={handleSendBlessing}
        />
      );
    }

    switch (activeTab) {
      case 'quests':
        return <ChildDashboard user={user} quests={quests} onComplete={handleComplete} onUpdateUser={handleUpdateUser} />;
      case 'creature':
        return <CreatureScreen userId={user.id} theme="hero" />;
      case 'castle':
        return <CastleScreen userId={user.id} theme="hero" />;
      case 'treasure':
        return <TreasureRoom xp={user.xp} rewards={rewards} onRedeem={handleRedeemReward} />;
      case 'notes':
        return <FamilyNotesScreen familyId={user.family_id} userId={user.id} userName={user.name} onBack={() => setActiveTab('quests')} />;
      default:
        return <ChildDashboard user={user} quests={quests} onComplete={handleComplete} onUpdateUser={handleUpdateUser} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Role Switcher */}
      <View style={styles.roleSwitcher}>
        <TouchableOpacity onPress={() => handleRoleSwitch('child')} style={[styles.roleButton, role === 'child' && styles.roleButtonActiveChild]}>
          <User size={18} color={role === 'child' ? '#0f172a' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRoleSwitch('parent')} style={[styles.roleButton, role === 'parent' && styles.roleButtonActiveParent]}>
          <Users size={18} color={role === 'parent' ? '#ffffff' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>{renderContent()}</View>

      {/* Bottom Navigation - Sadece çocuk modunda */}
      {role === 'child' && (
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setActiveTab('quests')} style={styles.navItem}>
            <Sword size={22} color={activeTab === 'quests' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'quests' && styles.navTextActive]}>Görevler</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('creature')} style={styles.navItem}>
            <PawPrint size={22} color={activeTab === 'creature' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'creature' && styles.navTextActive]}>Yaratık</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('castle')} style={styles.navItem}>
            <Castle size={22} color={activeTab === 'castle' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'castle' && styles.navTextActive]}>Kale</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('treasure')} style={styles.navItem}>
            <ShoppingBag size={22} color={activeTab === 'treasure' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'treasure' && styles.navTextActive]}>Hazine</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('notes')} style={styles.navItem}>
            <MessageCircle size={22} color={activeTab === 'notes' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'notes' && styles.navTextActive]}>Notlar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Parent Mode Navbar */}
      {role === 'parent' && (
        <View style={styles.navbar}>
          <View style={styles.navItem}>
            <LayoutDashboard size={22} color="#818cf8" />
            <Text style={[styles.navText, { color: '#818cf8' }]}>Yönetim</Text>
          </View>
          <TouchableOpacity onPress={() => setActiveTab('notes')} style={styles.navItem}>
            <MessageCircle size={22} color={activeTab === 'notes' ? '#818cf8' : '#64748b'} />
            <Text style={styles.navText}>Notlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, { opacity: 0.3 }]}>
            <Settings size={22} color="#64748b" />
            <Text style={styles.navText}>Ayarlar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialUser, setInitialUser] = useState<UserState | null>(null);

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('questnest_user');
      if (savedUser) { setInitialUser(JSON.parse(savedUser)); }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!initialUser ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
            <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
          </>
        ) : null}
        <Stack.Screen name="Main" component={MainApp} initialParams={{ initialUser }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  roleSwitcher: {
    position: 'absolute', top: 50, right: 16, zIndex: 100,
    flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#334155',
  },
  roleButton: { padding: 8, borderRadius: 8 },
  roleButtonActiveChild: { backgroundColor: '#f59e0b' },
  roleButtonActiveParent: { backgroundColor: '#6366f1' },
  navbar: {
    height: 70, backgroundColor: '#1e293b',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  navText: { fontSize: 9, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginTop: 4 },
  navTextActive: { color: '#fbbf24' },
});
