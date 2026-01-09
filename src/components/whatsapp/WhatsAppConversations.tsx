import { useState, useEffect } from 'react';
import { MessageSquare, Search, Phone, User, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useWhatsAppContactsWithSalesperson, WhatsAppContactWithSalesperson } from '@/hooks/useWhatsApp';
import { useUsersWithRoles, useUserDetails } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppChatPanel } from './WhatsAppChatPanel';
import { supabase } from '@/integrations/supabase/client';

export function WhatsAppConversations() {
  const { user } = useAuth();
  const { data: currentUserDetails } = useUserDetails(user?.id || null);
  
  // Check if user is manager (gerente or master)
  const isManager = currentUserDetails?.is_master || 
    currentUserDetails?.roles?.includes('gerente') || false;
  
  const [search, setSearch] = useState('');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<WhatsAppContactWithSalesperson | null>(null);

  const { data: contacts, isLoading, refetch } = useWhatsAppContactsWithSalesperson(
    selectedSalesperson !== 'all' ? selectedSalesperson : undefined
  );
  const { data: users } = useUsersWithRoles();

  // Get salespeople for filter
  const salespeople = users?.filter(u => 
    u.roles?.some(r => r === 'vendedor')
  ) || [];

  const filteredContacts = contacts?.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.lead?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.salesperson?.full_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Contact List */}
      <div className="w-96 border-r flex flex-col">
        {/* Search and Filter */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Salesperson filter - only for managers */}
          {isManager && salespeople.length > 0 && (
            <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por vendedor" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {salespeople.map(sp => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.full_name || sp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa</p>
              <p className="text-xs mt-1">
                As conversas aparecerão aqui quando o WhatsApp estiver conectado
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedContact?.id === contact.id && "bg-muted"
                  )}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profile_pic_url} />
                      <AvatarFallback>
                        {(contact.name || contact.phone)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {contact.name || contact.phone}
                        </p>
                        {contact.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(contact.last_message_at), {
                              addSuffix: false,
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lead?.name ? `Lead: ${contact.lead.name}` : contact.phone}
                          </p>
                        </div>
                        {contact.unread_count > 0 && (
                          <Badge variant="default" className="h-5 min-w-[20px] justify-center shrink-0">
                            {contact.unread_count}
                          </Badge>
                        )}
                      </div>
                      {/* Salesperson badge - only show for managers */}
                      {isManager && contact.salesperson?.full_name && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-[10px] py-0 h-4">
                            <User className="h-2.5 w-2.5 mr-1" />
                            {contact.salesperson.full_name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedContact ? (
          <WhatsAppChatPanel 
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground p-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">WhatsApp Business</h3>
              <p className="text-sm mt-2 max-w-md">
                {isManager 
                  ? 'Selecione uma conversa para visualizar. Use o filtro para ver conversas de vendedores específicos.'
                  : 'Selecione uma conversa para visualizar ou conecte uma instância do Evolution API para começar.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
