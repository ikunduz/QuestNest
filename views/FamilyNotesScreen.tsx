import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import {
    ArrowLeft, MoreVertical, History, Crown, BadgeCheck, Zap,
    Check, CheckCheck, Shield, Camera, Plus, ClipboardList, Mic,
    PlusCircle, Smile, Send, Trash2, Clock, Info, Lock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseClient';
import { decode } from 'base64-arraybuffer';
import {
    canSendMessage,
    canSendPhoto,
    canSendVoice,
    recordMessageSent,
    recordPhotoSent,
    recordVoiceSent,
    getStorageDays,
    getUsageSummary,
    LIMITS
} from '../services/limitsService';
import i18n from '../i18n';

const { width } = Dimensions.get('window');



interface FamilyNotesScreenProps {
    familyId: string;
    userId: string;
    userName: string;
    onBack: () => void;
    isPremium?: boolean;
    onShowPaywall?: () => void;
}

export const FamilyNotesScreen: React.FC<FamilyNotesScreenProps> = ({
    familyId,
    userId,
    userName,
    onBack,
    isPremium = false,
    onShowPaywall
}) => {
    const [newMessage, setNewMessage] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false); // To trigger UI updates reliably
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [cleanedCount, setCleanedCount] = useState(0); // Track auto-cleaned messages

    // Audio recording constants
    const MAX_AUDIO_DURATION = 5; // 5 seconds max for audio messages
    const recordingRef = useRef<Audio.Recording | null>(null); // Ref for auto-stop access

    // Timer effect for recording with auto-stop at 5 seconds
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;
                    // Auto-stop at MAX_AUDIO_DURATION
                    if (newDuration >= MAX_AUDIO_DURATION && recordingRef.current) {
                        stopRecordingAndSend();
                    }
                    return newDuration;
                });
            }, 1000);
        } else {
            setRecordingDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Format seconds to MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Proper interface to fix linting errors
    interface Message {
        id: string;
        sender?: string;
        role?: string;
        roleLabel?: string;
        avatar?: string;
        content?: string;
        timestamp?: string;
        rewards?: { xp: number };
        verified?: boolean;
        type: 'text' | 'image' | 'audio' | 'system';
        message?: string; // For system messages
        status?: string; // For system messages
        readAt?: string | null;
        image?: string; // For local UI logic, maps to media_url
        media_url?: string;
        audio?: string; // For local UI logic, maps to media_url
        duration?: string;
    }

    const [messages, setMessages] = useState<Message[]>([]);

    // 1. Daily Message Limit Check
    const checkMessageLimit = async (): Promise<boolean> => {
        const result = await canSendMessage(familyId, isPremium);

        if (!result.allowed) {
            Alert.alert(
                `📬 ${i18n.t('notes.dailyLimitReached')}`,
                isPremium
                    ? i18n.t('notes.tryAgainTomorrow')
                    : i18n.t('notes.upgradeToPremium'),
                isPremium ? [] : [
                    { text: i18n.t('common.cancel'), style: 'cancel' },
                    { text: '👑 Premium', onPress: () => onShowPaywall?.() }
                ]
            );
            return false;
        }
        return true;
    };

    // Check photo limit
    const checkPhotoLimit = async (): Promise<boolean> => {
        const result = await canSendPhoto(familyId, isPremium);

        if (!result.allowed) {
            Alert.alert(
                `📷 ${i18n.t('notes.photoLimitReached')}`,
                `${i18n.t('notes.photosRemaining')}: 0/${result.limit}`,
                isPremium ? [] : [
                    { text: i18n.t('common.cancel'), style: 'cancel' },
                    { text: '👑 Premium', onPress: () => onShowPaywall?.() }
                ]
            );
            return false;
        }
        return true;
    };

    // Check voice limit
    const checkVoiceLimit = async (): Promise<boolean> => {
        const result = await canSendVoice(familyId, isPremium);

        if (!result.allowed) {
            Alert.alert(
                `🎤 ${i18n.t('notes.voiceLimitReached')}`,
                `${i18n.t('notes.voiceRemaining')}: 0/${result.limit}`,
                isPremium ? [] : [
                    { text: i18n.t('common.cancel'), style: 'cancel' },
                    { text: '👑 Premium', onPress: () => onShowPaywall?.() }
                ]
            );
            return false;
        }
        return true;
    };

    // Auto-cleanup: Delete messages older than storage days
    const cleanupOldMessages = async () => {
        try {
            const storageDays = getStorageDays(isPremium);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - storageDays);
            const cutoffISO = cutoffDate.toISOString();

            // 1. Find old messages with media to delete from storage
            const { data: oldMediaMessages } = await supabase
                .from('messages')
                .select('id, media_url, type')
                .eq('family_id', familyId)
                .lt('created_at', cutoffISO)
                .in('type', ['image', 'audio']);

            if (oldMediaMessages && oldMediaMessages.length > 0) {
                const filesToDelete: string[] = [];
                oldMediaMessages.forEach(msg => {
                    if (msg.media_url) {
                        try {
                            const fileName = msg.media_url.split('/').pop();
                            if (fileName) filesToDelete.push(fileName);
                        } catch (e) { console.log('Error parsing url', e) }
                    }
                });

                if (filesToDelete.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('chat-media')
                        .remove(filesToDelete);
                    if (storageError) console.log('Auto-cleanup storage error:', storageError);
                    else console.log('Auto-cleaned storage files:', filesToDelete.length);
                }
            }

            // 2. Delete old messages from database
            const { data: deletedMessages, error } = await supabase
                .from('messages')
                .delete()
                .eq('family_id', familyId)
                .lt('created_at', cutoffISO)
                .select('id');

            if (error) {
                console.log('Auto-cleanup DB error:', error);
            } else if (deletedMessages && deletedMessages.length > 0) {
                console.log('Auto-cleaned messages:', deletedMessages.length);
                setCleanedCount(deletedMessages.length);
            }
        } catch (err) {
            console.log('Auto-cleanup error:', err);
        }
    };

    // Load messages from Supabase on mount & Realtime subscription
    useEffect(() => {
        // Run auto-cleanup first, then fetch messages
        const initializeChat = async () => {
            await cleanupOldMessages();
            await fetchMessages();
        };

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: true });

            if (error) console.log('Error fetching messages:', error);
            else if (data) {
                // Map Supabase rows to UI Message format
                const loadedMessages: Message[] = data.map((row: any) => ({
                    id: row.id.toString(),
                    sender: row.sender,
                    role: row.role,
                    roleLabel: row.role_label,
                    avatar: row.avatar,
                    content: row.content,
                    timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: row.type as any,
                    image: row.type === 'image' ? row.media_url : undefined,
                    audio: row.type === 'audio' ? row.media_url : undefined,
                    duration: row.duration,
                    verified: false, // Default
                    rewards: row.rewards
                }));
                setMessages(loadedMessages);
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 200);
            }
        };

        initializeChat();

        // Realtime Subscription
        const channel = supabase.channel('family-chat')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `family_id=eq.${familyId}` },
                (payload) => {
                    console.log('Realtime update:', payload);
                    fetchMessages(); // Simple refresh strategy for now
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [familyId]);


    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        // Daily Message Limit Check
        const canSend = await checkMessageLimit();
        if (!canSend) return;

        const { error } = await supabase.from('messages').insert({
            family_id: familyId,
            content: newMessage,
            sender: userName || 'Ben',
            role: 'child',
            role_label: userName || 'Kahraman',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABEdBRn00fVA7DzATIRCQp7F3frVjmhzA7fBUZl9SyY6UPPlQiz2bAX0pkTOIJD-cxsHhPFXK2RMA4EyasBSSq97JJ6tdjFdwmAPB7L5K1jvnXpyQY6Ox_T8kpuniWC6ANX-XEwcl5X-P3CxcJOjAlSH6Fb8LyRtFNUyuAXJ7dOJOybh8-B3zUzLNwQ_oUxpjbZLQsjOU9bRt6JJkiPRsKBM-VoMkocMUNLffHTYKY6mUd7kWltRkEb4rOkkzzRUgVt_3NU',
            type: 'text'
        });

        if (error) Alert.alert('Hata', 'Mesaj gönderilemedi.');
        else {
            await recordMessageSent(familyId);
            setNewMessage('');
        }
    };

    const uploadFile = async (uri: string, type: 'image' | 'audio') => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            // RN requires reading the blob via FileReader to get ArrayBuffer
            const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (reader.result) {
                        resolve(reader.result as ArrayBuffer);
                    } else {
                        reject(new Error("Failed to read blob"));
                    }
                };
                reader.onerror = () => reject(new Error("Failed to read blob"));
                reader.readAsArrayBuffer(blob);
            });

            const fileName = `${type}_${Date.now()}.${type === 'image' ? 'jpg' : 'm4a'}`;

            const { data, error } = await supabase.storage
                .from('chat-media')
                .upload(fileName, arrayBuffer, {
                    contentType: type === 'image' ? 'image/jpeg' : 'audio/m4a',
                    upsert: false
                });

            if (error) throw error;

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from('chat-media')
                .getPublicUrl(fileName);

            return publicUrlData.publicUrl;
        } catch (e) {
            console.error('Upload failed:', e);
            Alert.alert('Hata', 'Dosya yüklenemedi.');
            return null;
        }
    };

    const handleCamera = async () => {
        // Photo Limit Check
        const canSend = await checkPhotoLimit();
        if (!canSend) return;

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera iznine ihtiyacımız var.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.2, // Heavy compression for "Cimri Modu"
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            const publicUrl = await uploadFile(imageUri, 'image');

            if (publicUrl) {
                await supabase.from('messages').insert({
                    family_id: familyId,
                    content: '📸 Kanıt Gönderildi',
                    sender: userName || 'Ben',
                    role: 'child',
                    role_label: userName || 'Kahraman',
                    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABEdBRn00fVA7DzATIRCQp7F3frVjmhzA7fBUZl9SyY6UPPlQiz2bAX0pkTOIJD-cxsHhPFXK2RMA4EyasBSSq97JJ6tdjFdwmAPB7L5K1jvnXpyQY6Ox_T8kpuniWC6ANX-XEwcl5X-P3CxcJOjAlSH6Fb8LyRtFNUyuAXJ7dOJOybh8-B3zUzLNwQ_oUxpjbZLQsjOU9bRt6JJkiPRsKBM-VoMkocMUNLffHTYKY6mUd7kWltRkEb4rOkkzzRUgVt_3NU',
                    type: 'image',
                    media_url: publicUrl
                });
                await recordPhotoSent(familyId);
            }
        }
    };

    // Stop recording and send (extracted for auto-stop)
    const stopRecordingAndSend = async () => {
        const currentRecording = recordingRef.current;
        if (!currentRecording) return;

        console.log('Stopping recording..');
        const finalDuration = formatDuration(recordingDuration);
        setIsRecording(false);

        try {
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            recordingRef.current = null;
            setRecording(null);

            if (uri) {
                // Voice Limit Check
                const canSend = await checkVoiceLimit();
                if (!canSend) return;

                const publicUrl = await uploadFile(uri, 'audio');
                if (publicUrl) {
                    await supabase.from('messages').insert({
                        family_id: familyId,
                        content: '🎤 Sesli Mesaj',
                        sender: userName || 'Ben',
                        role: 'child',
                        role_label: userName || 'Kahraman',
                        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABEdBRn00fVA7DzATIRCQp7F3frVjmhzA7fBUZl9SyY6UPPlQiz2bAX0pkTOIJD-cxsHhPFXK2RMA4EyasBSSq97JJ6tdjFdwmAPB7L5K1jvnXpyQY6Ox_T8kpuniWC6ANX-XEwcl5X-P3CxcJOjAlSH6Fb8LyRtFNUyuAXJ7dOJOybh8-B3zUzLNwQ_oUxpjbZLQsjOU9bRt6JJkiPRsKBM-VoMkocMUNLffHTYKY6mUd7kWltRkEb4rOkkzzRUgVt_3NU',
                        type: 'audio',
                        media_url: publicUrl,
                        duration: finalDuration
                    });
                    await recordVoiceSent(familyId);
                }
            }
        } catch (err) {
            console.error('Error stopping recording:', err);
        }
    };

    const handleAudio = async () => {
        if (recording) {
            // Manual stop
            await stopRecordingAndSend();
        } else {
            // Voice Check before starting recording
            const canSend = await checkVoiceLimit();
            if (!canSend) return;

            setRecordingDuration(0);
            try {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Sesli mesaj için mikrofon izni gerekiyor.');
                    return;
                }
                await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

                // Use LOW_QUALITY preset for compression (saves ~80% storage)
                const { recording: newRecording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.LOW_QUALITY
                );
                recordingRef.current = newRecording;
                setRecording(newRecording);
                setIsRecording(true);
            } catch (err) {
                console.error('Failed to start recording', err);
            }
        }
    };

    // Helper to play audio
    const playAudio = async (uri: string) => {
        try {
            const { sound } = await Audio.Sound.createAsync({ uri });
            await sound.playAsync();
        } catch (error) {
            console.log("Error playing audio", error);
        }
    };

    // Delete Message Feature
    const handleDeleteMessage = (msg: Message) => {

        Alert.alert(
            i18n.t('notes.deleteMessage'),
            i18n.t('notes.deleteMessageConfirm'),
            [
                { text: i18n.t('notes.no'), style: 'cancel' },
                {
                    text: i18n.t('notes.yesDestroy'),
                    style: 'destructive',
                    onPress: async () => {
                        if ((msg.type === 'image' || msg.type === 'audio') && (msg.media_url || msg.image || msg.audio)) {
                            const url = msg.media_url || msg.image || msg.audio;
                            if (url) {
                                try {
                                    const fileName = url.split('/').pop();
                                    if (fileName) {
                                        const { error: storageError } = await supabase.storage
                                            .from('chat-media')
                                            .remove([fileName]);

                                        if (storageError) console.log("Storage delete error:", storageError);
                                        else console.log("File deleted from storage:", fileName);
                                    }
                                } catch (err) {
                                    console.log("Error parsing url for deletion:", err);
                                }
                            }
                        }

                        const { error } = await supabase
                            .from('messages')
                            .delete()
                            .eq('id', msg.id);

                        if (error) {
                            Alert.alert(i18n.t('notes.error'), i18n.t('notes.messageDeleteFailed'));
                        } else {
                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                        }
                    }
                }
            ]
        );
    };

    // Clear Entire Chat Feature
    const handleClearChat = () => {
        Alert.alert(
            i18n.t('notes.clearChat'),
            i18n.t('notes.clearChatConfirm'),
            [
                { text: i18n.t('notes.no'), style: 'cancel' },
                {
                    text: i18n.t('notes.yesClearAll'),
                    style: 'destructive',
                    onPress: async () => {
                        setMessages([]);

                        const { data: mediaMessages } = await supabase
                            .from('messages')
                            .select('media_url, type')
                            .eq('family_id', familyId)
                            .in('type', ['image', 'audio']);

                        if (mediaMessages && mediaMessages.length > 0) {
                            const filesToDelete: string[] = [];
                            mediaMessages.forEach(msg => {
                                if (msg.media_url) {
                                    try {
                                        const fileName = msg.media_url.split('/').pop();
                                        if (fileName) filesToDelete.push(fileName);
                                    } catch (e) { console.log('Error parsing url', e) }
                                }
                            });

                            if (filesToDelete.length > 0) {
                                const { error: storageError } = await supabase.storage
                                    .from('chat-media')
                                    .remove(filesToDelete);
                                if (storageError) console.log('Bulk delete storage error:', storageError);
                            }
                        }

                        const { error } = await supabase
                            .from('messages')
                            .delete()
                            .eq('family_id', familyId);

                        if (error) Alert.alert(i18n.t('notes.error'), i18n.t('notes.chatClearFailed'));
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Background Layer */}
            <LinearGradient
                colors={['#231d0f', '#1a160b', '#0f0c05']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <BlurView intensity={20} tint="dark" style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <ArrowLeft color="rgba(255,255,255,0.7)" size={24} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.headerTitleRow}>
                        <History color="#fbbd23" size={20} />
                        <Text style={styles.headerTitle}>{i18n.t('notes.title')}</Text>
                    </View>
                    <Text style={styles.headerSub}>{messages.length >= 30 ? i18n.t('notes.mailboxFull') : i18n.t('notes.missionContinues')}</Text>
                </View>
                <TouchableOpacity style={styles.iconButton} onPress={handleClearChat}>
                    <MoreVertical color="rgba(255,255,255,0.7)" size={24} />
                </TouchableOpacity>
            </BlurView>

            {/* Auto-Cleanup Info Banner */}
            <View style={styles.infoBanner}>
                <Clock size={14} color="#9ca3af" />
                <Text style={styles.infoBannerText}>
                    {i18n.t('notes.autoDeleteInfo')}
                </Text>
            </View>

            {/* Chat Stream */}
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={true}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {cleanedCount > 0 && (
                    <View style={styles.cleanupNotice}>
                        <Info size={12} color="#60a5fa" />
                        <Text style={styles.cleanupNoticeText}>
                            {cleanedCount} {i18n.t('notes.oldMessagesCleared')}
                        </Text>
                    </View>
                )}

                <View style={styles.dateDividerContainer}>
                    <View style={styles.dateDivider}>
                        <Text style={styles.dateText}>{i18n.t('notes.today')}</Text>
                    </View>
                </View>

                {messages.map((msg) => {
                    if (msg.type === 'system') {
                        return (
                            <View key={msg.id} style={styles.systemMessageContainer}>
                                <BlurView intensity={10} tint="light" style={styles.systemMessage}>
                                    <View style={styles.systemIcon}>
                                        <Check size={12} color="#4ade80" />
                                    </View>
                                    <View>
                                        <Text style={styles.systemText}>
                                            {msg.message}
                                        </Text>
                                    </View>
                                </BlurView>
                            </View>
                        );
                    }

                    const isParent = msg.role === 'parent';

                    return (
                        <TouchableOpacity
                            key={msg.id}
                            onLongPress={() => !isParent && handleDeleteMessage(msg)}
                            delayLongPress={500}
                        >
                            <View style={[styles.messageRow, isParent ? styles.messageLeft : styles.messageRight]}>
                                {/* Avatar (Left or Right) */}
                                <View style={styles.avatarContainer}>
                                    <Image source={{ uri: msg.avatar }} style={[styles.avatar, { borderColor: isParent ? '#fbbd23' : '#60a5fa' }]} />
                                    <View style={[styles.roleBadge, { backgroundColor: isParent ? '#fbbd23' : '#3b82f6' }]}>
                                        {isParent ? <Crown size={10} color="#231e10" /> : <Shield size={10} color="#fff" />}
                                    </View>
                                </View>

                                <View style={[styles.bubbleContainer, isParent ? styles.bubbleLeft : styles.bubbleRight]}>
                                    <View style={styles.senderNameRow}>
                                        <Text style={[styles.senderName, { color: isParent ? '#fbbd23' : '#60a5fa' }]}>
                                            {msg.roleLabel}
                                        </Text>
                                        {msg.verified && <BadgeCheck size={12} color={isParent ? '#fbbd23' : '#60a5fa'} />}
                                    </View>

                                    <BlurView
                                        intensity={isParent ? 10 : 20}
                                        tint="light"
                                        style={[
                                            styles.messageBubble,
                                            isParent ? styles.bubbleBgParent : styles.bubbleBgChild,
                                            msg.type === 'image' && { padding: 4 } // Less padding for images
                                        ]}
                                    >
                                        {/* Decorative Corners for Parent */}
                                        {isParent ? (
                                            <>
                                                <View style={styles.cornerTR} />
                                                <View style={styles.cornerBL} />
                                            </>
                                        ) : (
                                            <>
                                                <View style={styles.cornerTL} />
                                                <View style={styles.cornerBR} />
                                            </>
                                        )}

                                        {/* Render Logic Based on Type */}
                                        {msg.type === 'image' && msg.image ? (
                                            <Image
                                                source={{ uri: msg.image }}
                                                style={{ width: 200, height: 150, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)' }}
                                                resizeMode="cover"
                                            />
                                        ) : msg.type === 'audio' && msg.audio ? (
                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                                                onPress={() => msg.audio && playAudio(msg.audio)}
                                            >
                                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                                                    <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderTopWidth: 5, borderBottomWidth: 5, borderLeftColor: '#fff', borderTopColor: 'transparent', borderBottomColor: 'transparent', marginLeft: 2 }} />
                                                </View>
                                                <View>
                                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Ses Kaydı</Text>
                                                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{msg.duration}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.messageText}>{msg.content}</Text>
                                        )}

                                        {msg.rewards && (
                                            <View style={styles.rewardTag}>
                                                <Zap size={10} color="#231d0f" fill="#231d0f" />
                                                <Text style={styles.rewardText}>+{msg.rewards.xp} XP</Text>
                                            </View>
                                        )}
                                    </BlurView>

                                    <View style={styles.timestampRow}>
                                        {!isParent && <CheckCheck size={12} color="#60a5fa" />}
                                        <Text style={styles.timestamp}>{msg.timestamp}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}


            </ScrollView>

            {/* Input Composer */}
            <BlurView intensity={40} tint="dark" style={styles.composerContainer}>
                {/* Action Chips */}
                <View style={styles.actionChips}>
                    <TouchableOpacity style={styles.actionChipPrimary} onPress={handleCamera}>
                        <Camera size={14} color="#fbbd23" />
                        <Text style={styles.actionChipTextPrimary}>{i18n.t('notes.captureEvidence')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionChip, isRecording && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}
                        onPress={handleAudio}
                    >
                        <Mic size={14} color={isRecording ? "#f87171" : "#d1d5db"} />
                        <Text style={[styles.actionChipText, isRecording && { color: '#f87171' }]}>
                            {isRecording
                                ? `${formatDuration(recordingDuration)} / 0:05`
                                : i18n.t('notes.voiceMessage')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Input Field */}
                <View style={styles.inputRow}>
                    <View style={styles.textInputWrapper}>
                        <TouchableOpacity style={styles.attachBtn} onPress={handleCamera}>
                            <PlusCircle size={24} color="rgba(251, 189, 35, 0.7)" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.textInput}
                            placeholder={messages.length >= 30 ? i18n.t('notes.mailboxFullType') : i18n.t('notes.typeMessage')}
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            onSubmitEditing={handleSendMessage}
                            editable={messages.length < 30}
                        />
                        <TouchableOpacity style={styles.emojiBtn}>
                            <Smile size={24} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.sendBtn, messages.length >= 30 && { opacity: 0.5 }]}
                        onPress={handleSendMessage}
                        disabled={messages.length >= 30}
                    >
                        <Send size={20} color="#231e10" fill="#231e10" />
                    </TouchableOpacity>
                </View>
            </BlurView>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#231d0f' },

    header: {
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(251, 189, 35, 0.1)',
        zIndex: 10
    },
    iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    headerTitleContainer: { alignItems: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
    headerSub: { fontSize: 12, color: '#cdbb8e', fontWeight: '500' },

    chatContent: { padding: 16, paddingBottom: 180 }, // Increased padding bottom to clear composer
    dateDividerContainer: { alignItems: 'center', marginVertical: 8 },
    dateDivider: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    dateText: { fontSize: 10, color: '#cdbb8e', fontWeight: 'bold', letterSpacing: 1 },

    systemMessageContainer: { alignItems: 'center', marginVertical: 8 },
    systemMessage: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
    systemIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(34, 197, 94, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
    systemText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

    messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, gap: 12 },
    messageLeft: {},
    messageRight: { flexDirection: 'row-reverse' },

    avatarContainer: { position: 'relative' },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, backgroundColor: '#000' },
    roleBadge: { position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

    bubbleContainer: { maxWidth: '80%', gap: 4 },
    bubbleLeft: { alignItems: 'flex-start' },
    bubbleRight: { alignItems: 'flex-end' },

    senderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
    senderName: { fontSize: 12, fontWeight: 'bold' },

    messageBubble: { padding: 16, overflow: 'hidden', position: 'relative' },
    bubbleBgParent: {
        backgroundColor: 'rgba(251, 189, 35, 0.1)',
        borderColor: 'rgba(251, 189, 35, 0.3)',
        borderWidth: 1,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderTopLeftRadius: 8,
        borderBottomRightRadius: 8
    },
    bubbleBgChild: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        borderTopLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8
    },

    cornerTR: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTopWidth: 1, borderRightWidth: 1, borderColor: 'rgba(251, 189, 35, 0.5)', borderTopRightRadius: 12 },
    cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(251, 189, 35, 0.5)', borderBottomLeftRadius: 12 },
    cornerTL: { position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)', borderTopLeftRadius: 12 },
    cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)', borderBottomRightRadius: 12 },

    messageText: { color: '#f3f4f6', fontSize: 14, lineHeight: 20 },

    rewardTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbbd23', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8, gap: 4 },
    rewardText: { color: '#231d0f', fontSize: 10, fontWeight: 'bold' },

    timestampRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
    timestamp: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },

    composerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(35, 29, 15, 0.8)' },

    actionChips: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    actionChipPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(251, 189, 35, 0.15)', borderWidth: 1, borderColor: 'rgba(251, 189, 35, 0.3)', borderRadius: 12 },
    actionChipTextPrimary: { color: '#fbbd23', fontSize: 13, fontWeight: '700' },
    actionChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    actionChipText: { color: '#d1d5db', fontSize: 12, fontWeight: '500' },

    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, minHeight: 48 },
    attachBtn: { padding: 12 },
    textInput: { flex: 1, color: '#fff', fontSize: 14, height: '100%', paddingVertical: 12 },
    emojiBtn: { padding: 12 },

    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fbbd23', justifyContent: 'center', alignItems: 'center', shadowColor: '#fbbd23', shadowOpacity: 0.4, shadowRadius: 10 },

    // Auto-cleanup info banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    infoBannerText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500'
    },
    cleanupNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        borderRadius: 8,
        marginBottom: 8,
        alignSelf: 'center'
    },
    cleanupNoticeText: {
        color: '#60a5fa',
        fontSize: 11,
        fontWeight: '500'
    }
});
