import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MessageCircle, Send, Mic, ChevronLeft } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { GameButton } from '../components/GameButton';
import { NoteCard } from '../components/NoteCard';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { fetchNotes, sendNote, markNoteAsRead, subscribeToNotes, deleteNote } from '../services/notesService';

interface FamilyNotesScreenProps {
    familyId: string;
    userId: string;
    userName: string;
    onBack: () => void;
}

export const FamilyNotesScreen: React.FC<FamilyNotesScreenProps> = ({
    familyId,
    userId,
    userName,
    onBack
}) => {
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');
    const [showVoice, setShowVoice] = useState(false);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        loadNotes();

        const subscription = subscribeToNotes(familyId, userId, () => {
            loadNotes();
        });

        return () => {
            subscription.unsubscribe();
            // Cleanup sound on unmount
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const loadNotes = async () => {
        try {
            const data = await fetchNotes(familyId, userId);
            setNotes(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSendText = async () => {
        if (!newNote.trim()) return;

        try {
            await sendNote({
                family_id: familyId,
                from_user: userId,
                note_type: 'text',
                content: newNote.trim(),
            });
            setNewNote('');
            await loadNotes();
        } catch (e) {
            Alert.alert('Hata', 'Not gönderilemedi.');
        }
    };

    const handleSendVoice = async (audioUri: string) => {
        try {
            await sendNote({
                family_id: familyId,
                from_user: userId,
                note_type: 'voice',
                audio_url: audioUri,
            });
            setShowVoice(false);
            await loadNotes();
            Alert.alert('✅', 'Sesli not gönderildi!');
        } catch (e) {
            Alert.alert('Hata', 'Sesli not gönderilemedi.');
        }
    };

    const handlePlayAudio = async (audioUrl: string) => {
        try {
            // Önceki sesi durdur
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            // Audio modunu ayarla
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            // Yeni sesi yükle ve oynat
            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true }
            );

            soundRef.current = sound;
            setPlayingId(audioUrl);

            // Oynatma bittiğinde
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                }
            });

        } catch (error) {
            console.error('Playback error:', error);
            Alert.alert('Hata', 'Ses oynatılamadı. Dosya bulunamadı.');
            setPlayingId(null);
        }
    };

    const handleMarkRead = async (noteId: string) => {
        try {
            await markNoteAsRead(noteId);
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
            Alert.alert('✅', 'Not silindi!');
        } catch (e) {
            console.error(e);
            Alert.alert('Hata', 'Not silinemedi.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft color="#fbbf24" size={24} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <MessageCircle color="#fbbf24" size={24} />
                    <Text style={styles.title}>AİLE NOTLARI</Text>
                </View>
            </View>

            <ScrollView style={styles.notesList} contentContainerStyle={{ paddingBottom: 100 }}>
                {notes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MessageCircle color="#334155" size={48} />
                        <Text style={styles.emptyText}>Henüz not yok</Text>
                        <Text style={styles.emptySubtext}>Ailene ilk notu gönder!</Text>
                    </View>
                ) : (
                    notes.map(note => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onMarkRead={handleMarkRead}
                            onPlay={handlePlayAudio}
                            onDelete={handleDeleteNote}
                        />
                    ))
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                {showVoice ? (
                    <View style={styles.voiceContainer}>
                        <VoiceRecorder onRecordComplete={handleSendVoice} />
                        <TouchableOpacity
                            style={styles.cancelVoice}
                            onPress={() => setShowVoice(false)}
                        >
                            <Text style={styles.cancelText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.textInputRow}>
                        <TextInput
                            style={styles.input}
                            value={newNote}
                            onChangeText={setNewNote}
                            placeholder="Bir not bırak..."
                            placeholderTextColor="#64748b"
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.voiceButton}
                            onPress={() => setShowVoice(true)}
                        >
                            <Mic color="#94a3b8" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSendText}
                        >
                            <Send color="#fbbf24" size={20} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    backButton: { marginRight: 12 },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#fbbf24', marginLeft: 8 },
    notesList: { flex: 1, padding: 16 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', fontSize: 16, marginTop: 16 },
    emptySubtext: { color: '#475569', fontSize: 12, marginTop: 4 },
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1e293b',
        borderTopWidth: 1,
        borderTopColor: '#334155',
        padding: 12,
    },
    voiceContainer: {
        alignItems: 'center',
    },
    cancelVoice: {
        marginTop: 8,
    },
    cancelText: {
        color: '#f43f5e',
        fontSize: 12,
    },
    textInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#0f172a',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#fff',
        maxHeight: 100,
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
