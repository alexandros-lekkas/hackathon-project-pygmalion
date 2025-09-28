-- Enable the pg_trgm extension for trigram similarity search
CREATE OR REPLACE FUNCTION public.enable_pg_trgm()
RETURNS void AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update the search_vector column and related indexes
CREATE OR REPLACE FUNCTION public.setup_memory_search()
RETURNS void AS $$
BEGIN
  -- Check if search_vector column exists, if not create it
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'memory'
    AND column_name = 'search_vector'
  ) THEN
    -- Add tsvector column
    ALTER TABLE public.memory ADD COLUMN search_vector tsvector;
  END IF;
  
  -- Update search_vector column with weighted title and content
  UPDATE public.memory
  SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B');
  
  -- Create GIN index for tsvector search if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'memory_search_vector_idx'
  ) THEN
    CREATE INDEX memory_search_vector_idx ON public.memory USING GIN(search_vector);
  END IF;
  
  -- Create GIN index for trigram search on title and content if they don't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'memory_title_trgm_idx'
  ) THEN
    CREATE INDEX memory_title_trgm_idx ON public.memory USING GIN (title gin_trgm_ops);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'memory_content_trgm_idx'
  ) THEN
    CREATE INDEX memory_content_trgm_idx ON public.memory USING GIN (content gin_trgm_ops);
  END IF;
  
  -- Create trigger to automatically update search_vector on insert or update
  DROP TRIGGER IF EXISTS memory_search_vector_update ON public.memory;
  CREATE TRIGGER memory_search_vector_update
  BEFORE INSERT OR UPDATE ON public.memory
  FOR EACH ROW EXECUTE FUNCTION update_memory_search_vector();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update search_vector automatically
CREATE OR REPLACE FUNCTION public.update_memory_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a custom type to return memory with score
CREATE TYPE memory_with_score AS (
  id integer,
  title text,
  content text,
  importance integer,
  score float
);

-- Create search function using full text search
CREATE OR REPLACE FUNCTION public.search_memories_full_text(query_text TEXT, result_limit INTEGER DEFAULT 5)
RETURNS SETOF memory_with_score AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.content,
    m.importance,
    (ts_rank(m.search_vector, plainto_tsquery('english', query_text)) * 100 * importance / 10)::float as score
  FROM public.memory m
  WHERE m.search_vector @@ plainto_tsquery('english', query_text)
  ORDER BY 
    score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create search function using trigram similarity
CREATE OR REPLACE FUNCTION public.search_memories_trigram(query_text TEXT, result_limit INTEGER DEFAULT 5)
RETURNS SETOF memory_with_score AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.content,
    m.importance,
    ((similarity(m.title, query_text) * 2 + similarity(m.content, query_text)) * 100 * importance / 10)::float as score
  FROM public.memory m
  ORDER BY 
    score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
