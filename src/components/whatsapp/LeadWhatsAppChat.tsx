import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  Phone, 
  WifiOff,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useWhatsAppMessagesByLead,
  useWhatsAppInstances,
  useUserWhatsAppInstance,
  useSendWhatsAppMessage,
  useWhatsAppInstanceAction,
  useWhatsAppTemplates,
} from '@/hooks/useWhatsApp';
import type { WhatsAppMessage } from '@/types/whatsapp';

interface LeadWhatsAppChatProps {
  leadId: string;
  phone: string;
  leadName: string;
  lastCustomerMessageAt?: string | null;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  sent: <Check className="h-3 w-3 text-muted-foreground" />,
  delivered: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
  pending: <Clock className="h-3 w-3 text-muted-foreground" />,
  failed: <AlertCircle className="h-3 w-3 text-destructive" />,
};

export function LeadWhatsAppChat({ leadId, phone, leadName, lastCustomerMessageAt }: LeadWhatsAppChatProps) {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const isManager = role === 'gerente';

  const { data: messages = [], isLoading } = useWhatsAppMessagesByLead(leadId);
  const { data: templates = [] } = useWhatsAppTemplates();
  const { data: userInstance, isLoading: isLoadingUserInstance } = useUserWhatsAppInstance(user?.id || '');
  const { data: allInstances = [], isLoading: isLoadingAllInstances } = useWhatsAppInstances();
  const instanceAction = useWhatsAppInstanceAction();
  const sendMessage = useSendWhatsAppMessage();

  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const didAttemptWebhookRef = useRef(false);

  // Priority: 1) User's own instance if connected, 2) Shared instance, 3) Any connected instance (for managers)
  const sharedInstances = allInstances.filter(i => i.status === 'connected' && i.is_shared);
  const connectedInstances = allInstances.filter(i => i.status === 'connected');
  
  const activeInstance = userInstance?.status === 'connected' 
    ? userInstance 
    : sharedInstances[0] 
      || (isManager ? connectedInstances[0] : null);
  
  const isConnected = activeInstance?.status === 'connected';
  const isLoadingInstance = isManager ? isLoadingAllInstances : isLoadingUserInstance;

  useEffect(() => {
    if (!activeInstance?.id || !isConnected) return;
    if (didAttemptWebhookRef.current) return;

    const ensureWebhook = async () => {
      didAttemptWebhookRef.current = true;
      try {
        await instanceAction.mutateAsync({
          instanceId: activeInstance.id,
          action: 'setWebhook',
        });
      } catch (err) {
        console.error('Failed to configure webhook:', err);
      }
    };

    ensureWebhook();
  }, [activeInstance?.id, isConnected, instanceAction]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !activeInstance?.id) return;

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    await sendMessage.mutateAsync({
      instanceId: activeInstance.id,
      phone: formattedPhone,
      message: message.trim(),
      leadId,
    });

    setMessage('');
    queryClient.invalidateQueries({ queryKey: ['whatsapp-messages-lead', leadId] });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (template: { content: string }) => {
    let content = template.content;
    content = content.replace(/\{nome\}/g, leadName);
    content = content.replace(/\{telefone\}/g, phone);
    setMessage(content);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm', { locale: ptBR });
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return format(date, "d 'de' MMMM", { locale: ptBR });
    }
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
    return groups;
  }, {} as Record<string, WhatsAppMessage[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
          <Phone className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{leadName}</p>
          <p className="text-sm text-muted-foreground">{phone}</p>
        </div>
        {isConnected && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Conectado
          </Badge>
        )}
      </div>

      {!isLoadingInstance && !isConnected && (
        <Alert variant="destructive" className="mx-6 mt-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {isManager 
              ? 'Nenhuma instância WhatsApp conectada. Peça para um vendedor conectar seu WhatsApp.'
              : 'Seu WhatsApp não está conectado. Vá em Configurações → Usuários e ative seu WhatsApp.'
            }
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-xl`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
            <Phone className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie a conversa enviando uma mensagem</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
              <div key={dateKey}>
                <div className="flex justify-center my-4">
                  <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {formatMessageDate(msgs[0].created_at)}
                  </span>
                </div>
                <div className="space-y-2">
                  {msgs.map((msg) => {
                    const isOutgoing = msg.direction === 'outgoing';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isOutgoing
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOutgoing ? 'justify-end' : ''}`}>
                            <span className={`text-[10px] ${isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isOutgoing && STATUS_ICONS[msg.status || 'sent']}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {templates.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/20">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            {templates.slice(0, 4).map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => handleTemplateSelect(template)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            placeholder={isConnected ? 'Digite sua mensagem...' : 'WhatsApp não conectado'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected || sendMessage.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || !isConnected || sendMessage.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
