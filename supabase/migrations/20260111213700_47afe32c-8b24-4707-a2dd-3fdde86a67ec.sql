-- Add voice configuration fields to ai_agents table
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS enable_voice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT 'JBFqnCBsd6RMkjVDRZzb';

-- Add comment for documentation
COMMENT ON COLUMN ai_agents.enable_voice IS 'Enable Text-to-Speech for agent responses';
COMMENT ON COLUMN ai_agents.voice_id IS 'ElevenLabs voice ID for TTS';