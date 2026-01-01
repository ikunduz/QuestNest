import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { GameButton } from '../components/GameButton';
import { Shield, User, Heart, Star } from 'lucide-react-native';
import { createFamily, createUser } from '../services/familyService';

export const FamilySetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [familyName, setFamilyName] = useState('');
    const [parentName, setParentName] = useState('');
    const [childName, setChildName] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetup = async () => {
        if (!familyName || !parentName || !childName || pin.length !== 4) {
            Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun ve 4 haneli bir PIN seçin.");
            return;
        }

        setLoading(true);
        try {
            // 1. Aile oluştur
            const { family, familyCode } = await createFamily(familyName, childName);

            // 2. Ebeveyn oluştur
            const parent = await createUser({
                family_id: family.id,
                name: parentName,
                role: 'parent',
                parent_type: 'mom', // Varsayılan, daha sonra değiştirilebilir
                pin_hash: pin // Basitlik için şimdilik düz metin (gerçek projede hashlenmeli)
            });

            // 3. Çocuk oluştur
            const child = await createUser({
                family_id: family.id,
                name: childName,
                role: 'child',
                hero_class: 'knight'
            });

            Alert.alert("Başarılı!", `Ailen oluşturuldu. Aile Kodun: ${familyCode}. Lütfen bu kodu sakla.`, [
                { text: "MACERAYA BAŞLA", onPress: () => navigation.replace('Main', { familyId: family.id, userId: child.id }) }
            ]);
        } catch (error: any) {
            Alert.alert("Hata", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>YENİ KRALLIK OLUŞTUR</Text>
            <Text style={styles.subtitle}>Ailenizin macera merkezini kurun</Text>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>AİLE ADI (Örn: Kuzey Krallığı)</Text>
                    <TextInput
                        style={styles.input}
                        value={familyName}
                        onChangeText={setFamilyName}
                        placeholder="Krallık adı..."
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>SENİN ADIN (Ebeveyn)</Text>
                    <TextInput
                        style={styles.input}
                        value={parentName}
                        onChangeText={setParentName}
                        placeholder="Adın..."
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>ÇOCUĞUNUN ADI (Küçük Kahraman)</Text>
                    <TextInput
                        style={styles.input}
                        value={childName}
                        onChangeText={setChildName}
                        placeholder="Kahraman adı..."
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>EBEVEYN MODU PIN (4 Hane)</Text>
                    <TextInput
                        style={styles.input}
                        value={pin}
                        onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').substring(0, 4))}
                        placeholder="0000"
                        placeholderTextColor="#64748b"
                        keyboardType="number-pad"
                        secureTextEntry
                    />
                </View>

                <GameButton
                    onPress={handleSetup}
                    loading={loading}
                    style={styles.submitBtn}
                >
                    <Shield color="#0f172a" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>AİLE KUR VE TACI TAK</Text>
                </GameButton>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#0f172a', minHeight: '100%' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24', textAlign: 'center', marginTop: 40 },
    subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },
    form: { marginTop: 40 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    input: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, borderWidth: 2, borderColor: '#334155' },
    submitBtn: { marginTop: 20, paddingVertical: 18, flexDirection: 'row' },
    submitBtnText: { fontWeight: 'bold', fontSize: 16, color: '#0f172a' },
});
