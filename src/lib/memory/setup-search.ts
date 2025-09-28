import { setupSearchExtensions } from "./supabase-search";

/**
 * This script sets up the necessary PostgreSQL extensions and functions
 * for advanced memory searching.
 *
 * Run this once when setting up your application or after making
 * changes to the search configuration.
 */
export async function setupMemorySearch() {
  console.log("🔍 Setting up memory search extensions...");

  try {
    const success = await setupSearchExtensions();

    if (success) {
      console.log("✅ Memory search setup completed successfully");
    } else {
      console.error("❌ Memory search setup failed");
    }

    return success;
  } catch (error) {
    console.error("❌ Memory search setup error:", error);
    return false;
  }
}

// Allow running this script directly
if (require.main === module) {
  setupMemorySearch()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
