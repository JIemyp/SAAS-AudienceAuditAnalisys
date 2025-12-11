-- AI Provider Settings per user
-- Allows users to choose their AI provider and enter their own API key

CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL DEFAULT 'anthropic',
  model VARCHAR(100),
  api_key_encrypted TEXT, -- encrypted API key (null = use system key)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view own ai settings"
  ON ai_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai settings"
  ON ai_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai settings"
  ON ai_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai settings"
  ON ai_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_ai_settings_user_id ON ai_settings(user_id);

-- Add constraint for valid providers
ALTER TABLE ai_settings
ADD CONSTRAINT valid_provider
CHECK (provider IN ('anthropic', 'openai', 'google'));

-- Comment for documentation
COMMENT ON TABLE ai_settings IS 'User AI provider settings - stores provider preference and encrypted API keys';
COMMENT ON COLUMN ai_settings.api_key_encrypted IS 'Encrypted API key - null means use system default key';
