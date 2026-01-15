import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Minimize2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '@/assets/logo-invest-veiculos.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ID do agente padrão para o site público - pode ser configurado
const DEFAULT_AGENT_ID = 'public-website-agent';

export function PublicChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar o primeiro agente ativo ao abrir o chat
  useEffect(() => {
    const fetchActiveAgent = async () => {
      const { data } = await supabase
        .from('ai_agents')
        .select('id, name')
        .eq('status', 'active')
        .limit(1) as { data: { id: string; name: string }[] | null };
      
      if (data && data.length > 0) {
        setAgentId(data[0].id);
      }
    };

    if (isOpen && !agentId) {
      fetchActiveAgent();
    }
  }, [isOpen, agentId]);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 👋 Bem-vindo à Invest Veículos! Sou a assistente virtual e estou aqui para te ajudar a encontrar o veículo ideal. Como posso ajudá-lo hoje?',
      }]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Se não tiver agentId, usa um fallback simples
      if (!agentId) {
        // Fallback: resposta simples sem IA
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Obrigado pelo seu interesse! Para um atendimento mais completo, entre em contato pelo telefone (12) 97898-4051 ou visite nossa loja na Av. Dom Pedro I, 7231 - Loja 03, Estoril, Taubaté.',
          }]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          agent_id: agentId,
          message: userMessage.content,
          conversation_id: conversationId,
          channel: 'website',
          enable_tts: false,
        },
      });

      if (error) throw error;

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Para um atendimento imediato, entre em contato pelo telefone (12) 97898-4051.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    if (isOpen && !isMinimized) {
      setIsOpen(false);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={cn(
              'mb-4 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden',
              isMinimized ? 'h-14 w-72' : 'w-[340px] sm:w-[380px] h-[480px] sm:h-[520px]'
            )}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-public-primary text-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center p-1">
                  <img src={logoImg} alt="Invest" className="h-full w-auto object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Invest Veículos</h3>
                  <p className="text-xs opacity-80">Online agora</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 h-[340px] sm:h-[380px] p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        className={cn(
                          'flex gap-2',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="h-8 w-8 flex-shrink-0 bg-public-primary/10">
                            <AvatarFallback className="bg-public-primary/10 text-public-primary text-xs">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                            message.role === 'user'
                              ? 'bg-public-primary text-white rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-2 justify-start">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-public-primary/10 text-public-primary text-xs">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      disabled={isLoading}
                      className="flex-1 rounded-full text-sm"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="rounded-full flex-shrink-0 bg-public-primary hover:bg-public-primary/90"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-lg bg-public-primary text-white flex items-center justify-center hover:scale-105 transition-transform"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
