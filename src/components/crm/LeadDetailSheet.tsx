import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Phone, Mail, Calendar, User, Car, MessageSquare, 
  Plus, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import type { Lead } from '@/types/crm';
import { leadStatusLabels, leadStatusColors, leadSourceLabels } from '@/types/crm';
import { useLeadInteractions, useCreateInteraction, useCompleteFollowUp } from '@/hooks/useLeadInteractions';
import { useNegotiations } from '@/hooks/useNegotiations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { negotiationStatusLabels, negotiationStatusColors } from '@/types/negotiations';
import { WhatsAppChatModal } from '@/components/whatsapp/WhatsAppChatModal';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartNegotiation?: (leadId: string, salespersonId?: string) => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange, onStartNegotiation }: LeadDetailSheetProps) {
  const { data: interactions = [] } = useLeadInteractions(lead?.id || '');
  const { data: allNegotiations = [] } = useNegotiations();
  const createInteraction = useCreateInteraction();
  const completeFollowUp = useCompleteFollowUp();

  const [interactionType, setInteractionType] = useState('ligacao');
  const [interactionDescription, setInteractionDescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const leadNegotiations = allNegotiations.filter(n => n.lead_id === lead?.id);

  const handleAddInteraction = () => {
    if (!lead || !interactionDescription.trim()) return;
    
    createInteraction.mutate({
      lead_id: lead.id,
      type: interactionType,
      description: interactionDescription,
      follow_up_date: followUpDate || undefined,
    }, {
      onSuccess: () => {
        setInteractionDescription('');
        setFollowUpDate('');
      }
    });
  };

  if (!lead) return null;

  const interactionTypeLabels: Record<string, string> = {
    ligacao: 'Ligação',
    whatsapp: 'WhatsApp',
    email: 'E-mail',
    visita: 'Visita',
    reuniao: 'Reunião',
    outro: 'Outro',
  };

  // Find last incoming message for SLA calculation
  const lastCustomerMessageAt = undefined; // Will be calculated from messages

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{lead.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={leadStatusColors[lead.status]}>
                  {leadStatusLabels[lead.status]}
                </Badge>
                <Badge variant="outline">{leadSourceLabels[lead.source]}</Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="info" className="text-xs sm:text-sm">Info</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">Histórico</TabsTrigger>
            <TabsTrigger value="negotiations" className="text-xs sm:text-sm">Negociações</TabsTrigger>
          </TabsList>

          {/* WhatsApp Modal */}
          <WhatsAppChatModal
            open={whatsappModalOpen}
            onOpenChange={setWhatsappModalOpen}
            leadId={lead.id}
            phone={lead.phone}
            leadName={lead.name}
            lastCustomerMessageAt={lastCustomerMessageAt}
          />


          <TabsContent value="info" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
              <div className="space-y-4">
                {/* WhatsApp Button */}
                <Button
                  variant="default"
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => setWhatsappModalOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Abrir Chat WhatsApp
                </Button>

                {/* Contact Info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Contato</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${lead.phone}`} className="hover:text-primary">{lead.phone}</a>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Interest */}
                {lead.vehicle_interest && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Interesse</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.vehicle_interest}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned To */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Responsável</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.assigned_profile?.full_name || 'Não atribuído'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {lead.notes && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                      <p className="text-sm">{lead.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Interaction Form */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Registrar Contato
                    </h4>
                    <div className="space-y-3">
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
                        placeholder="Descreva o contato..."
                        value={interactionDescription}
                        onChange={(e) => setInteractionDescription(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="datetime-local"
                          placeholder="Follow-up"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddInteraction}
                          disabled={!interactionDescription.trim() || createInteraction.isPending}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Start Negotiation Button */}
                <Button
                  className="w-full"
                  onClick={() => onStartNegotiation?.(lead.id, lead.assigned_to || undefined)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Negociação
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
              <div className="space-y-3">
                {interactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma interação registrada</p>
                  </div>
                ) : (
                  interactions.map((interaction) => (
                    <Card key={interaction.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {interactionTypeLabels[interaction.type] || interaction.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm">{interaction.description}</p>
                            {interaction.user_profile?.full_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Por: {interaction.user_profile.full_name}
                              </p>
                            )}
                          </div>
                          {/* Follow-up indicator */}
                          {'follow_up_date' in interaction && interaction.follow_up_date && (
                            <div className="shrink-0">
                              {'follow_up_completed' in interaction && interaction.follow_up_completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2"
                                  onClick={() => completeFollowUp.mutate(interaction.id)}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span className="text-xs">
                                    {format(new Date(interaction.follow_up_date as string), 'dd/MM', { locale: ptBR })}
                                  </span>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="negotiations" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
              <div className="space-y-3">
                {leadNegotiations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma negociação</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => onStartNegotiation?.(lead.id, lead.assigned_to || undefined)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Iniciar Primeira Negociação
                    </Button>
                  </div>
                ) : (
                  leadNegotiations.map((negotiation) => (
                    <Card key={negotiation.id}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={negotiationStatusColors[negotiation.status]}>
                            {negotiationStatusLabels[negotiation.status]}
                          </Badge>
                          {negotiation.estimated_value && (
                            <span className="font-semibold text-sm">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(negotiation.estimated_value)}
                            </span>
                          )}
                        </div>
                        {negotiation.vehicle && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Car className="h-3 w-3" />
                            <span>{negotiation.vehicle.brand} {negotiation.vehicle.model}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Criada em {format(new Date(negotiation.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        {negotiation.loss_reason && (
                          <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                            Motivo da perda: {negotiation.loss_reason}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
