import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeadScoreIndicator } from './LeadScoreIndicator';
import { 
  useScoreCalculation, 
  getScoreClassification,
  getClassificationMessage
} from '@/hooks/useLeadQualification';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, MessageCircle, Phone, Calendar, User, CheckCircle2, Info } from 'lucide-react';
import type { Negotiation } from '@/types/negotiations';
import type { QualificationFormData, ScoreBreakdown } from '@/types/qualification';
import { PAYMENT_METHODS, PURCHASE_TIMELINES, VEHICLE_USAGE } from '@/types/qualification';

interface QualificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negotiation: Negotiation | null;
  onConfirm: (data: QualificationFormData, score: ScoreBreakdown) => void;
}

interface WhatsAppMessage {
  id: string;
  content: string | null;
  direction: string | null;
  created_at: string | null;
}

const defaultFormData: QualificationFormData = {
  vehicle_interest: '',
  budget_min: null,
  budget_max: null,
  down_payment: null,
  max_installment: null,
  payment_method: '',
  has_trade_in: false,
  trade_in_vehicle: '',
  purchase_timeline: '',
  vehicle_usage: '',
  notes: '',
};

export function QualificationModal({ 
  open, 
  onOpenChange, 
  negotiation,
  onConfirm 
}: QualificationModalProps) {
  const [formData, setFormData] = useState<QualificationFormData>(defaultFormData);
  
  // Reset form when modal opens
  useEffect(() => {
    if (open && negotiation) {
      setFormData({
        ...defaultFormData,
        vehicle_interest: negotiation.vehicle 
          ? `${negotiation.vehicle.brand} ${negotiation.vehicle.model}` 
          : negotiation.lead?.vehicle_interest || '',
      });
    }
  }, [open, negotiation]);

  // Fetch WhatsApp messages for this lead
  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages', negotiation?.lead?.phone],
    queryFn: async (): Promise<WhatsAppMessage[]> => {
      if (!negotiation?.lead?.phone) return [];
      
      // Get contact by phone
      const { data: contacts } = await supabase
        .from('whatsapp_contacts')
        .select('id')
        .eq('phone', negotiation.lead.phone) as { data: { id: string }[] | null };
      
      if (!contacts || contacts.length === 0) return [];
      
      const contactIds: string[] = contacts.map(c => c.id);
      
      // Get messages
      const { data: msgs } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: true });
      
      return (msgs || []) as WhatsAppMessage[];
    },
    enabled: open && !!negotiation?.lead?.phone,
  });

  // Calculate score with new 50/50 logic
  const score = useScoreCalculation(messages, formData);
  const classification = getScoreClassification(score.total);
  const classificationMessage = getClassificationMessage(classification);

  const handleConfirm = () => {
    onConfirm(formData, score);
  };

  const updateFormField = <K extends keyof QualificationFormData>(
    field: K, 
    value: QualificationFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!negotiation) return null;

  // Get alert styling based on classification
  const getAlertStyling = () => {
    switch (classification) {
      case 'hot':
        return {
          variant: 'default' as const,
          className: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
          icon: <CheckCircle2 className="h-4 w-4" />
        };
      case 'warm':
        return {
          variant: 'default' as const,
          className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
          icon: <Info className="h-4 w-4" />
        };
      case 'cold':
        return {
          variant: 'destructive' as const,
          className: '',
          icon: <AlertTriangle className="h-4 w-4" />
        };
    }
  };

  const alertStyling = getAlertStyling();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            📋 Ficha de Qualificação
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do lead para calcular a pontuação e atribuir ao vendedor
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Panel - Lead Info + Score */}
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Informações do Lead</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{negotiation.lead?.name || 'Sem nome'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{negotiation.lead?.phone || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{negotiation.lead?.source || 'WhatsApp'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {negotiation.created_at 
                        ? formatDistanceToNow(new Date(negotiation.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })
                        : 'Recente'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Score Indicator */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold text-sm mb-4 text-center">Pontuação do Lead</h3>
                <div className="flex justify-center">
                  <LeadScoreIndicator score={score} size="lg" showBreakdown={true} />
                </div>
              </div>
            </div>
            
            {/* Center Panel - WhatsApp Conversation */}
            <div className="rounded-lg border bg-card flex flex-col min-h-[300px] max-h-[400px]">
              <div className="p-3 border-b bg-muted/50 shrink-0">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Conversa WhatsApp
                  <Badge variant="secondary" className="ml-auto">
                    {messages.length} msgs
                  </Badge>
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma mensagem encontrada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.direction === 'incoming'
                                ? 'bg-muted'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${
                              msg.direction === 'incoming' 
                                ? 'text-muted-foreground' 
                                : 'text-primary-foreground/70'
                            }`}>
                              {msg.created_at 
                                ? format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })
                                : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Right Panel - Qualification Form */}
            <div className="rounded-lg border bg-card flex flex-col min-h-[300px] max-h-[400px]">
              <div className="p-3 border-b bg-muted/50 shrink-0">
                <h3 className="font-semibold text-sm">Dados de Qualificação</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Vehicle Interest */}
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_interest">Veículo de Interesse</Label>
                    <Input
                      id="vehicle_interest"
                      value={formData.vehicle_interest}
                      onChange={(e) => updateFormField('vehicle_interest', e.target.value)}
                      placeholder="Ex: Honda Civic 2020"
                    />
                  </div>
                  
                  {/* Budget Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="budget_min">Orçamento Mín</Label>
                      <Input
                        id="budget_min"
                        type="number"
                        value={formData.budget_min || ''}
                        onChange={(e) => updateFormField('budget_min', e.target.value ? Number(e.target.value) : null)}
                        placeholder="R$ 50.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget_max">Orçamento Máx</Label>
                      <Input
                        id="budget_max"
                        type="number"
                        value={formData.budget_max || ''}
                        onChange={(e) => updateFormField('budget_max', e.target.value ? Number(e.target.value) : null)}
                        placeholder="R$ 80.000"
                      />
                    </div>
                  </div>
                  
                  {/* Down Payment */}
                  <div className="space-y-2">
                    <Label htmlFor="down_payment">Valor de Entrada</Label>
                    <Input
                      id="down_payment"
                      type="number"
                      value={formData.down_payment || ''}
                      onChange={(e) => updateFormField('down_payment', e.target.value ? Number(e.target.value) : null)}
                      placeholder="R$ 15.000"
                    />
                  </div>
                  
                  {/* Max Installment */}
                  <div className="space-y-2">
                    <Label htmlFor="max_installment">Parcela Máxima</Label>
                    <Input
                      id="max_installment"
                      type="number"
                      value={formData.max_installment || ''}
                      onChange={(e) => updateFormField('max_installment', e.target.value ? Number(e.target.value) : null)}
                      placeholder="R$ 1.500"
                    />
                  </div>
                  
                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => updateFormField('payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Purchase Timeline */}
                  <div className="space-y-2">
                    <Label>Prazo para Compra</Label>
                    <Select
                      value={formData.purchase_timeline}
                      onValueChange={(value) => updateFormField('purchase_timeline', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PURCHASE_TIMELINES.map((timeline) => (
                          <SelectItem key={timeline.value} value={timeline.value}>
                            {timeline.label} {timeline.points > 0 ? `(+${timeline.points} pts)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Vehicle Usage */}
                  <div className="space-y-2">
                    <Label>Uso Principal do Veículo</Label>
                    <Select
                      value={formData.vehicle_usage}
                      onValueChange={(value) => updateFormField('vehicle_usage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_USAGE.map((usage) => (
                          <SelectItem key={usage.value} value={usage.value}>
                            {usage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  {/* Trade-in with Radio Buttons */}
                  <div className="space-y-3">
                    <Label>Possui Veículo para Troca?</Label>
                    <RadioGroup
                      value={formData.has_trade_in ? 'sim' : 'nao'}
                      onValueChange={(value) => updateFormField('has_trade_in', value === 'sim')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="trade_in_yes" />
                        <Label htmlFor="trade_in_yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="trade_in_no" />
                        <Label htmlFor="trade_in_no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                    
                    {formData.has_trade_in && (
                      <div className="space-y-2 mt-2">
                        <Label htmlFor="trade_in_vehicle">Modelo do Veículo de Troca</Label>
                        <Input
                          id="trade_in_vehicle"
                          value={formData.trade_in_vehicle}
                          onChange={(e) => updateFormField('trade_in_vehicle', e.target.value)}
                          placeholder="Ex: Gol 2018 1.0"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateFormField('notes', e.target.value)}
                      placeholder="Informações adicionais..."
                      rows={2}
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t px-6 py-4 space-y-3 shrink-0 bg-background">
          {/* Classification Message Alert */}
          <Alert variant={alertStyling.variant} className={alertStyling.className}>
            {alertStyling.icon}
            <AlertDescription className="font-medium">
              {classificationMessage}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              ✓ Qualificar e Atribuir Vendedor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
