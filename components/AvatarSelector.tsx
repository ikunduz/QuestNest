import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Camera, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CHILD_AVATARS, PARENT_AVATARS, Avatar } from '../constants/avatars';
import { GameButton } from './GameButton';

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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>AVATAR SEÇ</Text>

            {/* Photo Options */}
            <View style={styles.photoOptions}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                    <Camera color="#fbbf24" size={24} />
                    <Text style={styles.photoButtonText}>FOTOĞRAF ÇEK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <Text style={styles.photoButtonText}>GALERİDEN SEÇ</Text>
                </TouchableOpacity>
            </View>

            {/* Current Photo Preview */}
            {photoUrl && (
                <View style={styles.photoPreview}>
                    <Image source={{ uri: photoUrl }} style={styles.previewImage} />
                    <View style={styles.selectedBadge}>
                        <Check color="#0f172a" size={16} />
                    </View>
                </View>
            )}

            {/* Preset Avatars */}
            <Text style={styles.sectionTitle}>VEYA HAZIR AVATAR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
                {avatars.map((avatar: Avatar) => (
                    <TouchableOpacity
                        key={avatar.id}
                        style={[
                            styles.avatarItem,
                            selectedAvatar === avatar.id && styles.avatarSelected
                        ]}
                        onPress={() => { setSelectedAvatar(avatar.id); setPhotoUrl(undefined); }}
                    >
                        <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                        <Text style={styles.avatarLabel}>{avatar.label.tr}</Text>
                        {selectedAvatar === avatar.id && (
                            <View style={styles.checkBadge}>
                                <Check color="#0f172a" size={12} />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <GameButton onPress={handleConfirm} style={styles.confirmButton}>
                KAYDET
            </GameButton>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fbbf24', textAlign: 'center', marginBottom: 24 },
    photoOptions: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
    photoButton: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        flex: 1,
    },
    photoButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 8 },
    photoPreview: { alignSelf: 'center', marginBottom: 24 },
    previewImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fbbf24' },
    selectedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fbbf24',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    sectionTitle: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 16, letterSpacing: 1 },
    avatarList: { flexDirection: 'row', marginBottom: 24 },
    avatarItem: {
        width: 80,
        height: 100,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#334155',
    },
    avatarSelected: { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
    avatarEmoji: { fontSize: 32, marginBottom: 4 },
    avatarLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
    checkBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fbbf24',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButton: { marginTop: 16 },
});
