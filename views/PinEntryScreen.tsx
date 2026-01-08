import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Shield, Delete } from 'lucide-react-native';
import i18n from '../i18n';

interface PinEntryScreenProps {
    onSuccess: () => void;
    onCancel: () => void;
    correctPin: string;
}

export const PinEntryScreen: React.FC<PinEntryScreenProps> = ({ onSuccess, onCancel, correctPin }) => {
    const [pin, setPin] = useState('');

    const handlePress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 4) {
                if (newPin === correctPin) {
                    onSuccess();
                } else {
                    Alert.alert(i18n.t('pin.wrongPin'), i18n.t('pin.tryAgain'));
                    setPin('');
                }
            }
        }
    };

    const handleRemove = () => {
        setPin(pin.slice(0, -1));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Shield size={48} color="#fbbf24" />
                <Text style={styles.title}>{i18n.t('pin.title')}</Text>
                <Text style={styles.subtitle}>{i18n.t('pin.subtitle')}</Text>
            </View>

            <View style={styles.dotsContainer}>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[styles.dot, pin.length >= i && styles.dotActive]}
                    />
                ))}
            </View>

            <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={styles.key}
                        onPress={() => handlePress(num.toString())}
                    >
                        <Text style={styles.keyText}>{num}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.key} onPress={onCancel}>
                    <Text style={[styles.keyText, { color: '#f43f5e', fontSize: 14 }]}>{i18n.t('pin.cancel').toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => handlePress('0')}>
                    <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={handleRemove}>
                    <Delete color="#94a3b8" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24', marginTop: 16 },
    subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 48 },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#334155' },
    dotActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    key: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    keyText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
