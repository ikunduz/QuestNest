import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { Camera, Check, ImagePlus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { CHILD_AVATARS, PARENT_AVATARS, Avatar } from '../constants/avatars';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = (width - 64) / 3;

interface AvatarSelectorProps {
    currentAvatar?: string;
    currentPhotoUrl?: string;
    userRole: 'child' | 'parent';
    parentType?: 'mom' | 'dad';
    onSelect: (avatarId: string, photoUrl?: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
    currentAvatar,
    currentPhotoUrl,
    userRole,
    parentType = 'mom',
    onSelect,
}) => {
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
    const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);

    const avatars = userRole === 'child'
        ? CHILD_AVATARS
        : PARENT_AVATARS[parentType];

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPhotoUrl(result.assets[0].uri);
                setSelectedAvatar(undefined);
            }
        } catch (e) {
            Alert.alert('Hata', 'Fotoğraf seçilemedi.');
        }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin vermeniz gerekiyor.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPhotoUrl(result.assets[0].uri);
                setSelectedAvatar(undefined);
            }
        } catch (e) {
            Alert.alert('Hata', 'Fotoğraf çekilemedi.');
        }
    };

    const handleConfirm = () => {
        onSelect(selectedAvatar || '', photoUrl);
    };

    const clearPhoto = () => {
        setPhotoUrl(undefined);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Photo Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>FOTOĞRAF KULLAN</Text>
                <View style={styles.photoOptions}>
                    <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                        <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.photoButtonGradient}>
                            <Camera color="#0f172a" size={28} />
                        </LinearGradient>
                        <Text style={styles.photoButtonText}>Fotoğraf Çek</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.photoButtonGradient}>
                            <ImagePlus color="#fff" size={28} />
                        </LinearGradient>
                        <Text style={styles.photoButtonText}>Galeriden Seç</Text>
                    </TouchableOpacity>
                </View>

                {photoUrl && (
                    <View style={styles.photoPreviewContainer}>
                        <View style={styles.photoPreview}>
                            <Image source={{ uri: photoUrl }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.removePhotoBtn} onPress={clearPhoto}>
                                <X size={16} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.selectedBadge}>
                                <Check color="#0f172a" size={20} />
                            </View>
                        </View>
                        <Text style={styles.previewLabel}>Seçilen Fotoğraf</Text>
                    </View>
                )}
            </View>

            {/* Preset Avatars Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>VEYA HAZIR AVATAR SEÇ</Text>
                <View style={styles.avatarGrid}>
                    {avatars.map((avatar: Avatar) => {
                        const isSelected = selectedAvatar === avatar.id && !photoUrl;
                        return (
                            <TouchableOpacity
                                key={avatar.id}
                                style={[styles.avatarCard, isSelected && styles.avatarCardSelected]}
                                onPress={() => { setSelectedAvatar(avatar.id); setPhotoUrl(undefined); }}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={isSelected ? 30 : 15} tint="light" style={styles.avatarCardInner}>
                                    <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                                    <Text style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}>
                                        {avatar.label.tr}
                                    </Text>
                                    {isSelected && (
                                        <View style={styles.checkBadge}>
                                            <Check color="#0f172a" size={14} />
                                        </View>
                                    )}
                                </BlurView>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <LinearGradient
                    colors={['#fbbf24', '#f59e0b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmButtonGradient}
                >
                    <Check color="#0f172a" size={22} />
                    <Text style={styles.confirmButtonText}>KAYDET</Text>
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },

    section: { marginBottom: 32 },
    sectionTitle: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 1.5,
        textAlign: 'center'
    },

    photoOptions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    photoButton: {
        alignItems: 'center',
        gap: 10,
    },
    photoButtonGradient: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fbbf24',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    photoButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },

    photoPreviewContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    photoPreview: {
        position: 'relative',
    },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#fbbf24',
    },
    removePhotoBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0f172a',
    },
    selectedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fbbf24',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0f172a',
    },
    previewLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
    },

    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    avatarCard: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE + 20,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatarCardSelected: {
        borderColor: '#fbbf24',
        shadowColor: '#fbbf24',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    avatarCardInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        padding: 8,
    },
    avatarEmoji: {
        fontSize: 40,
        marginBottom: 6,
    },
    avatarLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    avatarLabelSelected: {
        color: '#fbbf24',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#fbbf24',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    confirmButton: {
        marginTop: 8,
        borderRadius: 100,
        overflow: 'hidden',
    },
    confirmButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        shadowColor: '#fbbf24',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1,
    },
});
