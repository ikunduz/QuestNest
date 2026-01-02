import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Users, Sword, ShoppingBag, LayoutDashboard, Settings, MessageCircle, PawPrint, Castle } from 'lucide-react-native';

import { supabase } from './services/supabaseClient';
import { subscribeToQuests, fetchQuests, updateQuestStatus, addQuest } from './services/questService';
import { Role, Quest, UserState, Reward, PetState, ParentType } from './types';
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

import { GameHub } from './views/GameHub';
// ... existing imports

type TabType = 'quests' | 'game' | 'treasure' | 'notes';




// ... rest of App component

const MainApp = ({ route, navigation }: any) => {
  const { initialUser } = route.params || {};

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
  const [pet, setPet] = useState<PetState>({
    id: 'ignis-1',
    name: 'Ignis',
    type: 'ATEŞ EJDERHASI',
    level: 1,
    stage: 'egg',
    evolution: 0,
    goldSpent: 0,
    happiness: 100,
    energy: 100,
    lastUpdate: Date.now()
  });

  useEffect(() => {
    loadQuests();
    const subscription = subscribeToQuests(user.family_id, () => loadQuests());

    const loadPetState = async () => {
      try {
        const storedPet = await AsyncStorage.getItem(`@pet_state_${user.id}`);
        if (storedPet) {
          setPet(JSON.parse(storedPet));
        }
      } catch (e) {
        console.error('Failed to load pet state from AsyncStorage', e);
      }
    };
    loadPetState();

    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const savePetState = async () => {
      try {
        await AsyncStorage.setItem(`@pet_state_${user.id}`, JSON.stringify(pet));
      } catch (e) {
        console.error('Failed to save pet state to AsyncStorage', e);
      }
    };
    savePetState();
  }, [pet, user.id]);

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
        createdAt: new Date(q.created_at).getTime(),
        type: q.type || 'daily',
        completedAt: q.completed_at ? new Date(q.completed_at).getTime() : undefined
      }));
      setQuests(formattedQuests);
    } catch (e) {
      console.error('Failed to load quests:', e);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateQuestStatus(id, 'pending_approval');
      Alert.alert('Tebrikler!', 'Görev tamamlandı ve onay bekliyor!');
      loadQuests();
    } catch (e) {
      Alert.alert('Hata', 'Görev güncellenemedi.');
    }
  };

  const handleApprove = async (id: string, xpReward: number) => {
    try {
      await updateQuestStatus(id, 'completed');
      const newXp = user.xp + xpReward;
      setUser(prev => ({ ...prev, xp: newXp }));
      loadQuests();
      Alert.alert('Onaylandı!', `Görev onaylandı. +${xpReward} XP!`);
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız.');
    }
  };

  const handleAddQuest = async (questData: Partial<Quest>) => {
    try {
      await addQuest({
        family_id: user.family_id,
        title: questData.titleKey,
        description: questData.description,
        xp_reward: questData.xpReward,
        category: questData.category,
        status: 'active'
      });
      loadQuests();
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Görev eklenemedi.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('quests').delete().eq('id', id);
      if (error) throw error;
      loadQuests();
    } catch (e) { console.error(e); }
  };

  const handleSendBlessing = async (senderType: ParentType) => {
    try {
      const newXp = user.xp + 50;
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

  const handleUpdatePet = (updates: Partial<PetState>) => {
    setPet(prev => ({ ...prev, ...updates }));
  };

  const handleRedeemReward = (reward: Reward) => {
    if (user.xp < reward.cost) {
      Alert.alert('Yetersiz Altın', 'Bu ödülü almak için daha fazla altına ihtiyacın var!');
      return;
    }
    // Ödül talep mantığı buraya gelecek
    Alert.alert('Tebrikler!', `${reward.name} talebiniz ebeveyninize iletildi.`);
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

  const renderContent = () => {
    if (activeTab === 'notes') {
      return <FamilyNotesScreen familyId={user.family_id} userId={user.id} userName={user.name} onBack={() => setActiveTab('quests')} />;
    }

    if (role === 'parent') {
      return (
        <ParentDashboard
          quests={quests}
          onApprove={handleApprove}
          onAddQuest={handleAddQuest}
          onDelete={handleDelete}
          onSendBlessing={handleSendBlessing}
          onExit={() => handleRoleSwitch('child')}
        />
      );
    }

    switch (activeTab) {
      case 'quests':
        return <ChildDashboard user={user} quests={quests} onComplete={handleComplete} onUpdateUser={handleUpdateUser} />;
      case 'game':
        return (
          <GameHub
            user={user}
            pet={pet}
            onUpdateUser={handleUpdateUser}
            onUpdatePet={handleUpdatePet}
          />
        );
      case 'treasure':
        return <TreasureRoom xp={user.xp} rewards={rewards} onRedeem={(reward) => handleRedeemReward(reward)} />;
      default:
        return <ChildDashboard user={user} quests={quests} onComplete={handleComplete} onUpdateUser={handleUpdateUser} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>{renderContent()}</View>

      {role === 'child' && (
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setActiveTab('quests')} style={styles.navItem}>
            <Sword size={22} color={activeTab === 'quests' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'quests' && { color: '#fbbf24' }]}>GÖREVLER</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('game')} style={styles.navItem}>
            <View style={{ flexDirection: 'row' }}>
              <PawPrint size={18} color={activeTab === 'game' ? '#fbbf24' : '#64748b'} style={{ marginRight: -4 }} />
              <Castle size={18} color={activeTab === 'game' ? '#fbbf24' : '#64748b'} />
            </View>
            <Text style={[styles.navText, activeTab === 'game' && { color: '#fbbf24' }]}>OYUN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('treasure')} style={styles.navItem}>
            <ShoppingBag size={22} color={activeTab === 'treasure' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'treasure' && { color: '#fbbf24' }]}>HAZİNE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('notes')} style={styles.navItem}>
            <MessageCircle size={22} color={activeTab === 'notes' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'notes' && { color: '#fbbf24' }]}>NOTLAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRoleSwitch('parent')} style={styles.navItem}>
            <Users size={22} color='#64748b' />
            <Text style={styles.navText}>EBEVEYN</Text>
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
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
          <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
          <Stack.Screen name="Main" component={MainApp} initialParams={{ initialUser }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  roleSwitcher: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    zIndex: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  roleButton: { padding: 6, borderRadius: 14 },
  roleButtonActiveChild: { backgroundColor: '#fbbf24' },
  roleButtonActiveParent: { backgroundColor: '#6366f1' },
  navbar: {
    height: 70, backgroundColor: '#1e293b',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#334155',
  },
  navItem: { alignItems: 'center', gap: 4 },
  navText: { color: '#64748b', fontSize: 9, fontWeight: '800' },
});
