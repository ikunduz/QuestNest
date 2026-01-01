
import { GoogleGenAI } from "@google/genai";

// getWisdomMessage uses Gemini AI to generate a thematic greeting for the player.
export const getWisdomMessage = async (playerName: string, level: number) => {
  try {
    // In Expo, environment variables should be prefixed with EXPO_PUBLIC_
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return "Krallığın ışığı seninle olsun!";
    }

    const genAI = new GoogleGenAI({ apiKey });

    // Using the same pattern as original code which seemed to work for them
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Sen "Görev Veren Bilge"sin. ${playerName} ismindeki kahraman ${level}. seviyeye ulaştı. Ona kısa, motive edici, fantastik bir RPG tarzında Türkçe bir karşılama mesajı yaz. Maksimum 20 kelime olsun.`,
    });

    return response.text || "Yolun açık olsun yüce muhafız!";
  } catch (error) {
    console.error("AI Error:", error);
    return "Krallığın ışığı seninle olsun!";
  }
};
