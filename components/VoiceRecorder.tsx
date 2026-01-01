import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Mic, Square, Send, X, Play } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface VoiceRecorderProps {
    onRecordComplete: (audioUri: string) => void;
    maxDuration?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onRecordComplete,
    maxDuration = 30
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startRecording = async () => {
        try {
            // İzin iste
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert('İzin Gerekli', 'Ses kaydı için mikrofon izni gerekli.');
                return;
            }

            // Audio modunu ayarla
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Yeni kayıt başlat
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await recording.startAsync();
            recordingRef.current = recording;

            setIsRecording(true);
            setDuration(0);
            setRecordedUri(null);

            // Timer başlat
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= maxDuration - 1) {
                        stopRecording();
                        return maxDuration;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Recording error:', error);
            Alert.alert('Hata', 'Ses kaydı başlatılamadı.');
        }
    };

    const stopRecording = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsRecording(false);

        if (recordingRef.current) {
            try {
                await recordingRef.current.stopAndUnloadAsync();
                const uri = recordingRef.current.getURI();
                setRecordedUri(uri);
                recordingRef.current = null;

                // Reset audio mode
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                });
            } catch (error) {
                console.error('Stop recording error:', error);
            }
        }
    };

    const playPreview = async () => {
        if (!recordedUri) return;

        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
            soundRef.current = sound;

            setIsPlaying(true);
            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.error('Playback error:', error);
            setIsPlaying(false);
        }
    };

    const handleSend = () => {
        if (recordedUri) {
            onRecordComplete(recordedUri);
            setRecordedUri(null);
            setDuration(0);
        }
    };

    const handleCancel = () => {
        setRecordedUri(null);
        setDuration(0);
    };

    const formatDuration = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            {recordedUri ? (
                <View style={styles.recordedContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <X color="#f43f5e" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.playButton} onPress={playPreview}>
                        <Play color="#fff" size={16} />
                        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Send color="#0f172a" size={18} />
                        <Text style={styles.sendButtonText}>GÖNDER</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.recordContainer}>
                    <TouchableOpacity
                        style={[styles.recordButton, isRecording && styles.recording]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? (
                            <Square color="#fff" size={24} />
                        ) : (
                            <Mic color="#fff" size={24} />
                        )}
                    </TouchableOpacity>
                    {isRecording && (
                        <View style={styles.recordingInfo}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.durationText}>{formatDuration(duration)} / {maxDuration}s</Text>
                        </View>
                    )}
                    {!isRecording && (
                        <Text style={styles.hintText}>Kayıt için bas</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    recordContainer: {
        alignItems: 'center',
    },
    recordButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recording: {
        backgroundColor: '#e11d48',
    },
    recordingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e11d48',
        marginRight: 8,
    },
    durationText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    hintText: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 8,
    },
    recordedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cancelButton: {
        padding: 10,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        gap: 8,
    },
    sendButton: {
        flexDirection: 'row',
        backgroundColor: '#fbbf24',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#0f172a',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
