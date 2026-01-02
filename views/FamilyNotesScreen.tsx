import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import {
    ArrowLeft, MoreVertical, History, Crown, BadgeCheck, Zap,
    Check, CheckCheck, Shield, Camera, Plus, ClipboardList, Mic,
    PlusCircle, Smile, Send, Trash2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabaseClient';
import { decode } from 'base64-arraybuffer';

const { width } = Dimensions.get('window');

// Mock Messages for UI Demo (kept as fallback or intro)
const MOCK_MESSAGES = [
    {
        id: 'mock-1',
        sender: 'High Queen (Mom)',
        role: 'parent',
        roleLabel: 'Kraliçe',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm_tpa_vT5F_a5JMBM2LLfuJYpF64jiEIBDjmBQRybkz3hX_qp5o1vpttnzR-0J4hRJR4YCdLYSo1IYUsEIq1Ct6cY9Pio4fEygWfly7oogWnRia9qWpLNfy7bT8kLYVTAK6TdDS5IyrIte5E6Z54VPnO0JxD4_UG2muI7yAjG5D-92zNF598t5NfG6QbhiLguUG3-9x34Ffio-fjGQpHBPgJ-eOnhJt_2GRaP0zl8806pgmd1TJPFTEHVHAqJJQFhevt5_ht',
        content: 'Gün batımından önce mutfak zindanı temizlenmeli. Yağ cinlerinden sakın!',
        timestamp: '10:42 AM',
        rewards: { xp: 50 },
        verified: true,
        type: 'text' as const
    }
];

interface FamilyNotesScreenProps {
    familyId: string;
    userId: string;
    userName: string;
    onBack: () => void;
}

export const FamilyNotesScreen: React.FC<FamilyNotesScreenProps> = ({ familyId, userId, userName, onBack }) => {
    const [newMessage, setNewMessage] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false); // To trigger UI updates reliably
    const [recordingDuration, setRecordingDuration] = useState(0);

    // Timer effect for recording
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
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

    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES as Message[]);

    // 1. Quota Check (Max 30 Messages)
    const checkQuota = async () => {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', familyId);

        if (error) {
            console.error('Quota check error', error);
            return false;
        }

        if (count && count >= 30) {
            Alert.alert(
                "Posta Kutusu Dolu! 📬",
                "Ücretsiz büyü hakkınız doldu! (Max 30 mesaj). Yeni mesaj göndermek için eskileri silmelisiniz."
            );
            return false;
        }
        return true;
    };

    // Load messages from Supabase on mount & Realtime subscription
    useEffect(() => {
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
                setMessages([...MOCK_MESSAGES, ...loadedMessages]);
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 200);
            }
        };

        fetchMessages();

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

        // Quota Limit Check
        const canSend = await checkQuota();
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
        else setNewMessage('');
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
        // Quota Limit Check
        const canSend = await checkQuota();
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
            }
        }
    };

    const handleAudio = async () => {
        if (recording) {
            console.log('Stopping recording..');
            const finalDuration = formatDuration(recordingDuration);
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                // Quota Limit Check
                const canSend = await checkQuota();
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
                }
            }
        } else {
            // Quota Check before starting recording
            const canSend = await checkQuota();
            if (!canSend) return;

            setRecordingDuration(0);
            try {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Sesli mesaj için mikrofon izni gerekiyor.');
                    return;
                }
                await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
                const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
                setRecording(recording);
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
        // Prevent deleting mock messages
        if (msg.id.startsWith('mock')) return;

        Alert.alert(
            "Mesajı Sil",
            "Bu mesajı kara delikten sonsuza dek yok etmek istiyor musun?",
            [
                { text: "Vazgeç", style: 'cancel' },
                {
                    text: "Evet, Yok Et!",
                    style: 'destructive',
                    onPress: async () => {
                        // 1. Delete Media File if exists
                        if ((msg.type === 'image' || msg.type === 'audio') && (msg.media_url || msg.image || msg.audio)) {
                            const url = msg.media_url || msg.image || msg.audio;
                            if (url) {
                                try {
                                    // Extract filename from URL (assumes standard Supabase URL structure)
                                    // URL format: .../chat-media/actual_filename.jpg
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

                        // 2. Delete Database Row
                        const { error } = await supabase
                            .from('messages')
                            .delete()
                            .eq('id', msg.id);

                        if (error) {
                            Alert.alert("Hata", "Mesaj silinemedi.");
                        } else {
                            // Optimistic Update: Remove locally immediately
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
            "Sohbeti Temizle",
            "Tüm mesajlar ve dosyalar kalıcı olarak silinecek. Emin misin?",
            [
                { text: "Vazgeç", style: 'cancel' },
                {
                    text: "Evet, Hepsini Sil",
                    style: 'destructive',
                    onPress: async () => {
                        // Optimistic Update
                        setMessages((prev) => prev.filter(m => m.id.startsWith('mock'))); // Keep mock msg

                        // 1. Fetch all messages with media to delete files
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

                        // 2. Delete All Rows
                        const { error } = await supabase
                            .from('messages')
                            .delete()
                            .eq('family_id', familyId);

                        if (error) Alert.alert("Hata", "Sohbet temizlenemedi.");
                        // Realtime subscription will sync eventual consistency
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
                        <Text style={styles.headerTitle}>Aile Konseyi</Text>
                    </View>
                    <Text style={styles.headerSub}>{messages.length >= 30 ? "Posta Kutusu Dolu!" : "Görev devam ediyor..."}</Text>
                </View>
                <TouchableOpacity style={styles.iconButton} onPress={handleClearChat}>
                    <MoreVertical color="rgba(255,255,255,0.7)" size={24} />
                </TouchableOpacity>
            </BlurView>

            {/* Chat Stream */}
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={true}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                <View style={styles.dateDividerContainer}>
                    <View style={styles.dateDivider}>
                        <Text style={styles.dateText}>BUGÜN</Text>
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
                        <Text style={styles.actionChipTextPrimary}>Kanıt Yakala</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionChip, isRecording && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}
                        onPress={handleAudio}
                    >
                        <Mic size={14} color={isRecording ? "#f87171" : "#d1d5db"} />
                        <Text style={[styles.actionChipText, isRecording && { color: '#f87171' }]}>
                            {isRecording ? formatDuration(recordingDuration) : "Sesli Mesaj Yolla"}
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
                            placeholder={messages.length >= 30 ? "Kutu Dolu! Mesaj silin." : "Mesajınızı yazın..."}
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

    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fbbd23', justifyContent: 'center', alignItems: 'center', shadowColor: '#fbbd23', shadowOpacity: 0.4, shadowRadius: 10 }
});
