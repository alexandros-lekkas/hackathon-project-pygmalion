import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid import-time errors
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required');
    }
    
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export async function uploadScanImage(file: File): Promise<string> {
  try {
    console.log(`📤 Uploading scan image via API...`);
    
    // Create a FormData object and append the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Use our server API endpoint to upload the file
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const result = await response.json();
    console.log(`✅ Successfully uploaded scan image: ${result.url}`);
    
    return result.url;
  } catch (error) {
    console.error("Error uploading scan image:", error);
    throw error;
  }
}
