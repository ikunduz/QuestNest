import { supabase } from './supabaseClient';

// Aile kodu üret (ISIM-XXXX formatında)
export const generateFamilyCode = (childName: string): string => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${childName.toUpperCase()}-${random}`;
};

// Aile oluştur
export const createFamily = async (familyName: string, childName: string) => {
    const familyCode = generateFamilyCode(childName);

    const { data: family, error } = await supabase
        .from('families')
        .insert({ name: familyName, family_code: familyCode })
        .select()
        .single();

    if (error) throw error;
    return { family, familyCode };
};

// Aile koduna göre bul
export const findFamilyByCode = async (code: string) => {
    const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('family_code', code.toUpperCase())
        .single();

    if (error) throw error;
    return data;
};

// Kullanıcı oluştur
export const createUser = async (userData: any) => {
    const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Aile ID'sine göre bul (Dashboard için)
export const getFamilyById = async (familyId: string) => {
    const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

    if (error) throw error;
    return data;
};

// Aile üyelerini getir (Parti Durumu için)
export const getFamilyMembers = async (familyId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role, xp, level, avatar, hero_class')
        .eq('family_id', familyId)
        .eq('role', 'child');

    if (error) throw error;
    return data || [];
};

// Çocuk istatistiklerini getir
export const getChildStats = async (childId: string, familyId: string) => {
    // Tamamlanan görev sayısını getir
    const { count: completedCount, error: questError } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'completed');

    if (questError) throw questError;

    // Bekleyen görev sayısı
    const { count: pendingCount, error: pendingError } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'pending_approval');

    if (pendingError) throw pendingError;

    return {
        completedQuests: completedCount || 0,
        pendingQuests: pendingCount || 0
    };
};
