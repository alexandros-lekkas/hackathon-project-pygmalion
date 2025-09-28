# Hackathon Project Pygmalion 🧑‍💻

Hackathon PROJECT PYGMALION @ 9/27/2025

## Mayavatar: AI Memory Companion

## Overview

Mayavatar is an intelligent memory system that enhances AI conversations by maintaining a persistent memory store. It automatically extracts important information from conversations, saves it with appropriate importance levels, and retrieves relevant memories during future interactions.

## Features

- 🧠 **Long-Term Memory Storage** - Save important information from conversations
- 🔍 **Advanced Fuzzy Search** - Find relevant memories even with partial or imprecise queries
- 🗣️ **Text-to-Speech** - Voice output for a more natural interaction experience
- ⚡ **Real-Time Memory Processing** - Watch the agent think and process memories
- 🔄 **Context-Aware Conversations** - Automatically injects relevant memories into new conversations
- 📊 **Memory Importance Ranking** - Prioritizes memories based on their significance

## Tech Stack

- **Frontend**: Next.js 15.5.4 with Turbopack, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase with PostgreSQL (full-text search with tsvector/tsquery)
- **AI**: OpenAI Agents API
- **Voice**: ElevenLabs for text-to-speech

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- OpenAI API key
- ElevenLabs API key (optional, for TTS)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/hackathon-project-pygmalion.git
   cd hackathon-project-pygmalion
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:

   ```
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_KEY=your_supabase_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. Set up the database:
   Run the SQL from `migrations/setup_search_extensions.sql` in your Supabase SQL editor to set up full-text search.

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Usage

1. **Chat Interface**: Start talking with the agent. It will automatically extract and store important information.

2. **Memory Management**: View, search, and manage stored memories through the interface.

3. **Memory Search**: The agent will automatically search for relevant memories based on your queries.

## How It Works

### Memory System Architecture

1. **Memory Extraction**: As you chat, the agent identifies information worth remembering.

2. **Storage**: Memories are stored in Supabase with title, content, and importance rating.

3. **Retrieval**: When you ask a question, the system:

   - Uses PostgreSQL full-text search with tsvector/tsquery
   - Applies trigram similarity for fuzzy matching
   - Ranks results by relevance and importance
   - Injects relevant memories into the conversation context

4. **Processing Pipeline**:
   ```
   User Input → Memory Search → Context Enrichment → AI Response → Memory Extraction
   ```

### Advanced Search Features

- **Full-Text Indexing**: Title and content fields are indexed with different weights
- **Fuzzy Matching**: Trigram similarity finds similar terms even with typos
- **Hierarchical Ranking**: Title matches > Content matches > Importance boost

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
