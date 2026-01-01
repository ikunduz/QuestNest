import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameButton } from '../components/GameButton';
import { UserPlus, Search } from 'lucide-react-native';
import { findFamilyByCode, createUser } from '../services/familyService';

export const JoinFamilyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!code || !userName) {
            Alert.alert("Eksik Bilgi", "Lütfen aile kodunu ve adınızı girin.");
            return;
        }

        setLoading(true);
        try {
            // 1. Aileyi bul
            const family = await findFamilyByCode(code);

            if (!family) {
                Alert.alert("Hata", "Bu kodla eşleşen bir aile bulunamadı.");
                return;
            }

            // 2. Kullanıcıyı oluştur
            const user = await createUser({
                family_id: family.id,
                name: userName,
                role: 'parent',
                parent_type: 'dad'
            });

            // 3. Kullanıcıyı AsyncStorage'a kaydet
            const userState = {
                id: user.id,
                family_id: family.id,
                role: 'parent',
                name: userName,
                xp: 0,
                level: 1,
                streak: 0,
                parent_type: 'dad'
            };
            await AsyncStorage.setItem('questnest_user', JSON.stringify(userState));

            Alert.alert("Hoş Geldin!", `${family.name} grubuna başarıyla katıldın.`, [
                { text: "MACERAYA BAŞLA", onPress: () => navigation.replace('Main', { initialUser: userState }) }
            ]);
        } catch (error: any) {
            Alert.alert("Hata", "Aileye katılırken bir sorun oluştu. Kodun doğru olduğundan emin olun.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>BİR KRALLIĞA KATIL</Text>
            <Text style={styles.subtitle}>Paylaşılan aile kodunu kullanarak giriş yapın</Text>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>AİLE KODU (Örn: KUZEY-X4Y2)</Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={(v) => setCode(v.toUpperCase())}
                        placeholder="KOD-1234"
                        placeholderTextColor="#64748b"
                        autoCapitalize="characters"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>SENİN ADIN</Text>
                    <TextInput
                        style={styles.input}
                        value={userName}
                        onChangeText={setUserName}
                        placeholder="Adın..."
                        placeholderTextColor="#64748b"
                    />
                </View>

                <GameButton
                    onPress={handleJoin}
                    loading={loading}
                    variant="secondary"
                    style={styles.submitBtn}
                >
                    <Search color="#fff" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>KRALLIĞI BUL VE KATIL</Text>
                </GameButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#0f172a', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24', textAlign: 'center' },
    subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },
    form: { marginTop: 40 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    input: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, borderWidth: 2, borderColor: '#334155', textAlign: 'center', fontWeight: 'bold' },
    submitBtn: { marginTop: 20, paddingVertical: 18, flexDirection: 'row' },
    submitBtnText: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
});
