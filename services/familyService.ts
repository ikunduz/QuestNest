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
