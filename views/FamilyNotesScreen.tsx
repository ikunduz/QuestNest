import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import {
    ArrowLeft, MoreVertical, History, Crown, BadgeCheck, Zap,
    Check, CheckCheck, Shield, Camera, Plus, ClipboardList, Mic,
    PlusCircle, Smile, Sparkles, Send
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

// Mock Messages for UI Demo
const MOCK_MESSAGES = [
    {
        id: '1',
        sender: 'High Queen (Mom)',
        role: 'parent',
        roleLabel: 'Kraliçe',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm_tpa_vT5F_a5JMBM2LLfuJYpF64jiEIBDjmBQRybkz3hX_qp5o1vpttnzR-0J4hRJR4YCdLYSo1IYUsEIq1Ct6cY9Pio4fEygWfly7oogWnRia9qWpLNfy7bT8kLYhVTAK6TdDS5IyrIte5E6Z54VPnO0JxD4_UG2muI7yAjG5D-92zNF598t5NfG6QbhiLguUG3-9x34Ffio-fjGQpHBPgJ-eOnhJt_2GRaP0zl8806pgmd1TJPFTEHVHAqJJQFhevt5_ht',
        content: 'Gün batımından önce mutfak zindanı temizlenmeli. Yağ cinlerinden sakın!',
        timestamp: '10:42 AM',
        rewards: { xp: 50 },
        verified: true,
        type: 'text'
    },
    {
        id: '2',
        type: 'system',
        message: 'Görev Güncellendi: Bulaşık makinesi dolduruldu.',
        status: 'success'
    },
    {
        id: '3',
        sender: 'Sir Cleanalot',
        role: 'child',
        roleLabel: 'Temizlik Şövalyesi',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABEdBRn00fVA7DzATIRCQp7F3frVjmhzA7fBUZl9SyY6UPPlQiz2bAX0pkTOIJD-cxsHhPFXK2RMA4EyasBSSq97JJ6tdjFdwmAPB7L5K1jvnXpyQY6Ox_T8kpuniWC6ANX-XEwcl5X-P3CxcJOjAlSH6Fb8LyRtFNUyuAXJ7dOJOybh8-B3zUzLNwQ_oUxpjbZLQsjOU9bRZt6JJkiPRsKBM-VoMkocMUNLffHTb8KYs6mUd7kWltRkEb4rOkkzzRUgVt_3NU',
        content: 'Şu anda temizlik malzemelerimi topluyorum! Tamam sayın, Kraliçem.',
        timestamp: '10:45 AM',
        readAt: '10:45 AM',
        verified: false,
        type: 'text'
    },
    {
        id: '4',
        sender: 'High Queen (Mom)',
        role: 'parent',
        roleLabel: 'Kraliçe',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFqyWdS70khA5co7OvXCfQ3on66QsoJo9ySrfTNcSJJeUZr8bQMj7fLDP9vGjRJoCKycPiFm4RARq3PuAJ5WQcO2NaPQehh4TOeka3Xq_jYphf4XXNI3w2c1uia1q_ePwCTamn5RsJAR-sqMqcRhHYUhoemcLC0bq8KE42mEDRZYaorUcjZ6AWOV1zYl0hvPeaupNQaNa7bZKmn327MGEPpZ5gyWmxbYgL5xt9M3rFJG4fSOut34EYOvXrWnbTeIbf9Ph8aKnc',
        content: 'Mükemmel. Masadaki eserleri (kirli tabakları) unutma.',
        timestamp: '10:46 AM',
        verified: true,
        type: 'text'
    }
];

interface FamilyNotesScreenProps {
    familyId: string;
    userId: string;
    userName: string;
    onBack: () => void;
}

export const FamilyNotesScreen: React.FC<FamilyNotesScreenProps> = ({ familyId, userId, userName, onBack }) => {
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState('');

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
                    <Text style={styles.headerSub}>Görev devam ediyor...</Text>
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <MoreVertical color="rgba(255,255,255,0.7)" size={24} />
                </TouchableOpacity>
            </BlurView>

            {/* Chat Stream */}
            <ScrollView
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={true}
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
                        <View key={msg.id} style={[styles.messageRow, isParent ? styles.messageLeft : styles.messageRight]}>
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
                                        isParent ? styles.bubbleBgParent : styles.bubbleBgChild
                                    ]}
                                >
                                    {/* Decorative Corners for Parent */}
                                    {isParent && (
                                        <>
                                            <View style={styles.cornerTR} />
                                            <View style={styles.cornerBL} />
                                        </>
                                    )}
                                    {/* Decorative Corners for Child */}
                                    {!isParent && (
                                        <>
                                            <View style={styles.cornerTL} />
                                            <View style={styles.cornerBR} />
                                        </>
                                    )}

                                    <Text style={styles.messageText}>{msg.content}</Text>

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
                    );
                })}


            </ScrollView>

            {/* Input Composer */}
            <BlurView intensity={40} tint="dark" style={styles.composerContainer}>
                {/* Action Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionChips}>
                    <TouchableOpacity style={styles.actionChipPrimary}>
                        <Camera size={14} color="#fbbd23" />
                        <Text style={styles.actionChipTextPrimary}>Kanıt Yakala</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionChip}>
                        <ClipboardList size={14} color="#d1d5db" />
                        <Text style={styles.actionChipText}>Yeni Görev</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionChip}>
                        <Mic size={14} color="#d1d5db" />
                        <Text style={styles.actionChipText}>Sesli Büyü</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Input Field */}
                <View style={styles.inputRow}>
                    <View style={styles.textInputWrapper}>
                        <TouchableOpacity style={styles.attachBtn}>
                            <PlusCircle size={24} color="rgba(251, 189, 35, 0.7)" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Mesajınızı yazın..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={newMessage}
                            onChangeText={setNewMessage}
                        />
                        <TouchableOpacity style={styles.emojiBtn}>
                            <Smile size={24} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.sendBtn}>
                        <Sparkles size={24} color="#231e10" fill="#231e10" />
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

    actionChips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    actionChipPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(251, 189, 35, 0.2)', borderWidth: 1, borderColor: 'rgba(251, 189, 35, 0.3)', borderRadius: 100 },
    actionChipTextPrimary: { color: '#fbbd23', fontSize: 12, fontWeight: '600' },
    actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 100 },
    actionChipText: { color: '#d1d5db', fontSize: 12, fontWeight: '500' },

    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24, minHeight: 48 },
    attachBtn: { padding: 12 },
    textInput: { flex: 1, color: '#fff', fontSize: 14, height: '100%', paddingVertical: 12 },
    emojiBtn: { padding: 12 },

    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fbbd23', justifyContent: 'center', alignItems: 'center', shadowColor: '#fbbd23', shadowOpacity: 0.4, shadowRadius: 10 }
});
