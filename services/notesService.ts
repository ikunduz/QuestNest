import { supabase } from './supabaseClient';

// Notları çek
export const fetchNotes = async (familyId: string, userId: string) => {
    const { data, error } = await supabase
        .from('family_notes')
        .select('*, from_user:users!from_user(name, avatar_url)')
        .eq('family_id', familyId)
        .or(`to_user.eq.${userId},to_user.is.null`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Not gönder
export const sendNote = async (note: any) => {
    const { data, error } = await supabase
        .from('family_notes')
        .insert(note)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Notu okundu olarak işaretle
export const markNoteAsRead = async (noteId: string) => {
    const { error } = await supabase
        .from('family_notes')
        .update({ is_read: true })
        .eq('id', noteId);

    if (error) throw error;
};

// Notları dinle (realtime)
export const subscribeToNotes = (familyId: string, userId: string, callback: (payload: any) => void) => {
    return supabase
        .channel('public:family_notes')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'family_notes',
                filter: `family_id=eq.${familyId}`
            },
            (payload: any) => {
                if (!payload.new.to_user || payload.new.to_user === userId) {
                    callback(payload);
                }
            }
        )
        .subscribe();
};
