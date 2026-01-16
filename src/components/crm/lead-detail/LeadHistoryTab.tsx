import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Phone, Mail, MapPin, Users, MoreHorizontal,
  Clock, CheckCircle2, Calendar, User, Filter, ChevronDown,
  AlertCircle, Video, FileText
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCompleteFollowUp } from '@/hooks/useLeadInteractions';

interface Interaction {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
  follow_up_date?: string | null;
  follow_up_completed?: boolean;
  user_profile?: { full_name: string | null } | null;
}

interface LeadHistoryTabProps {
  interactions: Interaction[];
}

const interactionTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  ligacao: { 
    icon: <Phone className="h-4 w-4" />, 
    color: 'bg-blue-500', 
    label: 'Ligação' 
  },
  whatsapp: { 
    icon: <MessageSquare className="h-4 w-4" />, 
    color: 'bg-green-500', 
    label: 'WhatsApp' 
  },
  email: { 
    icon: <Mail className="h-4 w-4" />, 
    color: 'bg-purple-500', 
    label: 'E-mail' 
  },
  visita: { 
    icon: <MapPin className="h-4 w-4" />, 
    color: 'bg-orange-500', 
    label: 'Visita' 
  },
  reuniao: { 
    icon: <Video className="h-4 w-4" />, 
    color: 'bg-cyan-500', 
    label: 'Reunião' 
  },
  outro: { 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-gray-500', 
    label: 'Outro' 
  },
};

function getInteractionConfig(type: string) {
  return interactionTypeConfig[type] || interactionTypeConfig.outro;
}

interface GroupedInteractions {
  label: string;
  date: Date | null;
  interactions: Interaction[];
}

function groupInteractionsByDate(interactions: Interaction[]): GroupedInteractions[] {
  const groups: Map<string, GroupedInteractions> = new Map();
  
  // Sort by date descending
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sorted.forEach(interaction => {
    const date = new Date(interaction.created_at);
    let label: string;
    let groupKey: string;

    if (isToday(date)) {
      label = 'Hoje';
      groupKey = 'today';
    } else if (isYesterday(date)) {
      label = 'Ontem';
      groupKey = 'yesterday';
    } else if (isThisWeek(date)) {
      label = format(date, 'EEEE', { locale: ptBR });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      groupKey = format(date, 'yyyy-MM-dd');
    } else {
      label = format(date, "dd 'de' MMMM", { locale: ptBR });
      groupKey = format(date, 'yyyy-MM-dd');
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { label, date: startOfDay(date), interactions: [] });
    }
    groups.get(groupKey)!.interactions.push(interaction);
  });

  return Array.from(groups.values());
}

function InteractionCard({ interaction }: { interaction: Interaction }) {
  const completeFollowUp = useCompleteFollowUp();
  const config = getInteractionConfig(interaction.type);
  const hasFollowUp = interaction.follow_up_date;
  const followUpCompleted = interaction.follow_up_completed;
  const followUpDate = hasFollowUp ? new Date(interaction.follow_up_date!) : null;
  const isPastDue = followUpDate && !followUpCompleted && followUpDate < new Date();

  return (
    <div className="relative pl-8 pb-6 last:pb-0 group">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-6 bottom-0 w-px bg-border group-last:hidden" />
      
      {/* Timeline Dot */}
      <div className={`absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center text-white ${config.color}`}>
        {config.icon}
      </div>

      {/* Content */}
      <Card className="ml-2 overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(interaction.created_at), 'HH:mm', { locale: ptBR })}
              </span>
            </div>
            {hasFollowUp && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                followUpCompleted 
                  ? 'bg-green-500/10 text-green-600' 
                  : isPastDue 
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-amber-500/10 text-amber-600'
              }`}>
                {followUpCompleted ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Concluído</span>
                  </>
                ) : (
                  <>
                    {isPastDue ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    <span>
                      {format(followUpDate!, 'dd/MM', { locale: ptBR })}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {interaction.description && (
            <p className="text-sm text-foreground leading-relaxed mb-2">
              {interaction.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {interaction.user_profile?.full_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{interaction.user_profile.full_name}</span>
              </div>
            )}
            
            {hasFollowUp && !followUpCompleted && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => completeFollowUp.mutate(interaction.id)}
                disabled={completeFollowUp.isPending}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Marcar como feito
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LeadHistoryTab({ interactions }: LeadHistoryTabProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredInteractions = filter === 'all' 
    ? interactions 
    : interactions.filter(i => i.type === filter);

  const groupedInteractions = groupInteractionsByDate(filteredInteractions);

  // Stats
  const pendingFollowUps = interactions.filter(
    i => i.follow_up_date && !i.follow_up_completed
  ).length;
  
  const completedFollowUps = interactions.filter(
    i => i.follow_up_date && i.follow_up_completed
  ).length;

  if (interactions.length === 0) {
    return (
      <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Nenhuma interação registrada</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Registre ligações, mensagens e visitas na aba "Info" para manter o histórico completo.
          </p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{interactions.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={pendingFollowUps > 0 ? 'border-amber-500/50' : ''}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${pendingFollowUps > 0 ? 'text-amber-500' : ''}`}>
                {pendingFollowUps}
              </p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{completedFollowUps}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            className="shrink-0"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          {Object.entries(interactionTypeConfig).map(([type, config]) => {
            const count = interactions.filter(i => i.type === type).length;
            if (count === 0) return null;
            return (
              <Button
                key={type}
                size="sm"
                variant={filter === type ? 'secondary' : 'ghost'}
                className="shrink-0 gap-1.5"
                onClick={() => setFilter(type)}
              >
                {config.icon}
                <span>{config.label}</span>
                <Badge variant="outline" className="ml-1 h-5 px-1.5">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        <Separator />

        {/* Timeline */}
        <div className="space-y-6">
          {groupedInteractions.map((group) => (
            <div key={group.label}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Interactions */}
              <div className="space-y-0">
                {group.interactions.map((interaction) => (
                  <InteractionCard key={interaction.id} interaction={interaction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
