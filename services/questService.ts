import { supabase } from './supabaseClient';

// Görevleri çek
export const fetchQuests = async (familyId: string) => {
    const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// Görev ekle
export const addQuest = async (quest: any) => {
    const { data, error } = await supabase
        .from('quests')
        .insert(quest)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Görev durumunu güncelle
export const updateQuestStatus = async (questId: string, status: string) => {
    const { error } = await supabase
        .from('quests')
        .update({
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', questId);

    if (error) throw error;
};

// Görevleri dinle (realtime)
export const subscribeToQuests = (familyId: string, callback: (payload: any) => void) => {
    return supabase
        .channel('public:quests')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'quests',
                filter: `family_id=eq.${familyId}`
            },
            callback
        )
        .subscribe();
};
