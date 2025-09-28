import { ElevenLabs } from "@elevenlabs/elevenlabs-js";

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Default female voice ID (you can change this to any voice you prefer)
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Bella - a popular female voice

export interface TTSResponse {
  audioUrl: string;
  success: boolean;
  error?: string;
}

export const generateSpeech = async (
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<TTSResponse> => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    // Generate speech using ElevenLabs
    const audioBuffer = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    });

    // Convert buffer to base64 data URL for immediate playback
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return {
      audioUrl,
      success: true,
    };
  } catch (error) {
    console.error("TTS generation error:", error);
    return {
      audioUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Get available voices (for future voice selection feature)
export const getAvailableVoices = async () => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const voices = await elevenlabs.voices.getAll();
    return voices.voices.filter(voice => 
      voice.labels?.gender === 'female' || 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('woman')
    );
  } catch (error) {
    console.error("Error fetching voices:", error);
    return [];
  }
};
