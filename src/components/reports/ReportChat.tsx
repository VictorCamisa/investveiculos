import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Bot, User, Sparkles, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { templates } from './ReportGallery';
import { ReportViewer } from './ReportViewer';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  report?: AIReport;
  isLoading?: boolean;
}

interface AIReport {
  title: string;
  period?: { from: string; to: string };
  kpis?: { label: string; value: string; trend?: string }[];
  sections?: { title: string; content: string }[];
  insights?: string[];
  generatedAt: string;
}

interface ReportChatProps {
  initialTemplate: string | null;
  onClearTemplate: () => void;
}

const SUGGESTIONS = [
  'Como estão as vendas desta semana?',
  'Qual o melhor vendedor do mês?',
  'Analise o ROI das campanhas de marketing',
  'Quais leads não foram atendidos?',
];

export function ReportChat({ initialTemplate, onClearTemplate }: ReportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle template selection
  useEffect(() => {
    if (initialTemplate) {
      const template = templates.find(t => t.id === initialTemplate);
      if (template) {
        handleSend(template.prompt);
        onClearTemplate();
      }
    }
  }, [initialTemplate]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-report', {
        body: { message: messageText }
      });

      if (functionError) throw functionError;

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: functionData.content || 'Relatório gerado com sucesso.',
        report: functionData.report,
      };

      setMessages(prev => 
        prev.map(m => m.isLoading ? assistantMessage : m)
      );
    } catch (error) {
      console.error('Error generating report:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao gerar o relatório. Tente novamente.',
      };

      setMessages(prev => 
        prev.map(m => m.isLoading ? errorMessage : m)
      );
      
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Assistente de Relatórios</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Peça qualquer relatório em linguagem natural. Eu vou buscar os dados e gerar análises para você.
              </p>
              
              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(suggestion)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.isLoading ? (
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Gerando relatório...</span>
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </Card>
                    ) : message.role === 'user' ? (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
                        {message.content}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {message.content && (
                          <Card className="p-4">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </Card>
                        )}
                        {message.report && <ReportViewer report={message.report} />}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <CardContent className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Peça um relatório... Ex: 'Qual o desempenho de vendas desta semana?'"
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
