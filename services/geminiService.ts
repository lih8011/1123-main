
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateNarration = async (
  monsterLevel: number,
  humansEaten: number,
  wallsBroken: number,
  isVictory: boolean
): Promise<string> => {
  if (!ai) return "The laboratory alarms blare...";

  try {
    const prompt = `
      Context: A secret underground laboratory.
      Subject: "Subject 09", a biological experiment that has breached its containment cell.
      
      Status:
      - Subject Growth Phase: ${monsterLevel}
      - Research Staff Casualties: ${humansEaten}
      - Security Sectors Breached: ${wallsBroken}
      - Containment Status: ${isVictory ? 'FAILED - SUBJECT ESCAPED' : 'ACTIVE EMERGENCY'}
      
      Task: Write a single, clinical yet horrified status log entry from the facility AI or a dying scientist.
      - If playing: Describe the subject consuming staff, smashing lab equipment, or breaking glass walls.
      - If victory: Describe Subject 09 reaching the surface world.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Security protocols failing...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection to security feed lost...";
  }
};
