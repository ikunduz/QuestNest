import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Shield, Delete, Lock, AlertTriangle } from 'lucide-react-native';
import i18n from '../i18n';
import {
    verifyPin,
    checkRateLimit,
    recordFailedAttempt,
    resetAttempts
} from '../services/securityUtils';

interface PinEntryScreenProps {
    onSuccess: () => void;
    onCancel: () => void;
    correctPin: string;
    userId?: string;
}

export const PinEntryScreen: React.FC<PinEntryScreenProps> = ({
    onSuccess,
    onCancel,
    correctPin,
    userId = 'default_user'
}) => {
    const [pin, setPin] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);
    const [attemptsRemaining, setAttemptsRemaining] = useState(5);
    const [isVerifying, setIsVerifying] = useState(false);

    // Check initial rate limit status
    useEffect(() => {
        checkLockStatus();
    }, []);

    // Countdown timer for lockout
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLocked && lockoutTime > 0) {
            interval = setInterval(() => {
                setLockoutTime(prev => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        setAttemptsRemaining(5);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLocked, lockoutTime]);

    const checkLockStatus = useCallback(async () => {
        const status = await checkRateLimit(userId);
        if (status.blocked) {
            setIsLocked(true);
            setLockoutTime(status.remainingTime);
            setAttemptsRemaining(0);
        } else {
            setAttemptsRemaining(status.attemptsRemaining);
        }
    }, [userId]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePress = async (num: string) => {
        if (isLocked || isVerifying) return;

        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 4) {
                setIsVerifying(true);
                try {
                    // Use secure PIN verification
                    const isValid = await verifyPin(newPin, correctPin);

                    if (isValid) {
                        // Reset attempts on success
                        await resetAttempts(userId);
                        onSuccess();
                    } else {
                        // Record failed attempt
                        const result = await recordFailedAttempt(userId);

                        if (result.locked) {
                            setIsLocked(true);
                            setLockoutTime(result.lockoutDuration);
                            setAttemptsRemaining(0);
                            Alert.alert(
                                '🔒 ' + i18n.t('pin.locked'),
                                i18n.t('pin.lockedMessage', { time: formatTime(result.lockoutDuration) })
                            );
                        } else {
                            setAttemptsRemaining(result.attemptsRemaining);
                            Alert.alert(
                                i18n.t('pin.wrongPin'),
                                i18n.t('pin.attemptsRemaining', { count: result.attemptsRemaining })
                            );
                        }
                        setPin('');
                    }
                } catch (error) {
                    console.error('PIN verification error:', error);
                    Alert.alert(i18n.t('common.error'), i18n.t('pin.verificationError'));
                    setPin('');
                } finally {
                    setIsVerifying(false);
                }
            }
        }
    };

    const handleRemove = () => {
        if (!isLocked && !isVerifying) {
            setPin(pin.slice(0, -1));
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {isLocked ? (
                    <Lock size={48} color="#f43f5e" />
                ) : (
                    <Shield size={48} color="#fbbf24" />
                )}
                <Text style={[styles.title, isLocked && styles.titleLocked]}>
                    {isLocked ? i18n.t('pin.locked') : i18n.t('pin.title')}
                </Text>

                {isLocked ? (
                    <View style={styles.lockoutInfo}>
                        <AlertTriangle size={16} color="#f43f5e" />
                        <Text style={styles.lockoutText}>
                            {i18n.t('pin.tryAgainIn', { time: formatTime(lockoutTime) })}
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.subtitle}>{i18n.t('pin.subtitle')}</Text>
                        {attemptsRemaining < 5 && (
                            <Text style={styles.attemptsText}>
                                {i18n.t('pin.attemptsLeft', { count: attemptsRemaining })}
                            </Text>
                        )}
                    </>
                )}
            </View>

            <View style={styles.dotsContainer}>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            pin.length >= i && styles.dotActive,
                            isLocked && styles.dotLocked
                        ]}
                    />
                ))}
            </View>

            <View style={[styles.keypad, isLocked && styles.keypadLocked]}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={[styles.key, isLocked && styles.keyDisabled]}
                        onPress={() => handlePress(num.toString())}
                        disabled={isLocked || isVerifying}
                    >
                        <Text style={[styles.keyText, isLocked && styles.keyTextDisabled]}>
                            {num}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={styles.key}
                    onPress={onCancel}
                    disabled={isVerifying}
                >
                    <Text style={[styles.keyText, { color: '#f43f5e', fontSize: 14 }]}>
                        {i18n.t('pin.cancel').toUpperCase()}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.key, isLocked && styles.keyDisabled]}
                    onPress={() => handlePress('0')}
                    disabled={isLocked || isVerifying}
                >
                    <Text style={[styles.keyText, isLocked && styles.keyTextDisabled]}>
                        0
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.key, isLocked && styles.keyDisabled]}
                    onPress={handleRemove}
                    disabled={isLocked || isVerifying}
                >
                    <Delete color={isLocked ? '#475569' : '#94a3b8'} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24', marginTop: 16 },
    titleLocked: { color: '#f43f5e' },
    subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
    attemptsText: {
        fontSize: 12,
        color: '#f59e0b',
        marginTop: 8,
        fontWeight: '600'
    },
    lockoutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    lockoutText: {
        color: '#f43f5e',
        fontSize: 14,
        fontWeight: '600'
    },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 48 },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#334155' },
    dotActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
    dotLocked: { borderColor: '#475569', backgroundColor: 'transparent' },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    keypadLocked: { opacity: 0.5 },
    key: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155'
    },
    keyDisabled: {
        backgroundColor: '#1e293b',
        borderColor: '#1e293b'
    },
    keyText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    keyTextDisabled: { color: '#475569' }
});
