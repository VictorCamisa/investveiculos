-- Add shared instance configuration columns
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS signature_template text DEFAULT '👤 {nome} está te atendendo';

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_instances.is_shared IS 'Whether this instance can be used by other team members';
COMMENT ON COLUMN whatsapp_instances.signature_template IS 'Template for message signature when using shared instance. Use {nome} as placeholder for user name';