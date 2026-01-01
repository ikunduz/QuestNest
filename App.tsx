import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Users, Sword, ShoppingBag, LayoutDashboard, Settings } from 'lucide-react-native';

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

const Stack = createNativeStackNavigator();

const MainApp = ({ route }: any) => {
  const { initialUser } = route.params;
  const [user, setUser] = useState<UserState>(initialUser);
  const [role, setRole] = useState<Role>(initialUser.role);
  const [activeTab, setActiveTab] = useState<'map' | 'shop'>('map');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [rewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    // İlk görevleri çek
    loadQuests();

    // Realtime dinle
    const subscription = subscribeToQuests(user.family_id, () => {
      loadQuests();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadQuests = async () => {
    try {
      const data = await fetchQuests(user.family_id);
      // Supabase formatını uygulama formatına dönüştür
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

  // Çocuk görevi tamamladı (onay bekliyor)
  const handleComplete = async (id: string) => {
    try {
      await updateQuestStatus(id, 'pending_approval');
    } catch (e) {
      console.error(e);
    }
  };

  // Ebeveyn görevi onayladı
  const handleApprove = async (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;

    try {
      await updateQuestStatus(id, 'completed');

      // XP güncelle
      const newXp = user.xp + quest.xpReward;
      let newLevel = user.level;
      let remainingXp = newXp;

      if (newXp >= user.level * 100) {
        remainingXp = newXp - (user.level * 100);
        newLevel += 1;
      }

      await supabase
        .from('users')
        .update({ xp: remainingXp, level: newLevel })
        .eq('id', user.id);

      setUser(prev => ({ ...prev, xp: remainingXp, level: newLevel }));
    } catch (e) {
      console.error(e);
    }
  };

  // Yeni görev ekle
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
    } catch (e) {
      console.error(e);
    }
  };

  // Görev sil
  const handleDelete = async (id: string) => {
    try {
      await supabase.from('quests').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  // Lütuf gönder
  const handleSendBlessing = async (from: ParentType) => {
    try {
      const newXp = user.xp + 5;
      let newLevel = user.level;
      let remainingXp = newXp;

      if (newXp >= user.level * 100) {
        remainingXp = newXp - (user.level * 100);
        newLevel += 1;
      }

      await supabase
        .from('users')
        .update({ xp: remainingXp, level: newLevel })
        .eq('id', user.id);

      setUser(prev => ({ ...prev, xp: remainingXp, level: newLevel, lastBlessingFrom: from }));

      setTimeout(() => {
        setUser(prev => ({ ...prev, lastBlessingFrom: undefined }));
      }, 2100);
    } catch (e) {
      console.error(e);
    }
  };

  // Ödül satın al
  const handleRedeemReward = async (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward || user.xp < reward.cost) return;

    try {
      const newXp = user.xp - reward.cost;
      await supabase
        .from('users')
        .update({ xp: newXp })
        .eq('id', user.id);

      setUser(prev => ({ ...prev, xp: newXp }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = (newRole: Role) => {
    if (newRole === 'parent' && role === 'child') {
      setShowPin(true);
    } else {
      setRole(newRole);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Role Switcher */}
      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          onPress={() => handleRoleSwitch('child')}
          style={[styles.roleButton, role === 'child' && styles.roleButtonActiveChild]}
        >
          <User size={18} color={role === 'child' ? '#0f172a' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRoleSwitch('parent')}
          style={[styles.roleButton, role === 'parent' && styles.roleButtonActiveParent]}
        >
          <Users size={18} color={role === 'parent' ? '#ffffff' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {role === 'child' ? (
          activeTab === 'map' ? (
            <ChildDashboard
              user={user}
              quests={quests}
              onComplete={handleComplete}
              onUpdateUser={handleUpdateUser}
            />
          ) : (
            <TreasureRoom xp={user.xp} rewards={rewards} onRedeem={handleRedeemReward} />
          )
        ) : (
          <ParentDashboard
            quests={quests}
            onApprove={handleApprove}
            onAddQuest={handleAddQuest}
            onDelete={handleDelete}
            onSendBlessing={handleSendBlessing}
          />
        )}
      </View>

      <View style={styles.navbar}>
        {role === 'child' ? (
          <>
            <TouchableOpacity onPress={() => setActiveTab('map')} style={styles.navItem}>
              <Sword color={activeTab === 'map' ? '#fbbf24' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'map' && styles.navTextActive]}>Maceracı</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('shop')} style={styles.navItem}>
              <ShoppingBag color={activeTab === 'shop' ? '#fbbf24' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'shop' && styles.navTextActive]}>Hazine</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.navItem}>
            <LayoutDashboard color="#818cf8" />
            <Text style={[styles.navText, { color: '#818cf8' }]}>Yönetim</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.navItem, { opacity: 0.3 }]}>
          <Settings color="#64748b" />
          <Text style={styles.navText}>Ayarlar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialUser, setInitialUser] = useState<UserState | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('questnest_user');
      if (savedUser) {
        setInitialUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
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
        <Stack.Screen
          name="Main"
          component={MainApp}
          initialParams={{ initialUser: initialUser }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  roleSwitcher: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleButton: { padding: 8, borderRadius: 8 },
  roleButtonActiveChild: { backgroundColor: '#f59e0b' },
  roleButtonActiveParent: { backgroundColor: '#6366f1' },
  navbar: {
    height: 80,
    backgroundColor: '#0f172a',
    borderTopWidth: 4,
    borderTopColor: 'rgba(120, 53, 15, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginTop: 4 },
  navTextActive: { color: '#fbbf24' },
});
