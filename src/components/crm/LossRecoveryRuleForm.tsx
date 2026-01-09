import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { lossReasonLabels, LossReasonType } from '@/types/negotiations';
import { ActionType, actionTypeLabels } from '@/hooks/useLossRecoveryRules';

interface LossRecoveryRuleFormData {
  name: string;
  description?: string;
  trigger_loss_reasons: string[];
  action_type: ActionType;
  delay_days: number;
  delay_hours: number;
  message_template?: string;
  include_vehicle_info: boolean;
  include_salesperson_name: boolean;
  auto_create_alert: boolean;
  alert_price_range_percent: number;
  alert_year_range: number;
  max_attempts_per_lead: number;
  priority: number;
}

interface LossRecoveryRuleFormProps {
  initialData?: Partial<LossRecoveryRuleFormData> & { id?: string };
  onSubmit: (data: LossRecoveryRuleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LossRecoveryRuleForm({ initialData, onSubmit, onCancel, isLoading }: LossRecoveryRuleFormProps) {
  const [formData, setFormData] = useState<LossRecoveryRuleFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    trigger_loss_reasons: initialData?.trigger_loss_reasons || [],
    action_type: initialData?.action_type || 'whatsapp_message',
    delay_days: initialData?.delay_days || 0,
    delay_hours: initialData?.delay_hours || 0,
    message_template: initialData?.message_template || '',
    include_vehicle_info: initialData?.include_vehicle_info ?? true,
    include_salesperson_name: initialData?.include_salesperson_name ?? true,
    auto_create_alert: initialData?.auto_create_alert ?? false,
    alert_price_range_percent: initialData?.alert_price_range_percent || 20,
    alert_year_range: initialData?.alert_year_range || 1,
    max_attempts_per_lead: initialData?.max_attempts_per_lead || 3,
    priority: initialData?.priority || 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleLossReason = (reason: string) => {
    setFormData(prev => ({
      ...prev,
      trigger_loss_reasons: prev.trigger_loss_reasons.includes(reason)
        ? prev.trigger_loss_reasons.filter(r => r !== reason)
        : [...prev.trigger_loss_reasons, reason],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome da Regra *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Reengajamento - Preço Alto"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o objetivo desta regra..."
            rows={2}
          />
        </div>
      </div>

      {/* Trigger: Loss Reasons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gatilho: Motivos de Perda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Selecione os motivos de perda que acionarão esta regra:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(lossReasonLabels).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`reason-${key}`}
                  checked={formData.trigger_loss_reasons.includes(key)}
                  onCheckedChange={() => toggleLossReason(key)}
                />
                <Label htmlFor={`reason-${key}`} className="text-sm cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de Ação *</Label>
            <Select
              value={formData.action_type}
              onValueChange={(value: ActionType) => setFormData({ ...formData, action_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(actionTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delay_days">Atraso (dias)</Label>
              <Input
                id="delay_days"
                type="number"
                min="0"
                value={formData.delay_days}
                onChange={(e) => setFormData({ ...formData, delay_days: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="delay_hours">Atraso (horas)</Label>
              <Input
                id="delay_hours"
                type="number"
                min="0"
                max="23"
                value={formData.delay_hours}
                onChange={(e) => setFormData({ ...formData, delay_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* WhatsApp Message Options */}
          {formData.action_type === 'whatsapp_message' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="message_template">Template da Mensagem</Label>
                <Textarea
                  id="message_template"
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  placeholder="Olá {nome}! Notamos que você tinha interesse em {veiculo}..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis: {'{nome}'}, {'{veiculo}'}, {'{vendedor}'}, {'{empresa}'}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_vehicle_info"
                    checked={formData.include_vehicle_info}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_vehicle_info: !!checked })}
                  />
                  <Label htmlFor="include_vehicle_info" className="text-sm">Incluir info do veículo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_salesperson_name"
                    checked={formData.include_salesperson_name}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_salesperson_name: !!checked })}
                  />
                  <Label htmlFor="include_salesperson_name" className="text-sm">Incluir nome do vendedor</Label>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Alert Options */}
          {formData.action_type === 'create_vehicle_alert' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_create_alert"
                  checked={formData.auto_create_alert}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_create_alert: !!checked })}
                />
                <Label htmlFor="auto_create_alert" className="text-sm">Criar alerta automaticamente</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alert_price_range">Variação de preço (%)</Label>
                  <Input
                    id="alert_price_range"
                    type="number"
                    min="5"
                    max="50"
                    value={formData.alert_price_range_percent}
                    onChange={(e) => setFormData({ ...formData, alert_price_range_percent: parseInt(e.target.value) || 20 })}
                  />
                </div>
                <div>
                  <Label htmlFor="alert_year_range">Variação de ano (±)</Label>
                  <Input
                    id="alert_year_range"
                    type="number"
                    min="0"
                    max="5"
                    value={formData.alert_year_range}
                    onChange={(e) => setFormData({ ...formData, alert_year_range: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Condições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_attempts">Máximo de tentativas por lead</Label>
              <Input
                id="max_attempts"
                type="number"
                min="1"
                max="10"
                value={formData.max_attempts_per_lead}
                onChange={(e) => setFormData({ ...formData, max_attempts_per_lead: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div>
              <Label htmlFor="priority">Prioridade (menor = maior)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name || formData.trigger_loss_reasons.length === 0}>
          {isLoading ? 'Salvando...' : initialData?.id ? 'Atualizar' : 'Criar Regra'}
        </Button>
      </div>
    </form>
  );
}
