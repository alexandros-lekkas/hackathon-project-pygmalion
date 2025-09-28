import { createClient } from '@supabase/supabase-js';
import { Memory } from './types';

const supabaseUrl = 'https://nrjpsvswkjrnigajcron.supabase.co';

// Lazy initialization to avoid import-time errors
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY environment variable is required');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Helper function to read memories from Supabase
export async function readMemories(): Promise<Memory[]> {
  try {
    console.log('📖 Reading memories from Supabase...');
    
    const { data, error } = await getSupabaseClient()
      .from('memory')
      .select('title, content, importance')
      .order('importance', { ascending: false }); // Order by importance

    if (error) {
      console.error('Error reading memories from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No memories found in Supabase');
      return [];
    }
    
    // Validate each memory object
    const validMemories = data.filter((memory: any) => {
      return memory && 
             typeof memory.title === 'string' && 
             typeof memory.content === 'string' && 
             typeof memory.importance === 'number' &&
             memory.importance >= 1 && 
             memory.importance <= 10;
    });

    console.log(`✅ Read ${validMemories.length} valid memories from Supabase`);
    return validMemories;
  } catch (error) {
    console.error("Error reading memories from Supabase:", error);
    return [];
  }
}

// Helper function to write memories to Supabase (replaces all existing memories)
export async function writeMemories(memories: Memory[]): Promise<void> {
  try {
    console.log(`💾 Writing ${memories.length} memories to Supabase...`);
    
    // First, clear existing memories
    const { error: deleteError } = await getSupabaseClient()
      .from('memory')
      .delete()
      .not('title', 'is', null); // Delete all records where title is not null

    if (deleteError) {
      console.error('Error clearing existing memories:', deleteError);
    }

    // Then insert new memories
    if (memories.length > 0) {
      const { error: insertError } = await getSupabaseClient()
        .from('memory')
        .insert(memories.map(memory => ({
          title: memory.title,
          content: memory.content,
          importance: memory.importance
        })));

      if (insertError) {
        console.error('Error inserting memories to Supabase:', insertError);
        throw insertError;
      }
    }

    console.log(`✅ Successfully wrote ${memories.length} memories to Supabase`);
  } catch (error) {
    console.error("Error writing memories to Supabase:", error);
    throw error;
  }
}

// Helper function to add a single memory to Supabase
export async function addMemory(memory: Memory): Promise<void> {
  try {
    console.log(`➕ Adding memory "${memory.title}" to Supabase...`);
    
    const { error } = await getSupabaseClient()
      .from('memory')
      .insert({
        title: memory.title,
        content: memory.content,
        importance: memory.importance
      });

    if (error) {
      console.error('Error adding memory to Supabase:', error);
      throw error;
    }

    console.log(`✅ Successfully added memory "${memory.title}" to Supabase`);
  } catch (error) {
    console.error("Error adding memory to Supabase:", error);
    throw error;
  }
}

// Helper function to update a memory in Supabase
export async function updateMemory(searchTitle: string, updatedMemory: Partial<Memory>): Promise<void> {
  try {
    console.log(`✏️ Updating memory "${searchTitle}" in Supabase...`);
    
    const { error } = await getSupabaseClient()
      .from('memory')
      .update(updatedMemory)
      .ilike('title', `%${searchTitle}%`);

    if (error) {
      console.error('Error updating memory in Supabase:', error);
      throw error;
    }

    console.log(`✅ Successfully updated memory "${searchTitle}" in Supabase`);
  } catch (error) {
    console.error("Error updating memory in Supabase:", error);
    throw error;
  }
}

// Helper function to delete a memory from Supabase
export async function deleteMemory(searchTitle: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting memory "${searchTitle}" from Supabase...`);
    
    const { error } = await getSupabaseClient()
      .from('memory')
      .delete()
      .ilike('title', `%${searchTitle}%`);

    if (error) {
      console.error('Error deleting memory from Supabase:', error);
      throw error;
    }

    console.log(`✅ Successfully deleted memory "${searchTitle}" from Supabase`);
  } catch (error) {
    console.error("Error deleting memory from Supabase:", error);
    throw error;
  }
}

// Helper function to log current memories for debugging
export async function logMemories(): Promise<void> {
  try {
    const memories = await readMemories();
    console.log(`📝 Current memories (${memories.length} total):`);
    memories.forEach((memory, index) => {
      console.log(`  ${index + 1}. [${memory.importance}/10] ${memory.title}: ${memory.content.substring(0, 100)}${memory.content.length > 100 ? '...' : ''}`);
    });
  } catch (error) {
    console.error('Error logging memories:', error);
  }
}

// Helper function to clear all memories (for testing)
export async function clearAllMemories(): Promise<void> {
  try {
    console.log('🗑️ Clearing all memories from Supabase...');
    
    const { error } = await getSupabaseClient()
      .from('memory')
      .delete()
      .not('title', 'is', null); // Delete all records where title is not null

    if (error) {
      console.error('Error clearing memories from Supabase:', error);
      throw error;
    }

    console.log('✅ Successfully cleared all memories from Supabase');
  } catch (error) {
    console.error("Error clearing memories from Supabase:", error);
    throw error;
  }
}
