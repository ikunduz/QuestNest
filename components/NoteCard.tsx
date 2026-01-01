import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, UserCircle } from 'lucide-react-native';

interface NoteCardProps {
    note: {
        id: string;
        note_type: 'text' | 'voice';
        content?: string;
        audio_url?: string;
        is_read: boolean;
        created_at: string;
        from_user?: {
            name: string;
            avatar_url?: string;
        };
    };
    onPlay?: (audioUrl: string) => void;
    onMarkRead?: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPlay, onMarkRead }) => {
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <TouchableOpacity
            style={[styles.card, !note.is_read && styles.unread]}
            onPress={() => onMarkRead?.(note.id)}
        >
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <UserCircle color="#fbbf24" size={32} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{note.from_user?.name || 'Anonim'}</Text>
                    <Text style={styles.time}>{formatTime(note.created_at)}</Text>
                </View>
                {!note.is_read && <View style={styles.badge} />}
            </View>

            {note.note_type === 'text' ? (
                <Text style={styles.content}>{note.content}</Text>
            ) : (
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => note.audio_url && onPlay?.(note.audio_url)}
                >
                    <Play color="#fbbf24" size={24} />
                    <Text style={styles.playText}>Sesli Notu Dinle</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    unread: {
        borderColor: '#fbbf24',
        borderLeftWidth: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: { marginLeft: 12, flex: 1 },
    name: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    time: { color: '#64748b', fontSize: 10 },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fbbf24',
    },
    content: {
        color: '#cbd5e1',
        fontSize: 14,
        lineHeight: 20,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 16,
    },
    playText: {
        color: '#fbbf24',
        marginLeft: 8,
        fontWeight: 'bold',
    },
});
