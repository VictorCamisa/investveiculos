import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, Mail, Car, MessageSquare, Plus, User, 
  MapPin, Calendar, Clock, ExternalLink, Copy, 
  Building2, FileText, Send
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead } from '@/types/crm';
import { leadSourceLabels } from '@/types/crm';
import { useCreateInteraction } from '@/hooks/useLeadInteractions';
import { toast } from 'sonner';

interface LeadInfoTabProps {
  lead: Lead;
  onOpenWhatsApp: () => void;
  onStartNegotiation: () => void;
}

const interactionTypeLabels: Record<string, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  visita: 'Visita',
  reuniao: 'Reunião',
  outro: 'Outro',
};

export function LeadInfoTab({ lead, onOpenWhatsApp, onStartNegotiation }: LeadInfoTabProps) {
  const [interactionType, setInteractionType] = useState('ligacao');
  const [interactionDescription, setInteractionDescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const createInteraction = useCreateInteraction();

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      toast.success('Telefone copiado!');
    }
  };

  const handleCopyEmail = () => {
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
      toast.success('E-mail copiado!');
    }
  };

  const handleAddInteraction = () => {
    if (!interactionDescription.trim()) return;
    
    createInteraction.mutate({
      lead_id: lead.id,
      type: interactionType,
      description: interactionDescription,
      follow_up_date: followUpDate || undefined,
    }, {
      onSuccess: () => {
        setInteractionDescription('');
        setFollowUpDate('');
        toast.success('Interação registrada!');
      }
    });
  };

  const createdAt = lead.created_at ? new Date(lead.created_at) : null;
  const lastInteraction = (lead as any).last_interaction_at ? new Date((lead as any).last_interaction_at) : null;

  return (
    <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 h-12"
            onClick={onOpenWhatsApp}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="default"
            className="h-12"
            onClick={onStartNegotiation}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Negociação
          </Button>
        </div>

        {/* Contact Card - Enhanced */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Phone */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium hover:text-primary">
                    {lead.phone || 'Não informado'}
                  </a>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyPhone}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={`tel:${lead.phone}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-sm font-medium hover:text-primary">
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Não informado</span>
                  )}
                </div>
              </div>
              {lead.email && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyEmail}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Vehicle Interest */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Interesse</p>
                  <p className="text-sm font-medium truncate">
                    {lead.vehicle_interest || 'Não especificado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm font-medium truncate">
                    {leadSourceLabels[lead.source] || lead.source}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Created At */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Cadastrado</p>
                  <p className="text-sm font-medium">
                    {createdAt 
                      ? formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR })
                      : 'N/A'}
                  </p>
                  {createdAt && (
                    <p className="text-[10px] text-muted-foreground">
                      {format(createdAt, 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Interaction */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Última Interação</p>
                  <p className="text-sm font-medium">
                    {lastInteraction 
                      ? formatDistanceToNow(lastInteraction, { addSuffix: true, locale: ptBR })
                      : 'Nenhuma'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned To */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="text-sm font-medium">
                    {lead.assigned_profile?.full_name || 'Não atribuído'}
                  </p>
                </div>
              </div>
              <Badge variant={lead.assigned_to ? 'default' : 'secondary'}>
                {lead.assigned_to ? 'Atribuído' : 'Pendente'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {lead.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* UTM Data */}
        {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Rastreamento UTM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lead.utm_source && (
                  <Badge variant="outline" className="text-xs">
                    source: {lead.utm_source}
                  </Badge>
                )}
                {lead.utm_medium && (
                  <Badge variant="outline" className="text-xs">
                    medium: {lead.utm_medium}
                  </Badge>
                )}
                {lead.utm_campaign && (
                  <Badge variant="outline" className="text-xs">
                    campaign: {lead.utm_campaign}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Quick Interaction Form - Enhanced */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Registrar Nova Interação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(interactionTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Textarea
              placeholder="Descreva o contato realizado..."
              value={interactionDescription}
              onChange={(e) => setInteractionDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Agendar follow-up (opcional)
                </label>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddInteraction}
                  disabled={!interactionDescription.trim() || createInteraction.isPending}
                  className="h-10"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
