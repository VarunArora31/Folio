-- Add Y.js collaboration fields to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS y_doc_state BYTEA;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_version INTEGER DEFAULT 0 NOT NULL;

-- Create document_sessions table for tracking active users
CREATE TABLE IF NOT EXISTS document_sessions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  connected_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_seen TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_sessions_document_id ON document_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sessions_user_id ON document_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_sessions_last_seen ON document_sessions(last_seen);

-- Add index on documents y_doc_state for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_y_doc_state ON documents(id) WHERE y_doc_state IS NOT NULL;
