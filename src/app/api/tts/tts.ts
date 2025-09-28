import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

// Default voice ID (you can change this to any voice you prefer)
const DEFAULT_VOICE_ID = "XB0fDUnXU5powFXDhCwa"; // Default female voice

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

    // Determine speed based on voice ID
    const isMaleVoice = voiceId === "GBv7mTt0atIp3Br8iCZE";
    const speed = isMaleVoice ? 1.0 : 1.2; // Normal speed for male, faster for female

    // Generate speech using ElevenLabs JavaScript SDK
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        useSpeakerBoost: true,
        speed: speed,
      },
    });

    // Convert audio stream to base64 data URL for immediate playback
    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const base64Audio = Buffer.from(audioBuffer).toString("base64");
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
    return voices.voices.filter(
      (voice) =>
        voice.labels?.gender === "female" ||
        voice.name?.toLowerCase().includes("female") ||
        voice.name?.toLowerCase().includes("woman")
    );
  } catch (error) {
    console.error("Error fetching voices:", error);
    return [];
  }
};
