import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { generateSpeech } from '../tts/tts';

interface FacialAnalysisResult {
  attractiveness: number;
  boneMass: number;
  nose: number;
  positiveCantalTilt: number;
  jawline: number;
  eyeArea: number;
  symmetry: number;
  analysis: string;
}

interface AudioFeedback {
  audioUrl: string;
  message: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const herdoraApiKey = process.env.HERDORA_API_KEY!;

// We use the service key on the server side to bypass RLS policies
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate audio feedback based on attractiveness score
async function generateAudioFeedback(attractivenessScore: number): Promise<AudioFeedback> {
  let message = "";
  let maleVoiceId = "ODq5zmih8GrVes37Dizd"; // Default male voice
  
  // Determine message based on score ranges
  if (attractivenessScore < 50) {
    message = "You are so chopped.";
  } else if (attractivenessScore >= 50 && attractivenessScore < 75) {
    message = "You aight.";
  } else {
    message = "Hey handsome!";
  }
  
  // Generate speech with the message
  const result = await generateSpeech(message, maleVoiceId);
  
  return {
    audioUrl: result.audioUrl,
    message
  };
}

async function analyzeFacialImage(imageUrl: string): Promise<FacialAnalysisResult> {
  try {
    console.log('🔍 Server: Analyzing facial image...');
    
    // Check for API key
    if (!herdoraApiKey) {
      throw new Error("HERDORA_API_KEY is not defined in server environment");
    }
    
    // Create client exactly matching the example format
    const client = new OpenAI({
      baseURL: "https://pygmalion.herdora.com/v1",
      apiKey: herdoraApiKey, // Using environment variable
    });

    // Call the API
    const response = await client.chat.completions.create({
      model: "Qwen/Qwen3-VL-235B-A22B-Instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this facial image and provide ratings for the following metrics on a scale of 0-100:\n" +
                   "- Attractiveness\n" + 
                   "- Bone mass\n" + 
                   "- Nose\n" + 
                   "- Positive canthal tilt\n" + 
                   "- Jawline\n" + 
                   "- Eye area\n" + 
                   "- Symmetry\n\n" +
                   "Also provide a brief analysis paragraph. Format your response as JSON with the following structure:\n" +
                   '{\n' +
                   '  "attractiveness": 0-100,\n' +
                   '  "boneMass": 0-100,\n' +
                   '  "nose": 0-100,\n' +
                   '  "positiveCantalTilt": 0-100,\n' +
                   '  "jawline": 0-100,\n' +
                   '  "eyeArea": 0-100,\n' +
                   '  "symmetry": 0-100,\n' +
                   '  "analysis": "Brief analysis paragraph"\n' +
                   '}'
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message.content || '';
    console.log('✅ Server: Facial analysis complete');
    
    try {
      const result = JSON.parse(content) as FacialAnalysisResult;
      return result;
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }
  } catch (error: any) {
    console.error('Error analyzing facial image:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase key' },
        { status: 500 }
      );
    }

    if (!herdoraApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Herdora API key' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert the file to an array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload the file to Supabase Storage
    const fileName = `scan_${Date.now()}.jpg`;
    
    const { data, error } = await supabase
      .storage
      .from('scans')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('scans')
      .getPublicUrl(fileName);

    const imageUrl = urlData?.publicUrl;

    // Analyze the image using the Herdora API
    try {
      const analysisResults = await analyzeFacialImage(imageUrl);
      
      // Generate audio feedback based on attractiveness score
      const audioFeedback = await generateAudioFeedback(analysisResults.attractiveness);
      
      // Return the image URL, analysis results, and audio feedback
      return NextResponse.json({
        success: true,
        url: imageUrl,
        analysis: analysisResults,
        audio: audioFeedback
      });
    } catch (analysisError: any) {
      console.error("Analysis error:", analysisError);
      return NextResponse.json({
        success: false,
        url: imageUrl, // Still return the URL even if analysis failed
        error: analysisError.message
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
