import { useMemo } from 'react';
import { 
  MessageSquare, 
  Clock, 
  Send, 
  AlertCircle, 
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useWhatsAppContactsWithSalesperson, useWhatsAppMessages } from '@/hooks/useWhatsApp';
import { useUsersWithRoles } from '@/hooks/useUsers';
import { differenceInMinutes, isToday, parseISO } from 'date-fns';

interface SalespersonMetrics {
  id: string;
  name: string;
  avatar?: string;
  activeConversations: number;
  avgResponseTime: number; // in minutes
  messagesToday: number;
  pendingResponses: number;
}

export function WhatsAppManagerDashboard() {
  const { data: contacts } = useWhatsAppContactsWithSalesperson();
  const { data: allMessages } = useWhatsAppMessages();
  const { data: users } = useUsersWithRoles();

  // Calculate metrics per salesperson
  const salespersonMetrics = useMemo((): SalespersonMetrics[] => {
    if (!contacts || !users) return [];

    const salespeople = users.filter(u => 
      u.roles?.includes('vendedor')
    );

    return salespeople.map(sp => {
      const spContacts = contacts.filter(c => c.salesperson?.id === sp.id);
      const spMessages = allMessages?.filter(m => 
        spContacts.some(c => c.id === m.contact_id)
      ) || [];

      const todayMessages = spMessages.filter(m => 
        isToday(parseISO(m.created_at)) && m.direction === 'outgoing'
      );

      // Pending = contacts with last message being incoming
      const pending = spContacts.filter(c => {
        const contactMsgs = spMessages.filter(m => m.contact_id === c.id);
        const lastMsg = contactMsgs[contactMsgs.length - 1];
        return lastMsg?.direction === 'incoming';
      });

      // Calculate avg response time (simplified)
      let totalResponseTime = 0;
      let responseCount = 0;
      
      spMessages.forEach((msg, idx) => {
        if (msg.direction === 'outgoing' && idx > 0) {
          const prevMsg = spMessages[idx - 1];
          if (prevMsg.direction === 'incoming') {
            const diff = differenceInMinutes(
              parseISO(msg.created_at),
              parseISO(prevMsg.created_at)
            );
            if (diff > 0 && diff < 1440) { // ignore > 24h
              totalResponseTime += diff;
              responseCount++;
            }
          }
        }
      });

      return {
        id: sp.id,
        name: sp.full_name || sp.email || 'Vendedor',
        avatar: sp.avatar_url || undefined,
        activeConversations: spContacts.length,
        avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0,
        messagesToday: todayMessages.length,
        pendingResponses: pending.length,
      };
    }).sort((a, b) => b.activeConversations - a.activeConversations);
  }, [contacts, allMessages, users]);

  // Global metrics
  const globalMetrics = useMemo(() => {
    const todayMessages = allMessages?.filter(m => 
      isToday(parseISO(m.created_at))
    ) || [];

    const totalPending = salespersonMetrics.reduce((sum, sp) => sum + sp.pendingResponses, 0);
    const avgResponseTime = salespersonMetrics.length > 0
      ? Math.round(salespersonMetrics.reduce((sum, sp) => sum + sp.avgResponseTime, 0) / salespersonMetrics.length)
      : 0;

    return {
      totalConversations: contacts?.length || 0,
      messagesToday: todayMessages.length,
      pendingResponses: totalPending,
      avgResponseTime,
    };
  }, [contacts, allMessages, salespersonMetrics]);

  const getResponseTimeColor = (minutes: number) => {
    if (minutes <= 5) return 'text-green-600';
    if (minutes <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeBadge = (minutes: number) => {
    if (minutes <= 5) return 'default';
    if (minutes <= 15) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Central WhatsApp</h1>
        <p className="text-muted-foreground">
          Monitore todas as conversas da equipe em tempo real
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">Total de contatos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getResponseTimeColor(globalMetrics.avgResponseTime)}`}>
              {globalMetrics.avgResponseTime} min
            </div>
            <p className="text-xs text-muted-foreground">Meta: 5 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.messagesToday}</div>
            <p className="text-xs text-muted-foreground">Enviadas + recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Resposta</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${globalMetrics.pendingResponses > 0 ? 'text-orange-600' : ''}`}>
              {globalMetrics.pendingResponses}
            </div>
            <p className="text-xs text-muted-foreground">Clientes esperando</p>
          </CardContent>
        </Card>
      </div>

      {/* Salespeople Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Performance por Vendedor</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {salespersonMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum vendedor com conversas ativas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-center">Conversas</TableHead>
                  <TableHead className="text-center">Tempo Resposta</TableHead>
                  <TableHead className="text-center">Msgs Hoje</TableHead>
                  <TableHead className="text-center">Pendentes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salespersonMetrics.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sp.avatar} />
                          <AvatarFallback>
                            {sp.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{sp.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{sp.activeConversations}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getResponseTimeBadge(sp.avgResponseTime)}>
                        {sp.avgResponseTime} min
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {sp.messagesToday}
                    </TableCell>
                    <TableCell className="text-center">
                      {sp.pendingResponses > 0 ? (
                        <Badge variant="destructive">{sp.pendingResponses}</Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {sp.avgResponseTime <= 5 ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs">Ótimo</span>
                        </div>
                      ) : sp.avgResponseTime <= 15 ? (
                        <div className="flex items-center justify-center gap-1 text-yellow-600">
                          <span className="text-xs">Regular</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-red-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-xs">Atenção</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
