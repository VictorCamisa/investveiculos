import { useState, useRef, useEffect } from 'react';
import { Send, Volume2, VolumeX, Loader2, RotateCcw, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAgentChat } from '@/hooks/useAgentChat';

interface AgentChatPanelProps {
  agentId: string;
  agentName: string;
  leadId?: string;
  phone?: string;
  className?: string;
}

export function AgentChatPanel({
  agentId,
  agentName,
  leadId,
  phone,
  className,
}: AgentChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [enableTTS, setEnableTTS] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useAgentChat({
    agentId,
    leadId,
    phone,
    channel: 'crm',
    enableTTS,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const playAudio = (base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    
    audio.play().catch(console.error);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{agentName}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {messages.length} mensagens
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEnableTTS(!enableTTS)}
              title={enableTTS ? 'Desativar voz' : 'Ativar voz'}
            >
              {enableTTS ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearMessages}
              title="Limpar conversa"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Inicie uma conversa com o agente</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      'rounded-xl px-4 py-2.5 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.audio && enableTTS && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start h-6 px-2 text-xs"
                      onClick={() => playAudio(message.audio!)}
                      disabled={isPlayingAudio}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Ouvir resposta
                    </Button>
                  )}
                  
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {message.toolCalls.map((tc: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          🔧 {tc.function?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-2">
                <Badge variant="destructive" className="text-xs">
                  Erro: {error}
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
