import { OpenAI } from 'openai';

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

export async function analyzeFacialImage(imageUrl: string): Promise<FacialAnalysisResult> {
  try {
    console.log('🔍 Analyzing facial image...');
    
    const apiKey = process.env.NEXT_PUBLIC_HERDORA_API_KEY;
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_HERDORA_API_KEY is not defined. Please set this environment variable.");
    }
    
    // Force the apiKey to be passed explicitly to override any default behavior
    const client = new OpenAI({
      baseUrl: "https://pygmalion.herdora.com/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Allow usage in browser
    });

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
    console.log('✅ Facial analysis complete');
    
    try {
      const result = JSON.parse(content) as FacialAnalysisResult;
      return result;
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }
  } catch (error) {
    console.error('Error analyzing facial image:', error);
    throw error;
  }
}
