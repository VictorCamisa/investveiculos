import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audio?: string;
  toolCalls?: any[];
  toolResults?: any[];
}

interface UseAgentChatOptions {
  agentId: string;
  leadId?: string;
  phone?: string;
  channel?: 'widget' | 'whatsapp' | 'crm' | 'api';
  enableTTS?: boolean;
  voiceId?: string;
}

interface UseAgentChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAgentChat({
  agentId,
  leadId,
  phone,
  channel = 'api',
  enableTTS = false,
  voiceId,
}: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          agent_id: agentId,
          message: content.trim(),
          conversation_id: conversationId,
          lead_id: leadId,
          phone,
          channel,
          enable_tts: enableTTS,
          voice_id: voiceId,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'Desculpe, não consegui processar sua mensagem.',
        audio: data.audio,
        toolCalls: data.tool_calls,
        toolResults: data.tool_results,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Agent chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      setError(errorMessage);
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, conversationId, leadId, phone, channel, enableTTS, voiceId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearMessages,
  };
}
