
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { User, Users, Sword, ShoppingBag, LayoutDashboard, Settings } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role, Quest, UserState, Reward, ParentType } from './types';
import { INITIAL_QUESTS, INITIAL_REWARDS } from './constants';
import { ChildDashboard } from './views/ChildDashboard';
import { ParentDashboard } from './views/ParentDashboard';
import { TreasureRoom } from './views/TreasureRoom';

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('child');
  const [activeTab, setActiveTab] = useState<'map' | 'shop'>('map');
  const [user, setUser] = useState<UserState>({
    role: 'child',
    xp: 85,
    level: 2,
    name: 'Kuzey',
    streak: 3,
    heroClass: 'knight'
  });

  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [rewards] = useState<Reward[]>(INITIAL_REWARDS);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('heroquest_data_v2');
        if (saved) {
          const { user: u, quests: q } = JSON.parse(saved);
          setUser(u);
          setQuests(q);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('heroquest_data_v2', JSON.stringify({ user, quests }));
      } catch (e) {
        console.error("Failed to save data", e);
      }
    };
    saveData();
  }, [user, quests]);

  const handleQuestCompletion = (id: string) => {
    setQuests(prev => prev.map(q =>
      q.id === id ? { ...q, status: 'pending_approval' } : q
    ));
  };

  const handleUpdateUser = (updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const handleApprove = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;

    setQuests(prev => prev.map(q =>
      q.id === id ? { ...q, status: 'completed' } : q
    ));

    setUser(prev => {
      let newXP = prev.xp + quest.xpReward;
      let newLevel = prev.level;
      if (newXP >= prev.level * 100) {
        newXP -= prev.level * 100;
        newLevel += 1;
      }
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const handleSendBlessing = (from: ParentType) => {
    setUser(prev => {
      let newXP = prev.xp + 5;
      let newLevel = prev.level;
      if (newXP >= prev.level * 100) {
        newXP -= prev.level * 100;
        newLevel += 1;
      }
      return { ...prev, xp: newXP, level: newLevel, lastBlessingFrom: from };
    });
    setTimeout(() => {
      setUser(prev => ({ ...prev, lastBlessingFrom: undefined }));
    }, 2100);
  };

  const handleAddQuest = (q: Partial<Quest>) => {
    const newQ: Quest = {
      id: Math.random().toString(36).substr(2, 9),
      titleKey: q.titleKey || 'Yeni Görev',
      description: q.description || 'Krallık emri!',
      xpReward: q.xpReward || 25,
      category: q.category || 'magic',
      status: 'active',
      createdAt: Date.now()
    };
    setQuests(prev => [newQ, ...prev]);
  };

  const handleDeleteQuest = (id: string) => {
    setQuests(prev => prev.filter(q => q.id !== id));
  };

  const handleRedeemReward = (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward || user.xp < reward.cost) return;
    setUser(prev => ({ ...prev, xp: prev.xp - reward.cost }));
    Alert.alert("Başarılı", `${reward.name} talebin Bilge Konseyi'ne iletildi!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Role Switcher */}
      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          onPress={() => setRole('child')}
          style={[styles.roleButton, role === 'child' && styles.roleButtonActiveChild]}
        >
          <User size={18} color={role === 'child' ? '#0f172a' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole('parent')}
          style={[styles.roleButton, role === 'parent' && styles.roleButtonActiveParent]}
        >
          <Users size={18} color={role === 'parent' ? '#ffffff' : '#64748b'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.main}>
        {role === 'child' ? (
          activeTab === 'map' ? (
            <ChildDashboard user={user} quests={quests} onComplete={handleQuestCompletion} onUpdateUser={handleUpdateUser} />
          ) : (
            <TreasureRoom xp={user.xp} rewards={rewards} onRedeem={handleRedeemReward} />
          )
        ) : (
          <ParentDashboard
            quests={quests}
            onApprove={handleApprove}
            onAddQuest={handleAddQuest}
            onDelete={handleDeleteQuest}
            onSendBlessing={handleSendBlessing}
          />
        )}
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
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
  roleButton: {
    padding: 8,
    borderRadius: 8,
  },
  roleButtonActiveChild: {
    backgroundColor: '#f59e0b',
  },
  roleButtonActiveParent: {
    backgroundColor: '#6366f1',
  },
  main: {
    paddingBottom: 100,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  navTextActive: {
    color: '#fbbf24',
  },
});

export default App;
