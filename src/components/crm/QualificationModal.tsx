import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeadScoreIndicator } from './LeadScoreIndicator';
import { 
  useScoreCalculation, 
  calculateEngagementScore, 
  calculateIntentScore,
  getScoreClassification 
} from '@/hooks/useLeadQualification';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, MessageCircle, Phone, Calendar, User } from 'lucide-react';
import type { Negotiation } from '@/types/negotiations';
import type { QualificationFormData, ScoreBreakdown } from '@/types/qualification';
import { PAYMENT_METHODS, PURCHASE_TIMELINES } from '@/types/qualification';

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
  trade_in_value: null,
  purchase_timeline: '',
  decision_maker: true,
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

  // Calculate score
  const score = useScoreCalculation(messages, formData);
  const classification = getScoreClassification(score.total);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Ficha de Qualificação
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do lead para calcular a pontuação e atribuir ao vendedor
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Left Panel - Lead Info + Score */}
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold text-sm">Informações do Lead</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{negotiation.lead?.name || 'Sem nome'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{negotiation.lead?.phone || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{negotiation.lead?.source || 'WhatsApp'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
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
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-4 text-center">Pontuação do Lead</h3>
                <div className="flex justify-center">
                  <LeadScoreIndicator score={score} size="lg" showBreakdown={true} />
                </div>
              </div>
              
              {/* Warning for cold leads */}
              {classification === 'cold' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Lead com baixa pontuação. Considere coletar mais informações antes de qualificar.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Center Panel - WhatsApp Conversation */}
            <div className="rounded-lg border flex flex-col">
              <div className="p-3 border-b bg-muted/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Conversa WhatsApp
                  <Badge variant="secondary" className="ml-auto">
                    {messages.length} msgs
                  </Badge>
                </h3>
              </div>
              <ScrollArea className="flex-1 p-3 max-h-[400px]">
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
              </ScrollArea>
            </div>
            
            {/* Right Panel - Qualification Form */}
            <ScrollArea className="rounded-lg border p-4 max-h-[500px]">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Dados de Qualificação</h3>
                
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
                          {timeline.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                {/* Trade-in */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_trade_in"
                      checked={formData.has_trade_in}
                      onCheckedChange={(checked) => updateFormField('has_trade_in', !!checked)}
                    />
                    <Label htmlFor="has_trade_in">Tem veículo para troca?</Label>
                  </div>
                  
                  {formData.has_trade_in && (
                    <div className="space-y-2 pl-6">
                      <Input
                        value={formData.trade_in_vehicle}
                        onChange={(e) => updateFormField('trade_in_vehicle', e.target.value)}
                        placeholder="Descrição do veículo"
                      />
                      <Input
                        type="number"
                        value={formData.trade_in_value || ''}
                        onChange={(e) => updateFormField('trade_in_value', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Valor esperado (R$)"
                      />
                    </div>
                  )}
                </div>
                
                {/* Decision Maker */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="decision_maker"
                    checked={formData.decision_maker}
                    onCheckedChange={(checked) => updateFormField('decision_maker', !!checked)}
                  />
                  <Label htmlFor="decision_maker">É o decisor da compra?</Label>
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormField('notes', e.target.value)}
                    placeholder="Informações adicionais sobre o lead..."
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {classification === 'cold' && (
              <span className="text-destructive font-medium">
                ⚠️ Lead frio - Considere mais qualificação
              </span>
            )}
            {classification === 'warm' && (
              <span className="text-yellow-600 font-medium">
                🌡️ Lead morno - Bom potencial
              </span>
            )}
            {classification === 'hot' && (
              <span className="text-green-600 font-medium">
                🔥 Lead quente - Alta probabilidade!
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              ✓ Qualificar e Atribuir Vendedor
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
