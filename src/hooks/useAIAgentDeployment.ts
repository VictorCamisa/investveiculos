import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Deployment configuration stored in ai_agents table fields
export interface DeploymentConfig {
  // Widget settings (stored in JSON)
  widget_color?: string;
  widget_position?: 'bottom-right' | 'bottom-left';
  widget_show_avatar?: boolean;
  widget_title?: string;
  widget_welcome_message?: string;

  // WhatsApp settings
  whatsapp_instance_id?: string;
  whatsapp_auto_respond?: boolean;
  whatsapp_business_hours_start?: string;
  whatsapp_business_hours_end?: string;
  whatsapp_out_of_hours_message?: string;

  // API settings
  api_rate_limit?: number;
  api_allowed_origins?: string[];
}

interface AgentDeploymentData {
  id: string;
  status: string | null;
  embed_code: string | null;
  webhook_url: string | null;
  deployment_channels: string[] | null;
}

// Generate a simple API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sk_live_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fetch deployment config from agent's embed_code and webhook_url fields
export function useAIAgentDeploymentConfig(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-deployment', agentId],
    queryFn: async () => {
      if (!agentId) return null;

      const { data, error } = await (supabase
        .from('ai_agents') as any)
        .select('id, status, embed_code, webhook_url, deployment_channels')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const agentData = data as AgentDeploymentData;

      // Parse embed_code as JSON config if it exists
      let config: DeploymentConfig = {};
      try {
        if (agentData.embed_code && agentData.embed_code.startsWith('{')) {
          config = JSON.parse(agentData.embed_code);
        }
      } catch {
        config = {};
      }

      return {
        agentId: agentData.id,
        status: agentData.status,
        webhookUrl: agentData.webhook_url,
        deploymentChannels: agentData.deployment_channels || [],
        config,
      };
    },
    enabled: !!agentId,
  });
}

// Update deployment configuration
export function useUpdateDeploymentConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      agentId, 
      config,
      webhookUrl,
      deploymentChannels,
    }: { 
      agentId: string; 
      config?: DeploymentConfig;
      webhookUrl?: string;
      deploymentChannels?: string[];
    }) => {
      const updates: Record<string, unknown> = {};

      if (config !== undefined) {
        updates.embed_code = JSON.stringify(config);
      }
      if (webhookUrl !== undefined) {
        updates.webhook_url = webhookUrl;
      }
      if (deploymentChannels !== undefined) {
        updates.deployment_channels = deploymentChannels;
      }

      const { data, error } = await (supabase
        .from('ai_agents') as any)
        .update(updates)
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-deployment', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', variables.agentId] });
      toast.success('Configuração de implantação atualizada!');
    },
    onError: (error: Error) => {
      console.error('Error updating deployment config:', error);
      toast.error('Erro ao atualizar configuração');
    },
  });
}

// Toggle agent status
export function useToggleAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string; status: 'active' | 'inactive' }) => {
      const { data, error } = await (supabase
        .from('ai_agents') as any)
        .update({ status })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-deployment', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success(variables.status === 'active' ? 'Agente ativado!' : 'Agente desativado!');
    },
    onError: (error: Error) => {
      console.error('Error toggling agent status:', error);
      toast.error('Erro ao alterar status do agente');
    },
  });
}

// Generate or regenerate API key (stored encrypted in api_key_encrypted)
export function useGenerateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const newKey = generateApiKey();
      
      // Store the key (in production, this should be encrypted)
      const { error } = await (supabase
        .from('ai_agents') as any)
        .update({ api_key_encrypted: newKey })
        .eq('id', agentId);

      if (error) throw error;
      return { key: newKey };
    },
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-api-key', agentId] });
      toast.success('Nova chave de API gerada!');
    },
    onError: (error: Error) => {
      console.error('Error generating API key:', error);
      toast.error('Erro ao gerar chave de API');
    },
  });
}

// Fetch API key
export function useAIAgentApiKey(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-api-key', agentId],
    queryFn: async () => {
      if (!agentId) return null;

      const { data, error } = await (supabase
        .from('ai_agents') as any)
        .select('api_key_encrypted')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      return (data as { api_key_encrypted: string | null })?.api_key_encrypted || null;
    },
    enabled: !!agentId,
  });
}

// Connect agent to WhatsApp instance
export function useConnectWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      agentId, 
      instanceId,
      autoRespond = true,
      businessHoursStart = '08:00',
      businessHoursEnd = '18:00',
    }: { 
      agentId: string; 
      instanceId: string;
      autoRespond?: boolean;
      businessHoursStart?: string;
      businessHoursEnd?: string;
    }) => {
      // Get current config
      const { data: agentRaw, error: fetchError } = await (supabase
        .from('ai_agents') as any)
        .select('embed_code, deployment_channels')
        .eq('id', agentId)
        .single();

      if (fetchError) throw fetchError;

      const agent = agentRaw as { embed_code: string | null; deployment_channels: string[] | null } | null;

      let config: DeploymentConfig = {};
      try {
        const embedCode = agent?.embed_code;
        if (embedCode && typeof embedCode === 'string' && embedCode.startsWith('{')) {
          config = JSON.parse(embedCode);
        }
      } catch {
        config = {};
      }

      // Update config with WhatsApp settings
      config.whatsapp_instance_id = instanceId;
      config.whatsapp_auto_respond = autoRespond;
      config.whatsapp_business_hours_start = businessHoursStart;
      config.whatsapp_business_hours_end = businessHoursEnd;

      // Add whatsapp to deployment channels
      const currentChannels = agent?.deployment_channels || [];
      const channels = Array.isArray(currentChannels) ? [...currentChannels] : [];
      if (!channels.includes('whatsapp')) {
        channels.push('whatsapp');
      }

      const { data, error } = await (supabase
        .from('ai_agents') as any)
        .update({ 
          embed_code: JSON.stringify(config),
          deployment_channels: channels,
        })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-deployment', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', variables.agentId] });
      toast.success('WhatsApp conectado ao agente!');
    },
    onError: (error: Error) => {
      console.error('Error connecting WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp');
    },
  });
}

// Disconnect WhatsApp from agent
export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      // Get current config
      const { data: agentRaw, error: fetchError } = await (supabase
        .from('ai_agents') as any)
        .select('embed_code, deployment_channels')
        .eq('id', agentId)
        .single();

      if (fetchError) throw fetchError;

      const agent = agentRaw as { embed_code: string | null; deployment_channels: string[] | null } | null;

      let config: DeploymentConfig = {};
      try {
        const embedCode = agent?.embed_code;
        if (embedCode && typeof embedCode === 'string' && embedCode.startsWith('{')) {
          config = JSON.parse(embedCode);
        }
      } catch {
        config = {};
      }

      // Remove WhatsApp settings
      delete config.whatsapp_instance_id;
      delete config.whatsapp_auto_respond;
      delete config.whatsapp_business_hours_start;
      delete config.whatsapp_business_hours_end;
      delete config.whatsapp_out_of_hours_message;

      // Remove whatsapp from deployment channels
      const currentChannels = agent?.deployment_channels || [];
      const channels = Array.isArray(currentChannels) 
        ? currentChannels.filter((c: string) => c !== 'whatsapp')
        : [];

      const { data, error } = await (supabase
        .from('ai_agents') as any)
        .update({ 
          embed_code: JSON.stringify(config),
          deployment_channels: channels,
        })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-deployment', agentId] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', agentId] });
      toast.success('WhatsApp desconectado do agente!');
    },
    onError: (error: Error) => {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
    },
  });
}
