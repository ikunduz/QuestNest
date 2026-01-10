import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Animated, Dimensions, Easing, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Users, Sword, ShoppingBag, LayoutDashboard, Settings, MessageCircle, PawPrint, Castle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore - expo-splash-screen works at runtime but lacks type declarations
import * as SplashScreen from 'expo-splash-screen';

import { supabase } from './services/supabaseClient';
import { subscribeToQuests, fetchQuests, updateQuestStatus, addQuest } from './services/questService';
import { Role, Quest, UserState, Reward, PetState, ParentType } from './types';
import { getInitialRewards } from './constants';
import i18n from './i18n';
import { registerForPushNotifications, savePushToken } from './services/pushNotificationService';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => { });

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
  const [rewards, setRewards] = useState<Reward[]>(getInitialRewards());
  const [showPin, setShowPin] = useState(false);
  const [pet, setPet] = useState<PetState>({
    id: 'ignis-1',
    name: 'Ignis',
    type: i18n.t('creature.type'),
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
    loadRewards();

    // ... rest of existing useEffect
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

    // Register for push notifications
    const registerPushToken = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(user.id, token);
        }
      } catch (e) {
        console.error('Push registration failed:', e);
      }
    };
    registerPushToken();

    return () => { subscription.unsubscribe(); };
  }, []);

  const loadRewards = async () => {
    try {
      const storedRewards = await AsyncStorage.getItem(`@rewards_${user.family_id}`);
      if (storedRewards) {
        const parsed: Reward[] = JSON.parse(storedRewards);

        // Auto-translate default rewards if they are in Turkish
        const TR_MAPPING: Record<string, string> = {
          'Efsanevi Pizza Gecesi': 'initialRewards.pizzaNight',
          '30 Dakika Ekran Zamanı': 'initialRewards.screenTime',
          'Geç Uyuma Hakkı (1 Saat)': 'initialRewards.lateSleep',
          'Yeni Kahraman Kıyafeti': 'initialRewards.heroOutfit',
          'Park Macerası Seçimi': 'initialRewards.parkAdventure'
        };

        const translatedRewards = parsed.map(r => {
          if (TR_MAPPING[r.name]) {
            return { ...r, name: i18n.t(TR_MAPPING[r.name]) };
          }
          return r;
        });

        setRewards(translatedRewards);
      } else {
        setRewards(getInitialRewards());
      }
    } catch (e) {
      console.error('Failed to load rewards', e);
    }
  };

  const saveRewards = async (newRewards: Reward[]) => {
    try {
      setRewards(newRewards);
      await AsyncStorage.setItem(`@rewards_${user.family_id}`, JSON.stringify(newRewards));
    } catch (e) {
      console.error('Failed to save rewards', e);
    }
  };

  const handleAddReward = (reward: Reward) => {
    const newRewards = [...rewards, reward];
    saveRewards(newRewards);
  };

  const handleDeleteReward = (id: string) => {
    const newRewards = rewards.filter(r => r.id !== id);
    saveRewards(newRewards);
  };

  useEffect(() => {
    const savePetState = async () => {
      // ... existing pet save
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
      console.log('loadQuests called for family_id:', user.family_id);
      const data = await fetchQuests(user.family_id);
      console.log('loadQuests received:', data?.length || 0, 'quests');
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
      console.log('loadQuests set', formattedQuests.length, 'quests to state');
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
      console.log('Adding quest:', questData);
      await addQuest({
        family_id: user.family_id,
        title: questData.titleKey,
        description: questData.description || '',
        xp_reward: questData.xpReward || 25,
        category: questData.category || 'magic',
        type: questData.type || 'daily',
        status: 'active'
      });
      loadQuests();
      console.log('Quest added successfully');
    } catch (e: any) {
      console.error('Quest add error:', e?.message || e);
      Alert.alert('Hata', `Görev eklenemedi: ${e?.message || 'Bilinmeyen hata'}`);
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

  const handleUpdateUser = async (updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
    // Sync avatar to Supabase if updated
    if (updates.avatar && user.id) {
      try {
        await supabase.from('users').update({ avatar: updates.avatar }).eq('id', user.id);
        console.log('Avatar synced to Supabase');
      } catch (e) {
        console.error('Failed to sync avatar:', e);
      }
    }
  };

  const handleUpdatePet = (updates: Partial<PetState>) => {
    setPet(prev => ({ ...prev, ...updates }));
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (user.xp < reward.cost) {
      Alert.alert('Yetersiz Altın', 'Bu ödülü almak için daha fazla altına ihtiyacın var!');
      return;
    }

    // Deduct gold
    const newXp = user.xp - reward.cost;
    // Update local state and DB
    setUser(prev => ({ ...prev, xp: newXp }));
    try {
      await supabase.from('users').update({ xp: newXp }).eq('id', user.id);

      // Notify parent (Optional: Create a "redemption" record in a future table)
      Alert.alert('Tebrikler!', `${reward.name} satın alındı! Ebeveynine bildirildi.`);

      // Add to history or notification logic here if needed
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
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
      return <FamilyNotesScreen
        familyId={user.family_id}
        userId={user.id}
        userName={user.name}
        userAvatar={user.avatar}
        userRole={role}
        onBack={() => setActiveTab('quests')}
      />;
    }

    if (role === 'parent') {
      return (
        <ParentDashboard
          quests={quests}
          rewards={rewards}
          onApprove={handleApprove}
          onAddQuest={handleAddQuest}
          onDelete={handleDelete}
          onSendBlessing={handleSendBlessing}
          onAddReward={handleAddReward}
          onDeleteReward={handleDeleteReward}
          onExit={() => handleRoleSwitch('child')}
          onOpenNotes={() => setActiveTab('notes')}
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
            <Text style={[styles.navText, activeTab === 'quests' && { color: '#fbbf24' }]}>{i18n.t('tabs.quests')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('game')} style={styles.navItem}>
            <View style={{ flexDirection: 'row' }}>
              <PawPrint size={18} color={activeTab === 'game' ? '#fbbf24' : '#64748b'} style={{ marginRight: -4 }} />
              <Castle size={18} color={activeTab === 'game' ? '#fbbf24' : '#64748b'} />
            </View>
            <Text style={[styles.navText, activeTab === 'game' && { color: '#fbbf24' }]}>{i18n.t('tabs.game')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('treasure')} style={styles.navItem}>
            <ShoppingBag size={22} color={activeTab === 'treasure' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'treasure' && { color: '#fbbf24' }]}>{i18n.t('tabs.treasure')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('notes')} style={styles.navItem}>
            <MessageCircle size={22} color={activeTab === 'notes' ? '#fbbf24' : '#64748b'} />
            <Text style={[styles.navText, activeTab === 'notes' && { color: '#fbbf24' }]}>{i18n.t('tabs.notes')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRoleSwitch('parent')} style={styles.navItem}>
            <Users size={22} color='#64748b' />
            <Text style={styles.navText}>{i18n.t('tabs.parent')}</Text>
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
    finally {
      setIsLoading(false);
      // Hide the native splash screen now that we're ready
      SplashScreen.hideAsync().catch(() => { });
    }
  };

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <LinearGradient
          colors={['#0a0d14', '#1a1525', '#231d0f', '#1a1525', '#0a0d14']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Radial glow */}
        <View style={loadingStyles.radialGlow} />

        {/* Big Logo */}
        <View style={loadingStyles.logoContainer}>
          <View style={loadingStyles.logoGlow} />
          <Image
            source={require('./assets/icon.png')}
            style={loadingStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={loadingStyles.title}>{i18n.t('app.name')}</Text>
        <Text style={loadingStyles.subtitle}>{i18n.t('app.subtitle')}</Text>

        {/* Loading indicator */}
        <View style={loadingStyles.loadingRow}>
          <ActivityIndicator size="small" color="#fbbd23" />
          <Text style={loadingStyles.loadingText}>{i18n.t('app.loading')}</Text>
        </View>
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Epic Loading Screen Styles
const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radialGlow: {
    position: 'absolute',
    top: screenHeight * 0.15,
    left: screenWidth * 0.5 - screenWidth * 0.5,
    width: screenWidth,
    height: screenWidth,
    borderRadius: screenWidth / 2,
    backgroundColor: 'rgba(251, 189, 35, 0.12)',
  },
  logoContainer: {
    width: screenWidth * 0.65,
    height: screenWidth * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: screenWidth,
    backgroundColor: 'rgba(251, 189, 35, 0.15)',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fbbd23',
    textAlign: 'center',
    textShadowColor: 'rgba(251, 189, 35, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 40,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(251, 189, 35, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
});
