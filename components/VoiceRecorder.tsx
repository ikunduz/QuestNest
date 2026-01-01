import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Mic, Square, Send } from 'lucide-react-native';
// Not: expo-av kurulu olmalı
// import { Audio } from 'expo-av';

interface VoiceRecorderProps {
    onRecordComplete: (audioUri: string) => void;
    maxDuration?: number; // saniye
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onRecordComplete,
    maxDuration = 30
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    // const recordingRef = useRef<Audio.Recording | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            // Gerçek implementasyon için expo-av kullanılmalı
            // const { granted } = await Audio.requestPermissionsAsync();
            // if (!granted) {
            //   Alert.alert('İzin Gerekli', 'Ses kaydı için mikrofon izni gerekli.');
            //   return;
            // }
            // await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            // const recording = new Audio.Recording();
            // await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            // await recording.startAsync();
            // recordingRef.current = recording;

            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= maxDuration - 1) {
                        stopRecording();
                        return maxDuration;
                    }
                    return prev + 1;
                });
            }, 1000);

            // Simülasyon için
            Alert.alert('Bilgi', 'Ses kaydı simülasyonu başlatıldı. Gerçek uygulama için expo-av kurulmalı.');
        } catch (error) {
            console.error('Recording error:', error);
            Alert.alert('Hata', 'Ses kaydı başlatılamadı.');
        }
    };

    const stopRecording = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setIsRecording(false);

        // Gerçek implementasyon
        // if (recordingRef.current) {
        //   await recordingRef.current.stopAndUnloadAsync();
        //   const uri = recordingRef.current.getURI();
        //   setRecordedUri(uri);
        // }

        // Simülasyon
        setRecordedUri('simulated-audio-uri');
    };

    const handleSend = () => {
        if (recordedUri) {
            onRecordComplete(recordedUri);
            setRecordedUri(null);
            setDuration(0);
        }
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
                    <Text style={styles.durationText}>{formatDuration(duration)} kayıt</Text>
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Send color="#0f172a" size={20} />
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
                        <Text style={styles.durationText}>{formatDuration(duration)} / {maxDuration}s</Text>
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
    durationText: {
        color: '#94a3b8',
        marginTop: 8,
        fontSize: 14,
        fontWeight: 'bold',
    },
    recordedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
