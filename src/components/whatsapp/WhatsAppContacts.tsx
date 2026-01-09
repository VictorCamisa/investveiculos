import { useState } from 'react';
import { Search, User, Phone, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWhatsAppContacts } from '@/hooks/useWhatsApp';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WhatsAppContacts() {
  const { data: contacts, isLoading } = useWhatsAppContacts();
  const [search, setSearch] = useState('');

  const filteredContacts = contacts?.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contatos WhatsApp</h2>
          <p className="text-muted-foreground">
            Contatos sincronizados das conversas
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando...
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum contato encontrado</p>
          <p className="text-sm mt-1">
            Os contatos serão sincronizados quando receber mensagens
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Vinculado a</TableHead>
                <TableHead>Última Mensagem</TableHead>
                <TableHead>Não Lidas</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.profile_pic_url} />
                        <AvatarFallback>
                          {(contact.name || contact.phone)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {contact.name || 'Sem nome'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-0.5 rounded">
                      {contact.phone}
                    </code>
                  </TableCell>
                  <TableCell>
                    {contact.lead ? (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        Lead: {contact.lead.name}
                      </Badge>
                    ) : contact.customer ? (
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Cliente: {contact.customer.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Não vinculado
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.last_message_at ? (
                      formatDistanceToNow(new Date(contact.last_message_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.unread_count > 0 ? (
                      <Badge>{contact.unread_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
